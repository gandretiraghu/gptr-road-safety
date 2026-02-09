
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SimpleMap from './components/SimpleMap';
import CameraInput, { CameraInputHandle } from './components/CameraInput';
import AnalysisModal from './components/AnalysisModal';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import ApiModal from './components/ApiModal'; 
import { analyzeRoadImage, verifyRepairWithDualImages } from './services/geminiService';
import { processAndWatermarkImage, compressImage } from './services/imageProcessor';
import { saveLocalReport, subscribeToReports, testFirebaseConnection } from './services/storageService';
import { getLocationIntelligence } from './services/placesService';
import { awardPoints, getUserProfile } from './services/userService';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { GeoLocation, GPTRAnalysisResult, Report, AddressContext, UserProfile } from './types';

// Helper: Calculate Distance in Meters
const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; 
  return d * 1000; 
};

// Helper: Get or Create Device ID
const getDeviceId = () => {
    let id = localStorage.getItem('gptr_device_id');
    if (!id) {
        id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem('gptr_device_id', id);
    }
    return id;
};

// Helper: Time Rule Check (6 AM to 6 PM)
const isReportingTimeAllowed = (): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    // Allow if 6 <= Hour < 18 (i.e., 6:00 AM to 5:59 PM)
    return currentHour >= 6 && currentHour < 18;
};

