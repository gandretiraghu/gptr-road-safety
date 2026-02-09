
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();
const app = express();

app.use(cors({ origin: true }));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// --- SECURITY KEYS (SECURE RUNTIME CONFIG) ---
// We access keys from firebase functions:config set via CLI
// Structure: functions.config().gptr.nav_key
const KEYS = {
    // Falls back to defaults ONLY for local testing. 
    // In production, these will come from the secure environment config.
    NAV_PUBLIC: (functions.config().gptr && functions.config().gptr.nav_key) || "GPTR_OPEN_NAV_2025", 
    GOVT_SECURE: (functions.config().gptr && functions.config().gptr.govt_key) || "GPTR_SECURE_GOVT_2025" 
};

// Rate Limiter
const rateLimit = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; 
    const MAX_REQUESTS = 100;

    if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, startTime: now });
    } else {
        const data = rateLimit.get(ip);
        if (now - data.startTime > WINDOW_MS) {
            rateLimit.set(ip, { count: 1, startTime: now });
        } else {
            data.count++;
            if (data.count > MAX_REQUESTS) {
                return res.status(429).json({ status: "error", message: "Rate limit exceeded." });
            }
        }
    }
    next();
};
app.use(rateLimiter);

const formatNavigationPayload = (doc) => {
    const data = doc.data();
    return {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0,
        severity: data.analysis?.severity || "Unknown",
        type: data.analysis?.hazard_type || "hazard",
        last_updated: data.timestamp
    };
};

const formatGovtPayload = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        location: data.location,
        address: data.addressContext,
        severity: data.analysis?.severity,
        cost_est: data.analysis?.repair_info?.estimated_cost_inr,
        status: data.analysis?.repair_quality_audit?.status || "Pending",
        image: data.image
    };
};

// --- PUBLIC NAV API ---
app.get("/navigate", async (req, res) => {
    const providedKey = req.query.key;

    // Secure Check
    if (!providedKey || providedKey !== KEYS.NAV_PUBLIC) {
        return res.status(403).json({
            status: "forbidden",
            message: "Access Denied: Invalid API Key. Contact administrator."
        });
    }

    try {
        const snapshot = await db.collection("reports").orderBy("timestamp", "desc").limit(50).get();
        const navData = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.reportType === "hazard" && data.analysis?.repair_quality_audit?.status !== "GENUINE_REPAIR") {
                navData.push(formatNavigationPayload(doc));
            }
        });

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600'); 
        res.status(200).json({ status: "success", count: navData.length, data: navData });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
});

// --- GOVT API ---
app.get("/civic", async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== KEYS.GOVT_SECURE) {
        return res.status(401).json({
            status: "access_denied",
            message: "Unauthorized: Invalid Credentials."
        });
    }

    try {
        const snapshot = await db.collection("reports").orderBy("timestamp", "desc").limit(100).get();
        const civicData = [];
        snapshot.forEach(doc => civicData.push(formatGovtPayload(doc)));

        res.status(200).json({ status: "success", count: civicData.length, data: civicData });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
});

exports.api = functions.https.onRequest(app);
