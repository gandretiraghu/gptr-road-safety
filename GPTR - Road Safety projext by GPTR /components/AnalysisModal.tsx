
import React, { useState } from 'react';
import { GPTRAnalysisResult, Severity, GeoLocation, Report, AddressContext } from '../types';
import { shareReportAction } from '../services/shareService';

interface AnalysisModalProps {
  result: GPTRAnalysisResult;
  onClose: () => void;
  onConfirm?: () => void; 
  imageSrc: string;
  locationLabel?: string;
  readOnly?: boolean;
  timestamp?: number; 
  location?: GeoLocation | null; 
  reporterName?: string; 
  addressContext?: AddressContext; 
  relatedReports?: Report[]; // NEW: History Timeline
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ 
    result, 
    onClose, 
    onConfirm, 
    imageSrc, 
    locationLabel, 
    readOnly = false,
    timestamp,
    location,
    reporterName,
    addressContext,
    relatedReports = []
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [viewedReportIndex, setViewedReportIndex] = useState<number>(-1); // -1 means showing the main props report

  // Determine which report data to show (Main or one from history)
  const activeReport = viewedReportIndex === -1 ? { 
      result, imageSrc, timestamp, locationLabel, reporterName 
  } : {
      result: relatedReports[viewedReportIndex].analysis,
      imageSrc: relatedReports[viewedReportIndex].image,
      timestamp: relatedReports[viewedReportIndex].timestamp,
      locationLabel: relatedReports[viewedReportIndex].addressContext?.formattedAddress || locationLabel,
      reporterName: relatedReports[viewedReportIndex].userName
  };

  const activeResult = activeReport.result;
  
  // --- INTELLIGENT DATA PARSING ---
  const isLegacyReport = !activeResult.vehicle_impact;

  const vehicleImpact = activeResult.vehicle_impact || {
      two_wheeler_risk: "N/A",
      four_wheeler_risk: "N/A",
      visibility_risk: "Analysis not available"
  };

  const forensics = activeResult.forensics || {
      authenticity_score: 0,
      location_consistency: "Unknown",
      gps_trust_score: 0,
      is_ai_generated: false,
      is_screen_capture: false,
      consistency_reason: "",
      environment_match: ""
  };

  const repairInfo = activeResult.repair_info || {
      suggested_action: "Monitor",
      estimated_cost_inr: "N/A",
      urgency: "N/A",
      material: "N/A"
  };

  const sensitiveZones = activeResult.sensitive_zones || [];
  const impactZoneScore = activeResult.impact_zone_score || 0;
  const humanTouchStatement = activeResult.human_touch_statement || "Analysis pending...";

  // --- TIME & LOCATION CONTEXT ---
  const reportDate = activeReport.timestamp ? new Date(activeReport.timestamp) : new Date();
  const formattedDate = reportDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  const formattedTime = reportDate.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Get Nearby Place Name
  const placeContext = activeResult.nearby_place_detected && activeResult.nearby_place_detected !== "Unknown" 
    ? activeResult.nearby_place_detected 
    : "Unidentified Area";

  // --- SHARE HANDLER ---
  const handleShareClick = async () => {
      setIsSharing(true);
      const finalAddress = addressContext || {
           city: placeContext !== "Unidentified Area" ? placeContext : "India",
           state: "India",
           country: "India",
           formattedAddress: locationLabel || "",
           street: "", district: "", postalCode: ""
      };

      const tempReport: Report = {
          id: "temp_share",
          image: activeReport.imageSrc,
          timestamp: timestamp || Date.now(),
          analysis: activeResult,
          location: location || { lat: 0, lng: 0 },
          userName: activeReport.reporterName, 
          addressContext: finalAddress,
          reportType: 'hazard'
      };

      await shareReportAction(tempReport);
      setIsSharing(false);
  };