const App: React.FC = () => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [captureLocation, setCaptureLocation] = useState<GeoLocation | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'weak' | 'good' | 'mock_suspected'>('searching');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing..."); 
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isRepairMode, setIsRepairMode] = useState(false); 
  const [analysisResult, setAnalysisResult] = useState<GPTRAnalysisResult | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null); 
  const [selectedReportRelated, setSelectedReportRelated] = useState<Report[]>([]); 
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<{source: 'storage' | 'database', message: string} | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<AddressContext | undefined>(undefined); 
  
  const [showLowRiskAlert, setShowLowRiskAlert] = useState(false);
  
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isApiOpen, setIsApiOpen] = useState(false);
  
  // Logic Control States
  const [nearbyAlert, setNearbyAlert] = useState<{found: boolean, distance: number, id: string} | null>(null);
  const [isRepairUnlocked, setIsRepairUnlocked] = useState(false);

  const deviceId = useRef(getDeviceId());
  const cameraRef = useRef<CameraInputHandle>(null);

  const checkConnection = async () => {
    setIsRetrying(true);
    const result = await testFirebaseConnection();
    if (!result.success && result.errorSource) {
        let msg = result.errorSource === 'storage' 
            ? "Network Block: Cannot Upload Photos. Try Switching Data/WiFi." 
            : "Database Offline.";
        setConfigError({ source: result.errorSource, message: msg });
    } else {
        setConfigError(null); 
    }
    setIsRetrying(false);
  };

  useEffect(() => {
    checkConnection();
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            let profile = await getUserProfile(currentUser.uid);
            
            // --- FIX FOR SIGNUP RACE CONDITION ---
            // If user just signed up, Firestore document might not be ready instantly.
            // We retry once after a short delay.
            if (!profile) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                profile = await getUserProfile(currentUser.uid);
            }
            
            setUser(profile);
        } else {
            setUser(null);
        }
    });

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy, speed, heading, altitude } = position.coords;
          const isAccuracyGood = accuracy <= 25; 
          const looksLikeMock = altitude === null && accuracy === 5 && speed === 0;

          const newLoc = {
            lat: Number(latitude),
            lng: Number(longitude),
            accuracy: Number(accuracy),
            speed: speed ? Number(speed) : null,
            heading: heading ? Number(heading) : null
          };
          setLocation(newLoc);

          if (looksLikeMock) setGpsStatus('mock_suspected');
          else if (!isAccuracyGood) setGpsStatus('weak');
          else setGpsStatus('good');
        },
        (err) => {
            console.error("Geolocation error:", err);
            setError("GPS Permission Denied. Enable Location.");
            setGpsStatus('searching');
        },
        { enableHighAccuracy: true, maximumAge: 0 } 
      );
      
      const unsubscribe = subscribeToReports(
          (liveReports) => {
            setReports(liveReports);
            setConfigError((prev) => prev?.source === 'database' ? null : prev);
          },
          (err) => {
              if (err.code === 'permission-denied' || err.message?.includes("permission")) {
                  setConfigError({ source: 'database', message: "Database Permission Denied" });
              }
          }
      );
      return () => {
        navigator.geolocation.clearWatch(watchId);
        unsubscribe();
        unsubAuth();
      };
    } else {
      setError("Geolocation is not supported.");
    }
  }, []);

  // --- NEARBY CHECK (20m LOCK LOGIC) ---
  useEffect(() => {
      if (!location || reports.length === 0) return;
      
      let closestReport = null;
      let minDist = Infinity;
      const LOCK_DISTANCE_METERS = 20; 

      for (const report of reports) {
          if (report.location && report.reportType !== 'repair') {
              const dist = getDistanceFromLatLonInM(location.lat, location.lng, report.location.lat, report.location.lng);
              if (dist < minDist) {
                  minDist = dist;
                  closestReport = report;
              }
          }
      }

      if (closestReport && minDist <= LOCK_DISTANCE_METERS) {
          setNearbyAlert({ found: true, distance: Math.round(minDist), id: closestReport.id });
          setIsRepairUnlocked(true); // Unlock Green Button, Lock Red Button
      } else {
          setNearbyAlert(null);
          setIsRepairUnlocked(false); // Lock Green Button, Unlock Red Button
      }
  }, [location, reports]);


  // Handler for GREEN BUTTON (Repair)
  const handleTriggerRepair = () => {
    // 0. TIME RULE CHECK
    if (!isReportingTimeAllowed()) {
        setError("🌙 Night Safety Rule: Reports are only accepted between 6:00 AM and 6:00 PM for better visibility.");
        return;
    }

    // 1. Strict Check: Must be unlocked
    if (!isRepairUnlocked || !nearbyAlert) {
        setError("You must be within 20m of a reported hazard to verify repairs.");
        return;
    }

    // 2. DUPLICATE CHECK (One repair per device per hazard)
    const alreadyVerified = reports.find(r => 
        r.reportType === 'repair' &&
        r.parentReportId === nearbyAlert.id &&
        r.deviceId === deviceId.current
    );

    if (alreadyVerified) {
        setError("🚫 You already submitted this repair! Please ask another person (different device) to verify.");
        return;
    }

    // 3. Basic GPS Checks
    if (!location) { setError("Waiting for GPS signal..."); return; }
    
    // 4. FORCE SET REPAIR MODE
    setIsRepairMode(true);
    
    // 5. Programmatically trigger camera
    setTimeout(() => {
        if (cameraRef.current) {
            cameraRef.current.triggerCamera();
        } else {
            console.error("Camera Reference Missing");
            setError("Camera error. Please refresh and try again.");
            setIsRepairMode(false);
        }
    }, 100);
  };

  // Handler for RED BUTTON (Hazard)
  const handleTriggerHazard = (file: File) => {
      // 0. TIME RULE CHECK
      if (!isReportingTimeAllowed()) {
          setError("🌙 Night Safety Rule: Reports are only accepted between 6:00 AM and 6:00 PM for better visibility.");
          return;
      }

      // 1. Strict Check: Must be unlocked (Not near existing pothole)
      if (nearbyAlert) {
           setError("Cannot report new hazard here. Existing report nearby. Use Green Button to verify.");
           return;
      }

      // 2. FORCE DISABLE REPAIR MODE
      setIsRepairMode(false);
      handleCapture(file);
  };

  const handleCameraCancel = () => {
      // Reset modes when camera is closed without capture
      setIsRepairMode(false);
  };

  const handleCapture = useCallback(async (file: File) => {
    if (!location) { setError("Waiting for GPS lock..."); return; }
    
    setCaptureLocation(location);

    try {
        setIsAnalyzing(true); 
        setLoadingText(isRepairMode ? "Analyzing Repair Quality..." : "Processing Visual Data...");
        const compressedFile = await compressImage(file);
        setRawFile(compressedFile); 

        const watermarkedBase64 = await processAndWatermarkImage(compressedFile, location, { isFinalUpload: false });
        setPreviewImage(watermarkedBase64);
        setAnalysisResult(null); 
        setSelectedReport(null); 
        setSelectedReportRelated([]);
        setCurrentAddress(undefined);
    } catch (e) {
        setError("Processing Failed");
        setCaptureLocation(null);
    } finally {
        setIsAnalyzing(false);
    }
  }, [location, isRepairMode]);

  const handleConfirmAnalysis = async () => {
    if (!previewImage || !captureLocation) { setError("Error: Capture location lost. Retake photo."); return; }
    setIsAnalyzing(true);
    setError(null);
    try {
        const gpsMeta = `--- GPS METADATA ---\nACCURACY: ${captureLocation.accuracy}m\nSTATUS: ${gpsStatus.toUpperCase()}\nDEVICE_ID: ${deviceId.current}`;

        // --- NEW LOGIC: REPAIR MODE (DUAL IMAGE ANALYSIS) ---
        if (isRepairMode && nearbyAlert) {
             setLoadingText("Running Side-by-Side Forensic Match...");
             
             // Find the original report to compare against
             const originalReport = reports.find(r => r.id === nearbyAlert.id);
             
             if (!originalReport) {
                 throw new Error("Original report data missing. Cannot verify.");
             }

             // Call new service
             const result = await verifyRepairWithDualImages(previewImage, originalReport.image, gpsMeta);
             setAnalysisResult(result);

        } else {
            // --- STANDARD LOGIC: NEW HAZARD ---
            setLoadingText("Running AI Analysis...");
            
            const CACHE_RADIUS_METERS = 50; 
            let cachedAddress: AddressContext | undefined = undefined;
            let promptContext = `GPS: ${captureLocation.lat}, ${captureLocation.lng}\nContext: Evaluating road safety.`;
    
            const nearbyReport = reports.find(r => 
                r.addressContext && r.location && 
                getDistanceFromLatLonInM(captureLocation.lat, captureLocation.lng, r.location.lat, r.location.lng) < CACHE_RADIUS_METERS
            );
    
            if (nearbyReport && nearbyReport.addressContext) {
                cachedAddress = nearbyReport.addressContext;
                promptContext += `\nVerified Location: ${cachedAddress.formattedAddress}`;
                setCurrentAddress(cachedAddress);
            }

            // Simple history context string
            const historyContext = "STANDARD_ANALYSIS";
            
            const result = await analyzeRoadImage(previewImage, promptContext, historyContext, gpsMeta);
            setAnalysisResult(result);

            if (result.is_road && !cachedAddress) {
                 setLoadingText("AI Approved. Fetching Location Data...");
                 const { address } = await getLocationIntelligence(captureLocation);
                 if (address) setCurrentAddress(address);
            }
        }

    } catch (err: any) {
        console.error(err);
        setError("Analysis Failed. " + (err.message || "Check Connection."));
        setAnalysisResult(null);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    setRawFile(null); 
    setAnalysisResult(null);
    setCaptureLocation(null);
    setError(null);
    setIsRepairMode(false); // Reset mode
    setSelectedReport(null);
    setSelectedReportRelated([]);
    setUploadSuccess(false);
    setShowLowRiskAlert(false); 
    setCurrentAddress(undefined);
  };

  const handleMarkerClick = (r: Report) => {
      setSelectedReport(r);
      
      // Find related repairs for history timeline
      // Updated logic: Match parentReportId OR spatial proximity for legacy support
      const repairs = reports.filter(rep => 
        rep.reportType === 'repair' && 
        (rep.parentReportId === r.id || (
            rep.location && r.location &&
            getDistanceFromLatLonInM(r.location.lat, r.location.lng, rep.location.lat, rep.location.lng) < 30
        ))
      ).sort((a, b) => a.timestamp - b.timestamp);
      
      setSelectedReportRelated(repairs);
  };

  const handleConfirmReport = async () => {
    if (!previewImage || !analysisResult || !captureLocation || !location) return;
    
    if (!analysisResult.is_road) { setError("Invalid Road Image."); return; }

    // Rejection for Low Risk (only for new hazards)
    if (!isRepairMode && analysisResult.accident_probability_score < 40) {
        setShowLowRiskAlert(true); 
        return;
    }

    if (configError) { setError(`System Blocked: ${configError.message}`); return; }

    // Verify distance hasn't drifted too far during analysis
    const distanceFromSite = getDistanceFromLatLonInM(location.lat, location.lng, captureLocation.lat, captureLocation.lng);
    const MAX_ALLOWED_DISTANCE = 50; 

    if (distanceFromSite > MAX_ALLOWED_DISTANCE) {
        setError(`SECURITY BLOCK: Location mismatch. Go back to the site.`);
        return;
    }

    setIsUploading(true); 
    setError(null);
    setLoadingText("Finalizing Evidence Card..."); 

    let finalEvidenceImage = previewImage;
    if (rawFile) {
        try {
            finalEvidenceImage = await processAndWatermarkImage(rawFile, captureLocation, {
                isFinalUpload: true,
                riskScore: analysisResult.accident_probability_score,
                address: currentAddress,
                reporterName: user ? user.name : "Anonymous Citizen"
            });
        } catch (e) {
            console.error("Failed to generate final evidence card", e);
        }
    }

    setLoadingText("Uploading Evidence...");

    const cleanLocation: GeoLocation = {
        lat: Number(captureLocation.lat),
        lng: Number(captureLocation.lng),
        accuracy: captureLocation.accuracy ? Number(captureLocation.accuracy) : 0,
        speed: captureLocation.speed ? Number(captureLocation.speed) : null,
        heading: captureLocation.heading ? Number(captureLocation.heading) : null
    };

    const cleanAddress: AddressContext | undefined = currentAddress 
        ? { ...currentAddress } 
        : undefined;

    const newReport: Report = {
        id: Math.random().toString(36).substr(2, 9),
        deviceId: deviceId.current,
        userId: user ? user.uid : undefined, 
        userName: user ? user.name : "Anonymous Citizen",
        image: finalEvidenceImage, 
        location: cleanLocation,
        timestamp: Date.now(),
        analysis: analysisResult,
        reportType: isRepairMode ? 'repair' : 'hazard',
        parentReportId: isRepairMode && nearbyAlert ? nearbyAlert.id : undefined, // LINKING ID HERE
        addressContext: cleanAddress
    };

    try {
        await saveLocalReport(newReport, (status) => setLoadingText(status));
        if (user) {
             setLoadingText("Updating Leaderboard...");
             const points = isRepairMode ? 25 : 10;
             await awardPoints(user.uid); 
             const updatedProfile = await getUserProfile(user.uid);
             if (updatedProfile) setUser(updatedProfile);
        }
        setUploadSuccess(true);
        setTimeout(() => {
            handleRetake();
            setUploadSuccess(false);
            setIsUploading(false);
        }, 1500);
    } catch (e: any) {
        setIsUploading(false);
        setUploadSuccess(false);
        setError(e.message || "Upload Failed.");
    }
  };

  const renderGPSStatusBar = () => {
      let color = 'bg-gray-800';
      let text = 'INITIALIZING SATELLITES...';
      let icon = '📡';
      if (gpsStatus === 'good') { color = 'bg-green-600'; text = `GPS LOCKED (${location?.accuracy?.toFixed(0)}m)`; icon = '🛰️'; } 
      else if (gpsStatus === 'weak') { color = 'bg-amber-500'; text = `WEAK SIGNAL (${location?.accuracy?.toFixed(0)}m) - MOVE OUTSIDE`; icon = '⚠️'; } 
      else if (gpsStatus === 'mock_suspected') { color = 'bg-red-600'; text = 'FAKE GPS DETECTED - BLOCKED'; icon = '🚫'; } 
      else if (gpsStatus === 'searching') { color = 'bg-blue-600'; text = 'SEARCHING FOR SATELLITES...'; icon = '📡'; }
      return (
          <div className={`absolute top-0 left-0 right-0 z-20 ${color} text-white text-[10px] font-bold py-2 px-4 flex justify-between items-center transition-colors duration-500 shadow-md`}>
              <span className="flex items-center gap-2">{icon} {text}</span>
              {location && <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}
          </div>
      );
  };

  const shouldShowCamera = !previewImage && !isAnalyzing && !isUploading && !selectedReport && !isReportsOpen;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col font-sans">
      
      {renderGPSStatusBar()}

      {/* API Button */}
      {!previewImage && !isAnalyzing && !selectedReport && (
          <div className="absolute top-12 right-4 z-[90]">
              <button 
                onClick={() => setIsApiOpen(true)}
                className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-blue-500/50 shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
              >
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">GPTR Open Civic Data API</span>
              </button>
          </div>
      )}

      {/* Modals */}
      {showLowRiskAlert && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="bg-green-100 p-6 flex flex-col items-center border-b border-green-200">
                      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl shadow-inner mb-2">👍</div>
                      <h2 className="text-xl font-black text-green-800 uppercase tracking-tighter">Safe Road</h2>
                  </div>
                  <div className="p-6 text-center">
                      <p className="text-gray-800 font-bold text-lg mb-2">
                          "Road Looks Safe!"
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                         The AI analysis indicates this road is in good condition. Please report only dangerous potholes or significant safety hazards.
                      </p>
                      <button 
                          onClick={handleRetake}
                          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs active:scale-95 transition-transform"
                      >
                          Okay, I Understood
                      </button>
                  </div>
              </div>
          </div>
      )}

      {nearbyAlert && !previewImage && !isReportsOpen && !selectedReport && (
          <div className="absolute top-16 left-4 right-4 z-[90] bg-purple-600/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between border border-purple-400">
               <div>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">PROXIMITY ALERT</p>
                   <p className="text-sm font-bold">Existing Report {nearbyAlert.distance}m away!</p>
               </div>
               <button onClick={() => {
                   const r = reports.find(x => x.id === nearbyAlert.id);
                   if(r) handleMarkerClick(r);
               }} className="bg-white text-purple-700 px-3 py-1.5 rounded text-xs font-bold shadow-sm active:scale-95">
                   VIEW IT
               </button>
          </div>
      )}

      {configError && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-2 rounded shadow-lg text-xs font-bold flex gap-3 items-center whitespace-nowrap">
               <span>{configError.message}</span>
               <button onClick={checkConnection} className="bg-white text-red-600 px-2 rounded hover:bg-gray-100">RETRY</button>
          </div>
      )}

      {/* Map Layer */}
      <div className="flex-grow relative z-0 mt-8"> 
        <SimpleMap 
            location={location} 
            reports={reports} 
            onTriggerRepair={handleTriggerRepair} 
            onMarkerClick={handleMarkerClick} 
            isReportsOpen={isReportsOpen}
            setIsReportsOpen={setIsReportsOpen}
            isRepairUnlocked={isRepairUnlocked}
        />
      </div>

      {error && (
        <div className="absolute top-32 left-4 right-4 z-[100] bg-white text-red-600 p-3 rounded-lg shadow-xl text-center text-sm font-medium border-l-4 border-red-600 animate-pulse">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-black">Dismiss</button>
        </div>
      )}

      {/* Camera Input Layer - ALWAYS VISIBLE BUT LOCK STATE CHANGES */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 pb-10 pt-20 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none flex flex-col items-center justify-end transition-opacity duration-300 ${shouldShowCamera ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`pointer-events-auto transition-all duration-300 ${gpsStatus !== 'good' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
               
               {/* CAMERA INPUT (RED BUTTON) */}
               {/* LOCKED if nearbyAlert is TRUE. UNLOCKED if nearbyAlert is FALSE. */}
               <CameraInput 
                    ref={cameraRef}
                    onCapture={handleTriggerHazard} 
                    isProcessing={false} 
                    isRepairMode={isRepairMode} 
                    isVisible={shouldShowCamera} 
                    isLocked={!!nearbyAlert} 
                    onCancel={handleCameraCancel}
               />
            </div>
            
            {/* Contextual Status Text */}
            {shouldShowCamera && (
                nearbyAlert ? (
                    <div className="text-white text-[10px] font-bold mt-2 bg-red-600/80 backdrop-blur px-3 py-1 rounded-full border border-red-400 uppercase tracking-wider animate-pulse">
                        REPORT EXISTS HERE - USE GREEN BUTTON
                    </div>
                ) : gpsStatus !== 'good' && (
                    <div className="text-white text-[10px] font-bold mt-2 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                        {gpsStatus === 'mock_suspected' ? '🚫 MOCK LOCATION DETECTED' : '⚠️ WAIT FOR BETTER ACCURACY (<20m)'}
                    </div>
                )
            )}
      </div>

      {/* Controls & Nav */}
      {!isReportsOpen && !isLeaderboardOpen && !selectedReport && !previewImage && (
          <div className="absolute bottom-28 left-4 z-[80] flex flex-col items-start gap-3 pointer-events-auto">
             <button onClick={() => setIsReportsOpen(true)} className="bg-slate-900 text-white p-3 rounded-full shadow-2xl border-2 border-slate-700 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <span className="text-xl">📄</span><span className="text-[10px] font-bold uppercase hidden md:block">Reports</span>
              </button>
              <button onClick={() => setIsLeaderboardOpen(true)} className="bg-yellow-500 text-black p-3 rounded-full shadow-2xl border-2 border-yellow-300 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <span className="text-xl">🏆</span><span className="text-[10px] font-bold uppercase hidden md:block">Leaders</span>
              </button>
          </div>
      )}

      {!isReportsOpen && !selectedReport && !previewImage && (
          <div className="absolute bottom-24 right-4 z-[80] pointer-events-auto">
             {user ? (
                 <button onClick={() => setIsDashboardOpen(true)} className="w-12 h-12 bg-blue-600 rounded-full border-2 border-blue-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                     <span className="text-lg font-bold text-white">{user.name.charAt(0)}</span>
                 </button>
             ) : (
                 <button onClick={() => setIsAuthOpen(true)} className="w-12 h-12 bg-white text-blue-600 rounded-full border-2 border-blue-100 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                     <span className="text-xl">👤</span>
                 </button>
             )}
          </div>
      )}

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} onLoginSuccess={() => setIsDashboardOpen(true)} />}
      {isDashboardOpen && user && <Dashboard user={user} onClose={() => setIsDashboardOpen(false)} />}
      {isLeaderboardOpen && <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />}
      {isApiOpen && <ApiModal onClose={() => setIsApiOpen(false)} />} 

      {/* Review Screen */}
      {previewImage && !isAnalyzing && !analysisResult && !isUploading && (
         <div className="fixed inset-0 z-[2000] bg-black flex flex-col h-[100dvh]">
             <div className="relative flex-1 bg-gray-900 min-h-0 w-full">
                 <img src={previewImage} className="w-full h-full object-contain" alt="Preview" />
                 <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                     <span className={`px-3 py-1 rounded-full text-xs backdrop-blur-md border font-bold uppercase ${isRepairMode ? 'bg-green-600/80 border-green-400 text-white' : 'bg-black/50 border-white/20 text-white'}`}>
                        {isRepairMode ? '🛠️ Repair Verification Mode' : 'New Hazard Report'}
                     </span>
                 </div>
                 {captureLocation && captureLocation.accuracy && (
                     <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur text-white p-2 rounded text-[10px] font-mono border border-white/10 pointer-events-none">
                         Capture Acc: {captureLocation.accuracy.toFixed(1)}m | Mode: {isRepairMode ? 'REPAIR AUDIT' : 'STANDARD'}
                     </div>
                 )}
             </div>
             
             <div className="p-4 pb-8 bg-black border-t border-gray-800 flex gap-4 shrink-0">
                 <button onClick={handleRetake} className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium active:scale-95 transition-transform">Retake</button>
                 <button onClick={handleConfirmAnalysis} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold active:scale-95 transition-transform">
                    {isRepairMode ? "Verify Repair" : "Analyze"}
                 </button>
             </div>
         </div>
      )}

      {/* Loading States */}
      {isAnalyzing && (
          <div className="fixed inset-0 z-[2001] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white font-medium text-sm">{loadingText}</p>
          </div>
      )}

      {isUploading && (
          <div className="fixed inset-0 z-[2001] bg-black/90 flex flex-col items-center justify-center p-6 text-center">
              {!uploadSuccess ? (
                  <>
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-green-500 font-medium text-sm">{loadingText}</p>
                  </>
              ) : (
                  <>
                     <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 text-white text-2xl">✓</div>
                     <h2 className="text-xl font-bold text-white">Report Sent</h2>
                     {user ? (
                         <div className="mt-2 text-center">
                            <p className="text-yellow-400 font-bold text-lg">+{isRepairMode ? '25' : '10'} POINTS!</p>
                            <p className="text-gray-400 text-xs mt-1">Great job, {user.name}!</p>
                         </div>
                     ) : (
                         <p className="text-yellow-400 font-bold mt-2 text-xs">Login to earn points!</p>
                     )}
                  </>
              )}
          </div>
      )}

      {/* Result Modals */}
      {analysisResult && previewImage && !isUploading && (
        <AnalysisModal 
          result={analysisResult} 
          imageSrc={previewImage}
          onClose={handleRetake}
          onConfirm={handleConfirmReport}
          locationLabel={currentAddress?.formattedAddress || (captureLocation ? `${captureLocation.lat.toFixed(5)}, ${captureLocation.lng.toFixed(5)}` : "Location Found")}
          location={captureLocation}
          reporterName={user ? user.name : "Anonymous"}
          addressContext={currentAddress} 
        />
      )}

      {selectedReport && (
        <AnalysisModal 
          result={selectedReport.analysis} 
          imageSrc={selectedReport.image}
          onClose={() => { setSelectedReport(null); setSelectedReportRelated([]); }}
          locationLabel={selectedReport.addressContext?.formattedAddress || (selectedReport.location ? `${selectedReport.location.lat.toFixed(5)}, ${selectedReport.location.lng.toFixed(5)}` : "Recorded Location")}
          readOnly={true}
          timestamp={selectedReport.timestamp}
          location={selectedReport.location}
          reporterName={selectedReport.userName}
          addressContext={selectedReport.addressContext}
          relatedReports={selectedReportRelated} // PASSING RELATED REPORTS
        />
      )}
    </div>
  );
};

export default App;
