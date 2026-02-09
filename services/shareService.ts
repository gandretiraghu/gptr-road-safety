
import { Report, Severity } from "../types";
import { OFFICIAL_HANDLES } from "../data/officialHandles";
import { generateShareCard } from "./imageProcessor";

/**
 * LOGIC: Generates the Twitter/Social tags based on Location & Severity.
 */
const generateSmartTags = (report: Report): string => {
    const address = report.addressContext;
    const severity = report.analysis.severity;
    
    // Defaults
    let country = address?.country || "India";
    if (country.toLowerCase().includes("india") || country.toLowerCase().includes("bharat")) {
        country = "India";
    }

    const stateName = address?.state;
    const cityName = address?.city;
    const districtName = address?.district; 

    let tags = "";
    
    // 1. Get Country Data
    const countryData = OFFICIAL_HANDLES[country];
    
    if (countryData && stateName) {
        // FUZZY MATCHING
        let matchedStateKey = Object.keys(countryData).find(
            key => key.toLowerCase() === stateName.toLowerCase() || 
                   key.toLowerCase().includes(stateName.toLowerCase()) || 
                   stateName.toLowerCase().includes(key.toLowerCase())
        );

        if (matchedStateKey) {
            const stateData = countryData[matchedStateKey];
            
            // A. CITY LEVEL (Case-Insensitive Match)
            const findCityKey = (name: string) => Object.keys(stateData.cities || {}).find(k => k.toLowerCase() === name.toLowerCase());

            const cityKey = cityName ? findCityKey(cityName) : null;
            const districtKey = districtName ? findCityKey(districtName) : null;

            if (cityKey) {
                 tags += `${stateData.cities![cityKey]} `;
            } 
            else if (districtKey) {
                 tags += `${stateData.cities![districtKey]} `;
            }

            // B. ESCALATION MATRIX (UPDATED: MANDATORY CM/DY CM TAGGING)
            // User Requirement: If a report belongs to a state, CM and Deputy CM must be notified regardless of severity.
            tags += `${stateData.cm} ${stateData.deputy_cm || ""} ${stateData.road_dept} `;

        } else {
            // State not found in DB
            tags += "@MORTHIndia @Nitindgadkari "; 
        }
    } else {
        tags += "#RoadSafetyAuthority ";
    }

    return tags.trim();
};

/**
 * ACTION: Triggers the Native Share Sheet with COMPOSITE CARD
 */
export const shareReportAction = async (report: Report): Promise<void> => {
    try {
        // 1. Generate Tags
        const smartTags = generateSmartTags(report);
        const severityEmoji = report.analysis.severity === Severity.CRITICAL ? "🚨" : "⚠️";
        
        // 2. Format Location Text (Include State Explicitly)
        const city = report.addressContext?.city || "Unknown City";
        const state = report.addressContext?.state || "Unknown State";
        // Explicit location string for the text body
        const locationTxt = (state && state !== "Unknown State") ? `${city}, ${state}` : city;

        // 3. Generate the "Share Card"
        let file: File | null = null;
        
        try {
            const cardBase64 = await generateShareCard(report.image, report);
            const res = await fetch(cardBase64);
            const blob = await res.blob();
            // Use .png for better compatibility in some apps, though jpg is lighter
            // Name the file specifically so WhatsApp treats it as an image
            file = new File([blob], `gptr_hazard_${report.id}.jpg`, { type: "image/jpeg" });
        } catch (e) {
            console.warn("Share Card Gen Failed, falling back...", e);
            if (report.image.startsWith('data:image')) {
                 const res = await fetch(report.image);
                 const blob = await res.blob();
                 file = new File([blob], "evidence.jpg", { type: "image/jpeg" });
             }
        }

        // 4. Construct Message text (Keep it cleaner for WhatsApp captions)
        // Added mandatory #GPTR and #GPTRROADS tags AND Website Links
        const shareText = `
${severityEmoji} *ROAD HAZARD ALERT*
📍 Location: ${locationTxt}

Severity: ${report.analysis.severity}
Issue: ${report.analysis.hazard_type.replace(/_/g, " ")}

cc: ${smartTags}

Reported via GPTR:
🌐 https://gptr-pathole.web.app/
🌐 https://gptrroads.pages.dev/

#GPTR #GPTRROADS #${city.replace(/\s/g, "")}
        `.trim();

        // 5. Trigger Share with robust checks
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            // Prioritize File Sharing
            await navigator.share({
                text: shareText,
                files: [file]
            });
        } else if (navigator.share) {
            // Fallback (Text Only if file fails)
            await navigator.share({
                text: shareText + `\n\nEvidence: ${report.image}` // Add link if file fails
            });
        } else {
            // Desktop Fallback
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        }

    } catch (error) {
        console.error("Share failed:", error);
        // If share was aborted by user, don't show alert
        if ((error as Error).name !== 'AbortError') {
             // Fallback for really old browsers or permission denials
             alert("Could not open share menu. Copying text...");
        }
    }
};
