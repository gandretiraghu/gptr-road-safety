
import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, increment } from "firebase/firestore";
import { UserProfile, Report } from "../types";

const USERS_COL = "users";
const REPORTS_COL = "reports";

/**
 * Creates or Updates a user profile in Firestore
 */
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, USERS_COL, uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        const newUser: UserProfile = {
            uid,
            email: data.email || "",
            name: data.name || "Citizen",
            district: data.district || "Unknown",
            state: data.state || "Unknown",
            points: 0,
            reportsCount: 0,
            joinedAt: Date.now()
        };
        await setDoc(userRef, newUser);
        return newUser;
    }
    return snap.data() as UserProfile;
};

/**
 * Get User Profile
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, USERS_COL, uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
};

/**
 * Add Points to User (10 points per report)
 */
export const awardPoints = async (uid: string) => {
    const userRef = doc(db, USERS_COL, uid);
    await updateDoc(userRef, {
        points: increment(10),
        reportsCount: increment(1)
    });
};

/**
 * Fetch Leaderboard (Top 10)
 */
export const getLeaderboard = async (): Promise<UserProfile[]> => {
    const q = query(collection(db, USERS_COL), orderBy("points", "desc"), limit(10));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
};

/**
 * Fetch User Reports History
 */
export const getUserReports = async (uid: string): Promise<Report[]> => {
    const q = query(collection(db, REPORTS_COL), where("userId", "==", uid));
    const snap = await getDocs(q);
    
    const reports = snap.docs.map(d => d.data() as Report);
    
    // Sort by timestamp (Latest first) here using JavaScript
    return reports.sort((a, b) => b.timestamp - a.timestamp);
};

/**
 * Generate Appreciation Certificate
 */
export const generateCertificate = async (user: UserProfile): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
        gradient.addColorStop(0, "#f8fafc");
        gradient.addColorStop(1, "#e2e8f0");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 20;
        ctx.strokeRect(40, 40, 1120, 720);

        // Corner Decorations
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(20, 20, 100, 20);
        ctx.fillRect(20, 20, 20, 100);
        ctx.fillRect(1080, 20, 100, 20);
        ctx.fillRect(1160, 20, 20, 100);
        
        ctx.fillRect(20, 760, 100, 20);
        ctx.fillRect(20, 680, 20, 100);
        ctx.fillRect(1080, 760, 100, 20);
        ctx.fillRect(1160, 680, 20, 100);

        // Content
        ctx.font = "bold 60px 'Times New Roman', serif";
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.fillText("CERTIFICATE OF APPRECIATION", 600, 150);

        ctx.font = "italic 30px 'Arial', sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText("Proudly presented to", 600, 240);

        ctx.font = "bold 80px 'Arial', sans-serif";
        ctx.fillStyle = "#0f172a"; // Name Color
        ctx.fillText(user.name.toUpperCase(), 600, 350);

        ctx.font = "30px 'Arial', sans-serif";
        ctx.fillStyle = "#334155";
        ctx.fillText(`For their outstanding contribution to Road Safety in ${user.district}, ${user.state}.`, 600, 450);
        
        ctx.fillText(`They have successfully reported ${user.reportsCount} hazards and`, 600, 500);
        ctx.fillText(`earned ${user.points} Safety Points.`, 600, 550);

        // Badge
        ctx.beginPath();
        ctx.arc(600, 650, 60, 0, 2 * Math.PI);
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#b45309";
        ctx.stroke();
        
        ctx.font = "bold 20px 'Arial', sans-serif";
        ctx.fillStyle = "#78350f";
        ctx.fillText("GPTR", 600, 645);
        ctx.fillText("HERO", 600, 670);

        // Footer
        ctx.font = "20px 'Arial', sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Global Pothole & Traffic Risk Reporting System", 600, 750);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
    });
};
