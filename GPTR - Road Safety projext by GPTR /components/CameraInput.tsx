
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface CameraInputProps {
  onCapture: (file: File) => void;
  isProcessing: boolean;
  isRepairMode?: boolean; 
  isVisible?: boolean; 
  isLocked?: boolean; // NEW: Controls whether the Red button is locked (grayed out)
  onCancel?: () => void; 
}

export interface CameraInputHandle {
    triggerCamera: () => void;
}

const CameraInput = forwardRef<CameraInputHandle, CameraInputProps>(({ onCapture, isProcessing, isRepairMode, isVisible = true, isLocked = false, onCancel }, ref) => {
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Expose method to parent to trigger camera programmatically (for Repair Mode)
  useImperativeHandle(ref, () => ({
      triggerCamera: () => {
          if (!isProcessing) {
              setShowSafetyCheck(true);
          }
      }
  }));

  // Step 1: User clicks main button -> Show Safety Modal
  const handleInitialClick = () => {
    if (isLocked) return; // Do nothing if locked
    if (!isProcessing) {
        setShowSafetyCheck(true);
    }
  };

  // Step 2: User confirms safety -> Open Custom Camera
  const confirmSafetyAndTrigger = () => {
    setShowSafetyCheck(false);
    startCamera();
  };

  const startCamera = async () => {
      setShowCamera(true);
      setCameraError(null);
      try {
          // Attempt to get environment camera, fallback to any available
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                  facingMode: { ideal: "environment" },
                  width: { ideal: 1920 }, 
                  height: { ideal: 1080 }
              },
              audio: false 
          });
          
          setStream(mediaStream);
          if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
          }
      } catch (err) {
          console.error("Camera Error:", err);
          setCameraError("Camera access denied. Please ensure your device has a camera and permissions are granted.");
      }
  };

  const stopCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setShowCamera(false);
      // Notify parent that camera session ended (Reset Mode)
      if (onCancel) onCancel();
  };

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              canvas.toBlob((blob) => {
                  if (blob) {
                      const fileName = isRepairMode ? `repair_audit_${Date.now()}.jpg` : `hazard_report_${Date.now()}.jpg`;
                      const file = new File([blob], fileName, { type: "image/jpeg" });
                      onCapture(file);
                      
                      if (stream) {
                         stream.getTracks().forEach(track => track.stop());
                         setStream(null);
                      }
                      setShowCamera(false);
                      // Don't call onCancel here, because we successfully captured
                  }
              }, 'image/jpeg', 0.95);
          }
      }
  };

  useEffect(() => {
      return () => {
          if (stream) {
              stream.getTracks().forEach(track => track.stop());
          }
      };
  }, [stream]);

  // Determine UI Theme colors
  const themeColor = isRepairMode ? 'green' : 'red';
  const themeBg = isRepairMode ? 'bg-green-600' : 'bg-red-600';
  const themeBorder = isRepairMode ? 'border-green-500' : 'border-red-500';

  return (
    <>
      {/* --- LIVE CAMERA OVERLAY --- */}
      {showCamera && (
          <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center">
              
              {/* Camera Viewfinder */}
              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                  {cameraError ? (
                      <div className="text-white text-center p-6">
                          <p className="text-red-500 font-bold mb-4">⚠️ {cameraError}</p>
                          <button onClick={stopCamera} className="bg-gray-800 text-white px-4 py-2 rounded">Close</button>
                      </div>
                  ) : (
                      <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover" 
                      />
                  )}
                  
                  {/* Grid Lines & UI Overlays */}
                  {!cameraError && (
                      <div className="absolute inset-0 pointer-events-none">
                          <div className="w-full h-1/3 border-b border-white/20"></div>
                          <div className="w-full h-2/3 border-b border-white/20"></div>
                          <div className="absolute top-0 left-1/3 w-px h-full bg-white/20"></div>
                          <div className="absolute top-0 left-2/3 w-px h-full bg-white/20"></div>
                          
                          {/* Repair Mode Indicator */}
                          {isRepairMode && (
                              <div className="absolute top-16 left-0 right-0 flex justify-center">
                                  <div className="bg-green-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg border-2 border-white animate-pulse">
                                      🛠️ Repair Verification Mode
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  {/* Top Bar */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                      <span className={`text-white text-[10px] font-bold uppercase tracking-widest ${themeBg} px-2 py-1 rounded flex items-center gap-1 shadow-lg`}>
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> {isRepairMode ? 'AUDIT LIVE' : 'LIVE'}
                      </span>
                      <button onClick={stopCamera} className="text-white font-bold text-xs bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md active:bg-white/40">✕ CANCEL</button>
                  </div>
              </div>

              {/* Bottom Controls */}
              {!cameraError && (
                  <div className="absolute bottom-0 left-0 right-0 pb-12 pt-8 flex justify-center items-center bg-gradient-to-t from-black via-black/60 to-transparent">
                      <button 
                          onClick={capturePhoto}
                          className={`w-20 h-20 rounded-full bg-white border-4 shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center active:scale-90 transition-transform ${themeBorder}`}
                      >
                          <div className={`w-16 h-16 rounded-full border-2 border-black ${themeBg}`}></div>
                      </button>
                  </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
          </div>
      )}

      {/* --- SAFETY CHECK MODAL --- */}
      {showSafetyCheck && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={() => { setShowSafetyCheck(false); if (onCancel) onCancel(); }}
              ></div>

              {/* Yellow Warning Card (Changes to Green for Repair) */}
              <div className={`relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border-4 transform transition-all scale-100 p-1 ${isRepairMode ? 'bg-green-500 border-green-800' : 'bg-[#FFD000] border-black'}`}>
                  
                  {/* Warning Header */}
                  <div className={`p-6 pb-2 text-center ${isRepairMode ? 'bg-green-500' : 'bg-[#FFD000]'}`}>
                      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 shadow-lg border-2 border-white ${isRepairMode ? 'bg-green-800 text-white' : 'bg-black text-white'}`}>
                          <span className="text-4xl">{isRepairMode ? '🛠️' : '✋'}</span>
                      </div>
                      <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none ${isRepairMode ? 'text-white' : 'text-black'}`}>
                          {isRepairMode ? 'VERIFY\nREPAIR' : 'SAFETY\nFIRST'}
                      </h2>
                      <div className={`w-16 h-1 mx-auto my-3 ${isRepairMode ? 'bg-white' : 'bg-black'}`}></div>
                      <p className={`font-bold text-[10px] uppercase tracking-widest ${isRepairMode ? 'text-green-100' : 'text-black'}`}>Live Camera Only • No Uploads</p>
                  </div>

                  {/* Checklist */}
                  <div className="px-6 py-4">
                      <ul className={`space-y-3 font-bold text-sm ${isRepairMode ? 'text-white' : 'text-black'}`}>
                          <li className="flex items-center gap-3 bg-white/30 p-3 rounded border-2 border-black/10">
                              <span className="text-xl">🚗</span>
                              <span className="leading-tight">Watch out for<br/>oncoming traffic</span>
                          </li>
                          <li className="flex items-center gap-3 bg-white/30 p-3 rounded border-2 border-black/10">
                              <span className="text-xl">🛣️</span>
                              <span className="leading-tight">Do not stand in the<br/>middle of the road</span>
                          </li>
                      </ul>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex flex-col gap-3">
                      <button 
                        onClick={confirmSafetyAndTrigger}
                        className={`w-full py-4 rounded-lg font-black uppercase tracking-wider text-sm shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 border-2 ${isRepairMode ? 'bg-green-900 text-white border-green-700 hover:bg-green-800' : 'bg-black text-[#FFD000] border-black hover:bg-gray-900'}`}
                      >
                          <span className="text-xl">📸</span>
                          <span>OPEN LIVE CAMERA</span>
                      </button>
                      
                      <button 
                        onClick={() => { setShowSafetyCheck(false); if (onCancel) onCancel(); }}
                        className={`w-full py-3 font-bold text-xs uppercase tracking-widest rounded ${isRepairMode ? 'text-white/80 hover:bg-white/10' : 'text-black/60 hover:bg-black/5'}`}
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Main Floating Action Button (Red) - Controlled Visibility & Locking */}
      {isVisible && (
          <div className="relative flex flex-col items-center justify-end pb-8 pointer-events-auto">
            <button
              onClick={handleInitialClick}
              disabled={isProcessing || isLocked}
              className={`
                relative w-24 h-24 rounded-full transition-all duration-300 
                ${isProcessing ? 'opacity-50 grayscale cursor-wait' : ''}
                ${isLocked ? 'bg-gray-800 border-4 border-gray-600 grayscale cursor-not-allowed scale-90' : 'active:scale-95'}
              `}
              aria-label="Report Pothole"
            >
              {isProcessing ? (
                 <div className="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                 </div>
              ) : isLocked ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <span className="text-3xl">🔒</span>
                  </div>
              ) : (
                 <img 
                   src="https://ik.imagekit.io/kff5oshkqj/unnamed%20(1)-modified%20(1).webp?updatedAt=1769265810752" 
                   alt="Report Pothole" 
                   className="w-full h-full object-contain drop-shadow-2xl"
                 />
              )}
            </button>
            <div className={`mt-3 px-3 py-1 rounded-full border transition-all duration-300 ${isLocked ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-black/50 backdrop-blur-md border-white/10 text-white'}`}>
                <span className="text-[10px] font-bold tracking-widest uppercase">
                    {isProcessing ? 'Processing...' : isLocked ? 'Report Locked' : 'Report Pothole'}
                </span>
            </div>
          </div>
      )}
    </>
  );
});

export default CameraInput;
