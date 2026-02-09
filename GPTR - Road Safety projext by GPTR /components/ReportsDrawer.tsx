
import React, { useMemo, useState } from 'react';
import { Report, Severity } from '../types';

interface ReportsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reports: Report[];
  onSelectReport: (report: Report) => void;
}

const ReportsDrawer: React.FC<ReportsDrawerProps> = ({ isOpen, onClose, reports, onSelectReport }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({});

  // Helper distance function to find repairs for a hazard
  const getDistance = (r1: Report, r2: Report) => {
    if (!r1.location || !r2.location) return Infinity;
    const R = 6371e3; 
    const φ1 = r1.location.lat * Math.PI/180;
    const φ2 = r2.location.lat * Math.PI/180;
    const Δφ = (r2.location.lat-r1.location.lat) * Math.PI/180;
    const Δλ = (r2.location.lng-r1.location.lng) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 1. GROUPING LOGIC (India Centric + Resolved Logic)
  const groupedData = useMemo(() => {
    const data: Record<string, Record<string, Report[]>> = {};
    let totalCount = 0;

    const hazards = reports.filter(r => r.reportType !== 'repair');
    const allRepairs = reports.filter(r => r.reportType === 'repair');

    hazards.forEach(hazard => {
      // Logic to determine if resolved
      let relevantRepairs = allRepairs.filter(r => getDistance(hazard, r) < 30 && r.analysis.repair_quality_audit?.status === 'GENUINE_REPAIR');
      const uniqueDevices = new Set(relevantRepairs.map(r => r.deviceId || 'unknown'));
      const isResolved = uniqueDevices.size >= 3;

      // Filter based on Tab
      if (activeTab === 'active' && isResolved) return;
      if (activeTab === 'resolved' && !isResolved) return;

      const country = hazard.addressContext?.country || "India"; 
      if (!country.includes("India") && !country.includes("Bharat")) return;

      const state = hazard.addressContext?.state || "Unknown State";
      const district = hazard.addressContext?.district || "Unknown District";

      if (!data[state]) data[state] = {};
      if (!data[state][district]) data[state][district] = [];
      
      data[state][district].push(hazard);
      totalCount++;
    });

    const sortedStates = Object.keys(data).sort();
    return { data, sortedStates, totalCount };
  }, [reports, activeTab]);

  const toggleState = (state: string) => {
    setExpandedStates(prev => ({ ...prev, [state]: !prev[state] }));
  };

  const toggleDistrict = (state: string, district: string) => {
    const key = `${state}-${district}`; 
    setExpandedDistricts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case Severity.CRITICAL: return 'bg-red-500';
      case Severity.HIGH: return 'bg-orange-500';
      case Severity.MEDIUM: return 'bg-yellow-500';
      default: return 'bg-blue-400';
    }
  };

  return (
    <>
      {/* OVERLAY */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        />
      )}

      {/* DRAWER PANEL */}
      <div 
        className={`absolute top-0 bottom-0 left-0 z-[101] w-80 bg-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col border-r border-white/10 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* HEADER */}
        <div className="p-5 border-b border-white/10 bg-slate-950">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-black uppercase tracking-wider text-blue-400">Civic Intelligence</h2>
             <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 active:scale-95">✕</button>
          </div>
          
          {/* TABS */}
          <div className="flex bg-slate-800 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-colors ${activeTab === 'active' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
                Active Hazards
             </button>
             <button 
                onClick={() => setActiveTab('resolved')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-md transition-colors ${activeTab === 'resolved' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
             >
                Resolved ({groupedData.totalCount})
             </button>
          </div>
        </div>

        {/* SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
           {groupedData.sortedStates.length === 0 ? (
               <div className="p-6 text-center text-gray-500 text-xs mt-10">
                   {activeTab === 'active' ? "No active hazards reported." : "No verified repairs yet."}
               </div>
           ) : (
               groupedData.sortedStates.map(state => {
                   const districts = groupedData.data[state];
                   const districtNames = Object.keys(districts).sort();
                   const stateCount = districtNames.reduce((acc, d) => acc + districts[d].length, 0);
                   const isStateOpen = expandedStates[state];

                   return (
                       <div key={state} className="mb-2 rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                           {/* STATE HEADER */}
                           <button 
                               onClick={() => toggleState(state)}
                               className="w-full flex justify-between items-center p-3 hover:bg-white/5 transition-colors"
                           >
                               <div className="flex items-center gap-2">
                                   <span className="text-xs font-bold uppercase text-white">{state}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${activeTab === 'resolved' ? 'bg-green-600' : 'bg-blue-600'}`}>{stateCount}</span>
                                   <span className={`text-gray-400 text-xs transform transition-transform ${isStateOpen ? 'rotate-180' : ''}`}>▼</span>
                               </div>
                           </button>

                           {/* DISTRICT LIST */}
                           {isStateOpen && (
                               <div className="bg-black/20 border-t border-white/5">
                                   {districtNames.map(district => {
                                       const districtReports = districts[district];
                                       const uniqueKey = `${state}-${district}`;
                                       const isDistrictOpen = expandedDistricts[uniqueKey];

                                       return (
                                           <div key={uniqueKey} className="border-l-2 border-white/10 ml-3 my-1">
                                                {/* DISTRICT HEADER */}
                                                <button 
                                                   onClick={() => toggleDistrict(state, district)}
                                                   className="w-full flex justify-between items-center py-2 px-3 hover:bg-white/5 transition-colors"
                                                >
                                                   <span className="text-[11px] font-medium text-gray-300 truncate pr-2">
                                                        {district}
                                                   </span>
                                                   <span className="text-[9px] text-gray-500 whitespace-nowrap">{districtReports.length} reports</span>
                                                </button>

                                                {/* REPORTS LIST */}
                                                {isDistrictOpen && (
                                                    <div className="ml-3 pr-2 pb-2 space-y-2">
                                                        {districtReports.map(report => (
                                                            <div 
                                                                key={report.id}
                                                                onClick={() => { onSelectReport(report); onClose(); }}
                                                                className={`bg-white/5 p-2 rounded border border-white/5 cursor-pointer active:scale-95 transition-all ${activeTab === 'resolved' ? 'hover:border-green-500/50' : 'hover:border-blue-500/50'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className={`w-2 h-2 rounded-full ${activeTab === 'resolved' ? 'bg-green-500' : getSeverityColor(report.analysis.severity)}`}></div>
                                                                        <span className="text-[10px] font-bold text-white capitalize">
                                                                            {report.analysis.hazard_type.replace(/_/g, ' ')}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[9px] text-gray-500">
                                                                        {new Date(report.timestamp).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[9px] text-gray-400 truncate mb-1">
                                                                    {report.addressContext?.formattedAddress || "Location pending..."}
                                                                </p>
                                                                {activeTab === 'resolved' && (
                                                                     <div className="mt-1">
                                                                         <span className="text-[8px] bg-green-900/50 text-green-400 border border-green-700/50 px-1 rounded uppercase font-bold">Verified Fixed</span>
                                                                     </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                           </div>
                                       );
                                   })}
                               </div>
                           )}
                       </div>
                   );
               })
           )}
        </div>
      </div>
    </>
  );
};

export default ReportsDrawer;
