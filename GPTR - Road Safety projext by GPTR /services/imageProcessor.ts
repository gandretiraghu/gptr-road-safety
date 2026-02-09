
import { GeoLocation, Report, Severity, AddressContext } from '../types';
import { OFFICIAL_HANDLES } from '../data/officialHandles';
import imageCompression from 'browser-image-compression';

/**
 * RULE 8: Client-Side Compression
 * Compresses image to < 200KB before any processing/uploading.
 */
export const compressImage = async (file: File): Promise<File> => {
    try {
        const options = {
            maxSizeMB: 0.3, // Increased slightly to 300KB to maintain text clarity in watermark
            maxWidthOrHeight: 1280,
            useWebWorker: true,
            initialQuality: 0.8
        };

        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed: ${(file.size/1024).toFixed(2)}KB -> ${(compressedFile.size/1024).toFixed(2)}KB`);
        return compressedFile;
    } catch (error) {
        console.error("Compression failed:", error);
        return file; // Fallback to original
    }
};

/**
 * Helper: Resolve handles for the image text
 */
const getHandlesText = (report: Report): string => {
     const address = report.addressContext;
     let country = address?.country || "India";
     if (country.toLowerCase().includes("india") || country.toLowerCase().includes("bharat")) country = "India";
     
     const stateName = address?.state;
     const countryData = OFFICIAL_HANDLES[country];
     
     if (countryData && stateName) {
         const stateData = countryData[stateName];
         if (stateData) {
             return stateData.road_dept.split(' ')[0]; 
         }
     }
     return "@RoadAuthority";
};

interface WatermarkOptions {
    riskScore?: number;
    address?: AddressContext;
    reporterName?: string;
    isFinalUpload?: boolean; // If true, creates the 70/30 layout. If false, just overlays basic GPS.
}

export const processAndWatermarkImage = async (
  fileOrBase64: File | string, 
  location: GeoLocation | null,
  options: WatermarkOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (typeof fileOrBase64 === 'string') {
        img.src = fileOrBase64;
    } else {
        img.src = URL.createObjectURL(fileOrBase64);
    }

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject("Canvas context not available");
            return;
        }

        // Standard Width for consistency
        const TARGET_WIDTH = 1000;
        const scale = TARGET_WIDTH / img.width;
        const imgHeight = img.height * scale;

        if (options.isFinalUpload) {
            // --- FINAL UPLOAD LAYOUT (70% PHOTO / 30% DATA) ---
            // Calculate total height: Image acts as 70%, so Footer is the remaining 30% relative to the whole.
            // Actually, usually it's easier to append footer. Let's append a footer that is ~45% of image height to hold all data.
            const footerHeight = imgHeight * 0.45; 
            const totalHeight = imgHeight + footerHeight;

            canvas.width = TARGET_WIDTH;
            canvas.height = totalHeight;

            // 1. Draw Image (Top Section)
            ctx.drawImage(img, 0, 0, TARGET_WIDTH, imgHeight);

            // 2. Draw Footer Background (Bottom Section)
            ctx.fillStyle = "#111827"; // Slate-900 (Dark background)
            ctx.fillRect(0, imgHeight, TARGET_WIDTH, footerHeight);

            // 3. Draw Divider Line
            ctx.strokeStyle = "#eab308"; // Yellow-500
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, imgHeight);
            ctx.lineTo(TARGET_WIDTH, imgHeight);
            ctx.stroke();

            // --- DATA STAMPING ---
            const padding = 40;
            let currentY = imgHeight + 60;
            const lineHeight = 45;

            // A. Risk Score & Title
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 36px sans-serif";
            const riskText = options.riskScore ? `RISK SCORE: ${options.riskScore}%` : "ANALYSIS PENDING";
            
            // Color code the risk
            if (options.riskScore && options.riskScore > 70) ctx.fillStyle = "#ef4444"; // Red
            else if (options.riskScore && options.riskScore > 40) ctx.fillStyle = "#facc15"; // Yellow
            else ctx.fillStyle = "#4ade80"; // Green
            
            ctx.fillText(riskText, padding, currentY);
            
            // GPTR Badge on Right
            ctx.textAlign = "right";
            ctx.fillStyle = "#3b82f6";
            ctx.font = "bold 28px sans-serif";
            ctx.fillText("GPTR VERIFIED", TARGET_WIDTH - padding, currentY);
            ctx.textAlign = "left"; // Reset

            currentY += lineHeight * 1.5;

            // B. GPS Coordinates
            ctx.fillStyle = "#9ca3af"; // Gray-400
            ctx.font = "24px sans-serif";
            const lat = location ? location.lat.toFixed(6) : "N/A";
            const lng = location ? location.lng.toFixed(6) : "N/A";
            ctx.fillText(`📍 GPS: ${lat}, ${lng}`, padding, currentY);
            currentY += lineHeight;

            // C. Date & Time
            const dateObj = new Date();
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            ctx.fillText(`📅 ${dateStr} • ${timeStr}`, padding, currentY);
            currentY += lineHeight;

            // D. Full Address (Multi-line text handling)
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 26px sans-serif";
            let addressText = "Locating...";
            if (options.address) {
                // Construct the full address string requested
                const parts = [
                    options.address.street,
                    options.address.city,
                    options.address.district,
                    options.address.state,
                    options.address.postalCode
                ].filter(p => p && p !== "Unknown" && p !== "Road"); // Filter empty/junk
                addressText = parts.join(", ");
            }
            
            // Wrap text logic
            const maxWidth = TARGET_WIDTH - (padding * 2);
            const words = addressText.split(' ');
            let line = '';
            
            for(let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, padding, currentY);
                    line = words[n] + ' ';
                    currentY += 35; // Address Line Height
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, padding, currentY);
            currentY += lineHeight * 1.5;

            // E. Reporter Name
            ctx.fillStyle = "#eab308"; // Yellow
            ctx.font = "bold 24px sans-serif";
            const reporter = options.reporterName || "Anonymous Citizen";
            ctx.fillText(`👤 Reported by: ${reporter}`, padding, currentY);

        } else {
            // --- PREVIEW LAYOUT (Just Image + Simple Overlay) ---
            canvas.width = TARGET_WIDTH;
            canvas.height = imgHeight;

            ctx.drawImage(img, 0, 0, TARGET_WIDTH, imgHeight);

            // Simple Gradient at bottom
            const gradient = ctx.createLinearGradient(0, canvas.height - 150, 0, canvas.height);
            gradient.addColorStop(0, "transparent");
            gradient.addColorStop(1, "rgba(0,0,0,0.8)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

            // Simple GPS Text
            ctx.font = "bold 24px sans-serif";
            ctx.fillStyle = "white";
            ctx.fillText(`📍 ${location?.lat.toFixed(5)}, ${location?.lng.toFixed(5)}`, 20, canvas.height - 20);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = (err) => reject(err);
  });
};

/**
 * Generates a "Share Card" with Image on Top and Data Panel on Bottom.
 * UPDATED: Includes Risk Score, Impact Score, and Sensitive Zones.
 */
export const generateShareCard = async (base64OrUrl: string, report: Report): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; 
        img.src = base64OrUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const cardWidth = 1080;
            const cardHeight = 1350;
            canvas.width = cardWidth;
            canvas.height = cardHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) { reject("No Context"); return; }

            // 1. Background (Dark)
            ctx.fillStyle = "#111827"; // Slate-900
            ctx.fillRect(0, 0, cardWidth, cardHeight);

            // 2. Draw The Road Image (Top 60%) - Reduced slightly to fit more data
            const imgHeight = cardHeight * 0.60;
            const scale = Math.max(cardWidth / img.width, imgHeight / img.height);
            const x = (cardWidth / 2) - (img.width / 2) * scale;
            const y = (imgHeight / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // 3. Info Panel (Bottom 40%)
            const panelY = imgHeight;
            const padding = 50;
            
            let severityColor = "#3b82f6"; // Blue
            if (report.analysis.severity === Severity.CRITICAL) severityColor = "#dc2626"; // Red
            if (report.analysis.severity === Severity.HIGH) severityColor = "#f97316"; // Orange
            if (report.analysis.severity === Severity.MEDIUM) severityColor = "#eab308"; // Yellow

            // A. Severity Bar
            ctx.fillStyle = severityColor;
            ctx.fillRect(0, panelY, cardWidth, 20);

            // B. Text Content - Title
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 55px Inter, sans-serif";
            const hazardTitle = report.analysis.hazard_type.replace(/_/g, " ").toUpperCase();
            ctx.fillText(hazardTitle, padding, panelY + 100);

            // C. Location (Subtitle)
            ctx.font = "500 30px Inter, sans-serif";
            ctx.fillStyle = "#9ca3af"; // Gray-400
            
            let locationText = "";
            const addr = report.addressContext;
            
            if (addr && addr.formattedAddress) {
                locationText = addr.formattedAddress;
            } else {
                 locationText = `${report.location?.lat.toFixed(4)}, ${report.location?.lng.toFixed(4)}`;
            }

            // Simple text truncate for location
            if (locationText.length > 45) locationText = locationText.substring(0, 42) + "...";
            ctx.fillText(`📍 ${locationText}`, padding, panelY + 150);

            // --- D. NEW METRICS ROW (Risk, Impact, Zones) ---
            const metricsY = panelY + 230;
            
            // Box 1: Safety Risk
            ctx.fillStyle = "#1f2937"; // Gray-800 bg
            ctx.fillRect(padding, metricsY, 280, 100);
            ctx.fillStyle = severityColor; // Border left
            ctx.fillRect(padding, metricsY, 10, 100);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Inter, sans-serif";
            ctx.fillText("SAFETY RISK", padding + 30, metricsY + 35);
            ctx.font = "900 40px Inter, sans-serif";
            ctx.fillText(`${report.analysis.accident_probability_score}%`, padding + 30, metricsY + 80);

            // Box 2: Impact Score
            ctx.fillStyle = "#1f2937"; 
            ctx.fillRect(padding + 300, metricsY, 280, 100);
            ctx.fillStyle = "#6366f1"; // Indigo border
            ctx.fillRect(padding + 300, metricsY, 10, 100);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Inter, sans-serif";
            ctx.fillText("IMPACT SCORE", padding + 330, metricsY + 35);
            ctx.font = "900 40px Inter, sans-serif";
            ctx.fillText(`${report.analysis.impact_zone_score}/10`, padding + 330, metricsY + 80);

            // Box 3: Sensitive Zones (Dynamic Width)
            const zones = report.analysis.sensitive_zones || [];
            const zoneText = zones.length > 0 ? zones[0] : "None Nearby";
            
            ctx.fillStyle = "#1f2937";
            ctx.fillRect(padding + 600, metricsY, 380, 100);
            ctx.fillStyle = zones.length > 0 ? "#ec4899" : "#4b5563"; // Pink if zone exists, gray if none
            ctx.fillRect(padding + 600, metricsY, 10, 100);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 20px Inter, sans-serif";
            ctx.fillText("SENSITIVE ZONE", padding + 630, metricsY + 35);
            ctx.font = "bold 30px Inter, sans-serif";
            ctx.fillText(zoneText.substring(0, 15), padding + 630, metricsY + 80);

            // E. Footer Details (Date & Auth)
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 30px Inter, sans-serif";
            
            const dateObj = new Date(report.timestamp);
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            
            ctx.fillText(`📅 ${dateStr} • ${timeStr}`, padding, metricsY + 160);
            
            // --- ATTRIBUTION LINE (Satisfaction Logic) ---
            const reporterName = report.userName || "Citizen Reporter";
            ctx.fillStyle = "#eab308"; // Yellow-500
            ctx.fillText(`👤 Reported by: ${reporterName}`, padding, metricsY + 210);

            // F. Branding Footer
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, cardHeight - 120, cardWidth, 120);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "900 40px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("#GPTR #GPTRROADS • CITIZEN REPORT", cardWidth / 2, cardHeight - 45);

            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => {
            reject("CORS_BLOCK");
        };
    });
};