  // --- REJECTION SCREEN (Only for new captures) ---
  if (!activeResult.is_road && !readOnly) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center shadow-2xl border-t-4 border-red-600">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <span className="text-3xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Road Image</h2>
            <p className="text-gray-600 text-sm mb-6 bg-gray-50 py-3 px-4 rounded border border-gray-200 leading-relaxed">
                {activeResult.reasoning?.[0] || "Image does not match road infrastructure criteria."}
            </p>
            <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold active:scale-95 transition-transform uppercase tracking-wider text-xs">
                Dismiss Report
            </button>
        </div>
      </div>
    );
  }

  // --- REPAIR VERIFIED SCREEN ---
  const isFakeRepair = activeResult.repair_quality_audit?.status === "FAKE_COVERUP" || activeResult.repair_quality_audit?.status === "POOR_QUALITY";

  if (!activeResult.hazard_detected && !isFakeRepair && !readOnly && onConfirm) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center shadow-2xl border-t-4 border-green-500">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-100">
                <span className="text-4xl">🛡️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Issue Resolved</h2>
            <p className="text-xs font-bold uppercase text-green-600 mb-4 tracking-widest border border-green-200 px-2 py-1 rounded-full inline-block">✅ Verification Successful</p>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed border-t border-b border-gray-100 py-4">Engineering standards met. Submit to update map status.</p>
             <div className="flex flex-col gap-2 w-full">
                 <button onClick={onConfirm} className="w-full py-4 bg-orange-600 text-white rounded-lg font-black mb-1 shadow-lg active:scale-95 transition-transform uppercase tracking-wider text-xs border border-orange-500 hover:bg-orange-500">
                    VERIFY REPAIR (UPDATE MAP)
                 </button>
                <div className="flex gap-2">
                    <button onClick={handleShareClick} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg active:scale-95 transition-transform uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                        {isSharing ? '...' : '📢 Share'}
                    </button>
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-lg font-bold active:scale-95 transition-transform uppercase tracking-wider text-xs border border-gray-200">
                        Close
                    </button>
                </div>
             </div>
        </div>
      </div>
    );
  }

  const isCritical = activeResult.severity === Severity.CRITICAL || activeResult.severity === Severity.HIGH;
  const repairAudit = activeResult.repair_quality_audit;
  const hazardTypeTitle = activeResult.hazard_type ? activeResult.hazard_type.replace(/_/g, " ") : "Hazard Detected";

  return (
    <div className="fixed inset-0 z-[999] bg-slate-100 animate-in slide-in-from-bottom duration-300 font-sans">
        
        <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md z-[1000] hover:bg-black/70 shadow-lg font-bold transition-transform active:scale-90 border border-white/20">✕</button>

        <div className="h-full w-full overflow-y-auto scrollbar-hide pb-36"> 
            
            {/* 1. IMMERSIVE HEADER */}
            <div className="relative h-[55vh] w-full bg-slate-900 shadow-xl border-b border-slate-700">
                <img src={activeReport.imageSrc} className="w-full h-full object-cover opacity-90" alt="Evidence" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-5 pt-12">
                    
                    {/* TIMELINE (New Feature) */}
                    {relatedReports.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {/* Main Report (Usually Hazard) */}
                            <button 
                                onClick={() => setViewedReportIndex(-1)}
                                className={`flex-shrink-0 relative w-12 h-12 rounded-lg border-2 overflow-hidden ${viewedReportIndex === -1 ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-white/30 grayscale opacity-70'}`}
                            >
                                <img src={imageSrc} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[6px] text-white text-center font-bold">ORIGINAL</div>
                            </button>
                            
                            {/* Related Reports (Repairs) */}
                            {relatedReports.map((rep, idx) => (
                                <button 
                                    key={rep.id}
                                    onClick={() => setViewedReportIndex(idx)}
                                    className={`flex-shrink-0 relative w-12 h-12 rounded-lg border-2 overflow-hidden ${viewedReportIndex === idx ? 'border-green-400 ring-2 ring-green-400/50' : 'border-white/30 grayscale opacity-70'}`}
                                >
                                    <img src={rep.image} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[6px] text-white text-center font-bold">REPAIR {idx+1}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${isCritical ? 'bg-red-600/90 border-red-500 text-white' : 'bg-yellow-500/90 border-yellow-400 text-black'}`}>
                            🚨 {activeResult.severity || "Unknown"} Severity
                        </span>
                        {!isLegacyReport && (
                            <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md bg-white/20 border-white/30 text-white">
                                📉 {activeResult.accident_probability_score}% Risk Score
                            </span>
                        )}
                    </div>
                    
                    <h1 className="text-3xl font-black capitalize leading-none mb-3 text-white drop-shadow-lg tracking-tight">{hazardTypeTitle}</h1>
                    
                    <div className="grid grid-cols-1 gap-1 text-slate-300 border-l-2 border-white/30 pl-3">
                         <div className="flex items-start gap-2">
                             <span className="text-sm mt-0.5">📍</span>
                             <div className="flex flex-col">
                                 {location ? (
                                     <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold uppercase w-full text-blue-300 hover:text-blue-200 underline decoration-dotted underline-offset-4 cursor-pointer flex items-center gap-1"
                                     >
                                        {activeReport.locationLabel || "View on Map"} <span className="text-[10px]">↗</span>
                                     </a>
                                 ) : (
                                     <span className="text-xs font-bold uppercase w-full text-white/90">
                                        {activeReport.locationLabel || "Unknown GPS"}
                                     </span>
                                 )}
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-sm">🕒</span>
                             <span className="text-xs font-mono font-medium text-white/80">
                                {formattedDate}, {formattedTime} • <span className="text-yellow-400 font-bold">{placeContext}</span>
                             </span>
                         </div>
                         {activeReport.reporterName && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm">👤</span>
                                <span className="text-xs font-bold text-white uppercase bg-blue-600/50 px-2 py-0.5 rounded border border-blue-400/50">
                                    Reported by {activeReport.reporterName}
                                </span>
                            </div>
                         )}
                    </div>
                </div>
            </div>

            {/* 2. REPORT CONTENT STACK */}
            <div className="px-4 -mt-6 relative z-10 flex flex-col gap-5">
                
                {/* CARD 0: SPECIAL REPAIR AUDIT ALERT */}
                {repairAudit && (
                    <div className={`rounded-lg border-2 border-l-4 p-4 shadow-lg bg-white ${isFakeRepair ? 'border-red-400 border-l-red-600' : 'border-green-400 border-l-green-600'}`}>
                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-100">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${isFakeRepair ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                 {isFakeRepair ? '⚠️' : '✅'}
                             </div>
                             <div>
                                 <h3 className={`text-xs font-black uppercase tracking-widest ${isFakeRepair ? 'text-red-800' : 'text-green-800'}`}>
                                     {isFakeRepair ? 'Audit Failed' : 'Audit Passed'}
                                 </h3>
                                 <p className="text-[9px] text-gray-500 uppercase font-bold">Political Verification</p>
                             </div>
                        </div>
                        <p className="text-sm font-medium text-gray-800 pt-1">"{repairAudit.evidence}"</p>
                    </div>
                )}

                {/* CARD 1: IMPACT STATEMENT (Blue Border) */}
                <div className="bg-white rounded-lg shadow-sm border-2 border-blue-200 border-l-4 border-l-blue-500 p-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        💬 Impact Analysis
                    </h3>
                    <p className="text-sm font-semibold text-slate-800 italic leading-relaxed border-l-2 border-slate-100 pl-3">
                        "{humanTouchStatement}"
                    </p>
                </div>

                {/* CARD 2: VISUAL EVIDENCE (Slate Border) */}
                <div className="bg-white rounded-lg shadow-sm border-2 border-slate-300 border-l-4 border-l-slate-600 overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2 text-slate-700">
                        <span className="text-lg">📸</span>
                        <h3 className="text-xs font-black uppercase tracking-widest">Observations</h3>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                        <div className="p-4">
                             <ul className="space-y-2">
                                {activeResult.reasoning?.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                                        <span className="text-slate-400 mt-0.5">•</span> {r}
                                    </li>
                                )) || <li className="text-xs text-slate-400 italic">None recorded</li>}
                             </ul>
                        </div>
                        <div className="px-4 py-3 flex justify-between items-center bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Surface Type</span>
                            <span className="text-xs font-bold text-slate-800">{activeResult.surface_condition || "Unknown"}</span>
                        </div>
                    </div>
                </div>

                {!isLegacyReport && (
                <>
                    {/* CARD 3: RISK ASSESSMENT (Red Theme Border) */}
                    <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 border-l-4 border-l-red-600 overflow-hidden">
                        <div className="bg-red-50/50 px-4 py-2 border-b border-red-200 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-red-800">
                                <span className="text-lg">⚠️</span>
                                <h3 className="text-xs font-black uppercase tracking-widest">Safety Risk</h3>
                            </div>
                            <span className="text-[10px] font-black text-red-600 border border-red-200 px-2 py-0.5 rounded bg-white">
                                {activeResult.accident_probability_score}% PROBABILITY
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 divide-x divide-red-100">
                             {/* 2-Wheeler */}
                             <div className="p-4 flex flex-col items-center justify-center">
                                 <div className="text-2xl mb-2">🛵</div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">2-Wheelers</span>
                                 <span className={`text-sm font-black uppercase ${vehicleImpact.two_wheeler_risk === 'Critical' ? 'text-red-600' : 'text-orange-500'}`}>
                                     {vehicleImpact.two_wheeler_risk} Risk
                                 </span>
                             </div>
                             {/* 4-Wheeler */}
                             <div className="p-4 flex flex-col items-center justify-center">
                                 <div className="text-2xl mb-2">🚗</div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">4-Wheelers</span>
                                 <span className="text-sm font-black text-slate-700 uppercase">
                                     {vehicleImpact.four_wheeler_risk} Risk
                                 </span>
                             </div>
                        </div>
                        <div className="px-4 py-2 border-t border-red-100 bg-red-50/30 text-center">
                             <span className="text-[10px] font-bold text-red-800 flex items-center justify-center gap-1">
                                🔦 {vehicleImpact.visibility_risk}
                             </span>
                        </div>
                    </div>

                    {/* CARD 4: ENGINEERING SPECS (Green/Blue Theme Border) */}
                    <div className="bg-white rounded-lg shadow-sm border-2 border-emerald-200 border-l-4 border-l-emerald-600 p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-50 text-emerald-800">
                            <span className="text-lg">🛠️</span>
                            <h3 className="text-xs font-black uppercase tracking-widest">Engineering Specs</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <span className="text-[9px] font-bold text-blue-400 uppercase block mb-1">Recommended Action</span>
                                <span className="text-xs font-bold text-blue-900 block leading-tight">{repairInfo.suggested_action}</span>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                                <span className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Estimated Cost</span>
                                <span className="text-sm font-black text-emerald-700 block leading-tight">{repairInfo.estimated_cost_inr}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-emerald-100">
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Material</span>
                                <span className="text-xs font-bold text-slate-700">{repairInfo.material}</span>
                            </div>
                            <div className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1 ${repairInfo.urgency.includes('24') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                ⏳ {repairInfo.urgency}
                            </div>
                        </div>
                    </div>
                </>
                )}

                {/* FOOTER */}
                <div className="text-[9px] text-slate-400 text-center py-4 opacity-70">
                    <p>Generated by GPTR Intelligence Core v2.1</p>
                    <p>Confidence {((activeResult.confidence_score || 0) * 100).toFixed(0)}% • {formattedDate}</p>
                </div>

            </div>
        </div>

        {/* 3. FIXED ACTION BAR */}
        <div className="absolute bottom-0 left-0 right-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-[900]">
            
            {/* BUTTON GROUP FOR NEW OR ACTIVE REPORT */}
            {!readOnly && onConfirm ? (
                <div className="flex gap-3">
                    <button 
                        onClick={handleShareClick}
                        disabled={isSharing}
                        className="flex-shrink-0 w-16 bg-blue-100 text-blue-800 rounded-lg font-black shadow-sm active:scale-95 transition-all flex items-center justify-center border border-blue-200"
                    >
                        {isSharing ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="text-xl leading-none">📢</span>
                                <span className="text-[8px] uppercase tracking-wide mt-0.5">Share</span>
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={onConfirm}
                        className={`flex-grow py-3.5 rounded-lg font-black uppercase shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs tracking-widest ${isFakeRepair ? 'bg-red-600 text-white shadow-red-200' : 'bg-slate-900 text-white shadow-slate-300'}`}
                    >
                        {isFakeRepair ? (
                            <>
                                <span className="text-lg">📢</span>
                                <span>REPORT FAKE CLAIM</span>
                            </>
                        ) : (
                            <>
                                <span className="text-lg">🚀</span>
                                <span>SUBMIT OFFICIAL REPORT</span>
                            </>
                        )}
                    </button>
                </div>
            ) : (
                // READ ONLY MODE (History)
                 <div className="flex gap-3">
                     <button 
                        onClick={handleShareClick}
                        className="flex-1 py-3.5 bg-blue-600 text-white shadow-lg rounded-lg font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <span>📢 Share Report</span>
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                    >
                        Close Report
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default AnalysisModal;
