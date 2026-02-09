
import React, { useEffect, useRef, useState } from 'react';
import { GeoLocation, Report } from '../types';
import ReportsDrawer from './ReportsDrawer';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    markerClusterer: any; // Declare CDN global
  }
}

interface SimpleMapProps {
  location: GeoLocation | null;
  reports: Report[];
  onTriggerRepair: () => void;
  onMarkerClick: (report: Report) => void;
  isReportsOpen: boolean;
  setIsReportsOpen: (isOpen: boolean) => void;
  isRepairUnlocked: boolean; // NEW PROP: Controls Green Button State
}

// Helper: Calculate Distance
const getDistance = (r1: Report, r2: Report) => {
    if (!r1.location || !r2.location) return Infinity;
    const R = 6371e3; // metres
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

// CSS Injection for Blinking Yellow/Orange/Green Animation
const injectStyles = () => {
    const styleId = 'gptr-map-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            @keyframes blink-verify-consensus {
                0% { box-shadow: 0 0 5px currentColor; transform: translate(-50%, -50%) scale(1); }
                50% { box-shadow: 0 0 15px currentColor; transform: translate(-50%, -50%) scale(1.15); }
                100% { box-shadow: 0 0 5px currentColor; transform: translate(-50%, -50%) scale(1); }
            }
            .blink-marker { animation: blink-verify-consensus 2s infinite ease-in-out; }
            @keyframes pulse-ring-green {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
            .green-pulse { animation: pulse-ring-green 2s infinite; }
        `;
        document.head.appendChild(style);
    }
};

const SimpleMap: React.FC<SimpleMapProps> = ({ 
    location, 
    reports, 
    onTriggerRepair, 
    onMarkerClick,
    isReportsOpen,
    setIsReportsOpen,
    isRepairUnlocked
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null); 
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapType, setMapType] = useState('hybrid'); 
  const [processedMapData, setProcessedMapData] = useState<{activeHazards: number, pendingVerifications: number}>({ activeHazards: 0, pendingVerifications: 0 });

  useEffect(() => {
    injectStyles();
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsMapLoaded(true);
      return;
    }
    
    // DIRECT HARDCODED KEY (As requested to bypass ENV issues)
    const mapsKey = "AIzaSyARCB5iCpc4YpU0C3jVmyziLemOlIFqifo";

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`; 
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapLoaded(true);
    script.onerror = () => console.error("Google Maps Script Failed to Load");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const center = location 
      ? { lat: location.lat, lng: location.lng } 
      : { lat: 17.3850, lng: 78.4867 };

    try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: 18,
          disableDefaultUI: true, 
          zoomControl: false,
          mapTypeId: mapType, 
          clickableIcons: false,
          backgroundColor: '#f3f4f6', 
          gestureHandling: 'greedy' // Enables single-finger panning on mobile
        });
        
        // Initialize MarkerClusterer
        if (window.markerClusterer && window.markerClusterer.MarkerClusterer) {
            clustererRef.current = new window.markerClusterer.MarkerClusterer({
                 map: mapInstanceRef.current,
                 markers: [],
                 renderer: {
                     render: ({ count, position }: any) => {
                         return new window.google.maps.Marker({
                             position,
                             label: { text: String(count), color: "white", fontWeight: "bold" },
                             icon: {
                                 path: window.google.maps.SymbolPath.CIRCLE,
                                 scale: 15 + Math.min(count, 10),
                                 fillColor: "#dc2626",
                                 fillOpacity: 0.9,
                                 strokeWeight: 2,
                                 strokeColor: "white"
                             }
                         });
                     }
                 }
            });
        }
    } catch (e) {
        console.error("Map Initialization Error", e);
    }
  }, [isMapLoaded]);

  // --- USER MARKER UPDATE ---
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !location) return;

    class UserOverlay extends window.google.maps.OverlayView {
      position: any;
      div: HTMLElement | null;
      constructor(position: any) { super(); this.position = position; this.div = null; }
      onAdd() {
        this.div = document.createElement("div");
        this.div.className = "user-marker";
        this.div.style.cssText = "width:16px; height:16px; background-color:#3b82f6; border:3px solid white; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.4); position:absolute; transform:translate(-50%, -50%); z-index: 1000;";
        this.getPanes().overlayLayer.appendChild(this.div);
      }
      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.position);
        if (this.div && point) { this.div.style.left = point.x + "px"; this.div.style.top = point.y + "px"; }
      }
      onRemove() { this.div?.parentNode?.removeChild(this.div!); }
      setPosition(position: any) { this.position = position; this.draw(); }
    }

    const latLng = new window.google.maps.LatLng(location.lat, location.lng);
    
    // Only pan if it's the first load or user requests it
    if (!userMarkerRef.current) {
        mapInstanceRef.current.panTo(latLng);
        userMarkerRef.current = new UserOverlay(latLng);
        userMarkerRef.current.setMap(mapInstanceRef.current);
    } else {
        userMarkerRef.current.setPosition(latLng);
    }
  }, [location, isMapLoaded]);


  // --- MARKERS LOGIC ---
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !isMapLoaded) return;

    if (clustererRef.current) clustererRef.current.clearMarkers();
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const hazards = reports.filter(r => r.reportType !== 'repair');
    const allRepairs = reports.filter(r => r.reportType === 'repair');
    
    let activeCount = 0;
    let pendingCount = 0;

    class SmartMarkerOverlay extends window.google.maps.OverlayView {
      position: any;
      report: Report;
      status: 'active' | 'verifying' | 'resolved';
      verificationCount: number; 
      div: HTMLElement | null;

      constructor(position: any, report: Report, status: 'active' | 'verifying' | 'resolved', verificationCount: number) {
        super();
        this.position = position;
        this.report = report;
        this.status = status;
        this.verificationCount = verificationCount;
        this.div = null;
      }

      onAdd() {
        this.div = document.createElement("div");
        this.div.style.position = "absolute";
        this.div.style.cursor = "pointer";
        this.div.style.pointerEvents = "auto";
        this.div.style.display = "flex";
        this.div.style.alignItems = "center";
        this.div.style.justifyContent = "center";
        this.div.style.transform = 'translate(-50%, -50%)';

        if (this.status === 'verifying') {
            // YELLOW MARKER (1 or 2 verifications) - CHANGED FROM GREEN
            this.div.className = "blink-marker";
            this.div.style.color = '#eab308'; // Yellow-500
            this.div.style.width = '32px';
            this.div.style.height = '32px';
            this.div.style.borderRadius = '50%';
            this.div.style.backgroundColor = '#eab308'; // Yellow
            this.div.style.border = '3px solid white';
            this.div.innerHTML = `<span style="font-size:10px; font-weight:800; color:white; text-shadow: 0px 0px 2px black;">${this.verificationCount}/3</span>`;
        } else {
             // RED ANIMATED LOTTIE (0 verifications)
             this.div.style.width = '60px'; 
             this.div.style.height = '60px';
             const lottie = document.createElement('dotlottie-wc');
             lottie.setAttribute('src', 'https://lottie.host/d45feb07-4dc9-43c0-8d16-47268bb44db8/ewadSo9yEE.lottie');
             lottie.setAttribute('autoplay', 'true');
             lottie.setAttribute('loop', 'true');
             lottie.style.width = '100%';
             lottie.style.height = '100%';
             this.div.appendChild(lottie);
        }

        this.div.onclick = (e) => { e.stopPropagation(); onMarkerClick(this.report); };
        this.div.ontouchend = (e) => { e.stopPropagation(); onMarkerClick(this.report); };
        this.getPanes().overlayMouseTarget.appendChild(this.div);
      }
      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const point = projection.fromLatLngToDivPixel(this.position);
        if (this.div && point) { this.div.style.left = point.x + "px"; this.div.style.top = point.y + "px"; }
      }
      onRemove() { this.div?.parentNode?.removeChild(this.div!); }
    }

    const newMarkers: any[] = [];
    
    hazards.forEach(hazard => {
        if (!hazard.location) return;
        
        // Find verified repairs linked to this hazard
        // Logic: Checks parentReportId OR spatial proximity (fallback for old reports)
        const relevantRepairs = allRepairs.filter(r => 
            (r.parentReportId === hazard.id) || 
            (getDistance(hazard, r) < 30 && r.analysis.repair_quality_audit?.status === 'GENUINE_REPAIR')
        );

        // Count unique devices that verified it
        const uniqueDevices = new Set(relevantRepairs.map(r => r.deviceId || 'unknown'));
        const verificationCount = uniqueDevices.size;

        // LOGIC: 
        // 0 = Red (Active)
        // 1-2 = Green (Verifying) -> CHANGED TO YELLOW
        // 3+ = Resolved (Hidden from map as hazard)
        
        if (verificationCount >= 3) return; // HIDDEN COMPLETELY

        let status: 'active' | 'verifying' = verificationCount > 0 ? 'verifying' : 'active';
        
        if (status === 'verifying') pendingCount++; else activeCount++;

        const latLng = new window.google.maps.LatLng(hazard.location.lat, hazard.location.lng);
        const marker = new SmartMarkerOverlay(latLng, hazard, status, verificationCount);
        marker.setMap(mapInstanceRef.current);
        newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
    setProcessedMapData({ activeHazards: activeCount, pendingVerifications: pendingCount });

  }, [reports, isMapLoaded]);

  // --- CONTROLS ---
  const handleRecenter = () => {
    if (mapInstanceRef.current && location) {
        mapInstanceRef.current.panTo(new window.google.maps.LatLng(location.lat, location.lng));
        mapInstanceRef.current.setZoom(18);
    }
  };
  
  const handleToggleMapType = () => {
    if (mapInstanceRef.current) {
        const newType = mapType === 'hybrid' ? 'roadmap' : 'hybrid';
        mapInstanceRef.current.setMapTypeId(newType);
        setMapType(newType);
    }
  };

  const handleZoom = (delta: number) => {
      if(mapInstanceRef.current) mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
  };

  if (!isMapLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-xs tracking-widest uppercase animate-pulse">Initializing Satellite Link...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-gray-100 overflow-hidden">
        <ReportsDrawer 
            isOpen={isReportsOpen} 
            onClose={() => setIsReportsOpen(false)} 
            reports={reports}
            onSelectReport={(r) => {
                if (mapInstanceRef.current && r.location) {
                    mapInstanceRef.current.panTo(new window.google.maps.LatLng(r.location.lat, r.location.lng));
                    mapInstanceRef.current.setZoom(20);
                    onMarkerClick(r);
                }
            }}
        />

        <div ref={mapRef} className="w-full h-full" style={{minHeight: '500px'}} />
        
        {/* --- GOOGLE ATTRIBUTION OVERLAY --- */}
        <div className="absolute bottom-1.5 left-2 z-[70] pointer-events-none select-none flex items-center gap-1.5 opacity-90 mix-blend-difference filter drop-shadow-md">
             <img src="https://maps.gstatic.com/mapfiles/api-3/images/google_white5.png" alt="Google" className="h-5" />
             <span className="text-[10px] text-white font-medium font-sans opacity-90">Map data ©{new Date().getFullYear()} Google</span>
        </div>

        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-gray-800">Active: <span className="font-bold">{processedMapData.activeHazards}</span></span>
            </div>
            {processedMapData.pendingVerifications > 0 && (
                 <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-yellow-500/50 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></span>
                    <span className="text-xs font-medium text-gray-800">Verifying: <span className="font-bold">{processedMapData.pendingVerifications}</span></span>
                </div>
            )}
        </div>

        {!isReportsOpen && (
            <div className="absolute bottom-28 left-4 z-[80] flex flex-col items-start pointer-events-auto">
                <button onClick={() => setIsReportsOpen(true)} className="bg-slate-900 text-white p-3 rounded-full shadow-2xl border-2 border-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <span className="text-xl">📄</span><span className="text-[10px] font-bold uppercase hidden md:block">Reports</span>
                </button>
            </div>
        )}

        <div className="absolute bottom-48 right-4 z-10 flex flex-col gap-3 items-center pointer-events-none">
             <div className="flex flex-col gap-2 pointer-events-auto items-center">
                <button onClick={handleToggleMapType} className="w-10 h-10 bg-white text-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 border border-gray-100">
                    <span className="text-xs font-bold">{mapType === 'hybrid' ? 'MAP' : 'SAT'}</span>
                </button>
                <button onClick={handleRecenter} className="w-10 h-10 bg-white text-blue-600 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:scale-95 border border-gray-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <div className="bg-white rounded-full shadow-lg flex flex-col items-center overflow-hidden mt-1 border border-gray-100">
                    <button onClick={() => handleZoom(1)} className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100">+</button>
                    <button onClick={() => handleZoom(-1)} className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100">-</button>
                </div>
             </div>
             
             {/* THE GREEN REPAIR BUTTON - CONTROLLED STATE */}
             <button 
                onClick={onTriggerRepair} 
                disabled={!isRepairUnlocked}
                className={`pointer-events-auto w-14 h-14 rounded-full mt-2 transition-all duration-500 shadow-xl overflow-hidden flex items-center justify-center
                    ${isRepairUnlocked 
                        ? 'bg-green-500 active:scale-95 green-pulse ring-2 ring-white cursor-pointer' 
                        : 'bg-gray-600 grayscale opacity-80 cursor-not-allowed border-4 border-gray-700'}
                `}
             >
                 {isRepairUnlocked ? (
                     <img src="https://ik.imagekit.io/kff5oshkqj/unnamed%20(1)-modified.webp?updatedAt=1769265416727" alt="Verify" className="w-full h-full object-contain" />
                 ) : (
                     <div className="flex flex-col items-center justify-center text-gray-400">
                        <span className="text-2xl">🔒</span>
                     </div>
                 )}
             </button>
             {!isRepairUnlocked && (
                 <div className="bg-black/80 text-white text-[8px] font-bold px-2 py-1 rounded backdrop-blur-sm uppercase tracking-wider text-center max-w-[80px]">
                     20m Range Req.
                 </div>
             )}
        </div>
    </div>
  );
};

export default SimpleMap;
