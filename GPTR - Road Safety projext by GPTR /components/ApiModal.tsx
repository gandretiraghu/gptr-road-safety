
import React, { useState } from 'react';

interface ApiModalProps {
    onClose: () => void;
}

const ApiModal: React.FC<ApiModalProps> = ({ onClose }) => {
    const [copied, setCopied] = useState<string>("");
    const [showEmail, setShowEmail] = useState(false);
    const API_BASE_URL = "https://us-central1-gptr-pathole.cloudfunctions.net/api";

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(""), 2000);
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-5 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                            <span className="text-2xl">📡</span>
                        </div>
                        <div>
                            <h2 className="text-white font-black uppercase tracking-wider text-sm">GPTR Open Data</h2>
                            <p className="text-[10px] text-blue-200">Civic Intelligence Network</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-white/10 transition-colors">✕</button>
                </div>

                <div className="p-5 overflow-y-auto space-y-6">
                    <p className="text-gray-400 text-xs leading-relaxed">
                        GPTR exposes real-time road safety data to third-party developers, mapping services, and government bodies to build safer cities.
                    </p>

                    {/* API 1: Navigation */}
                    <div className="bg-black/30 rounded-xl border border-emerald-500/30 overflow-hidden">
                        <div className="bg-emerald-500/10 p-3 border-b border-emerald-500/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🧭</span>
                                <h3 className="text-emerald-400 font-bold uppercase text-xs tracking-wider">Public Navigation API</h3>
                            </div>
                            <span className="bg-emerald-500 text-black text-[9px] font-bold px-2 py-0.5 rounded">LIVE</span>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-300 text-[11px] mb-3 leading-relaxed">
                                Optimized for <b className="text-white">Navigation Apps & Logistics</b>.
                            </p>
                            <div className="bg-black p-2 rounded border border-gray-700 flex items-center justify-between gap-2">
                                <code className="text-[10px] text-gray-400 font-mono truncate">{API_BASE_URL}/navigate?key=YOUR_KEY</code>
                                <button 
                                    onClick={() => copyToClipboard(`${API_BASE_URL}/navigate?key=YOUR_NAV_KEY`, "nav")}
                                    className="text-[10px] bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 hover:bg-gray-700"
                                >
                                    {copied === "nav" ? "Copied" : "Copy Link"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* API 2: Civic Data */}
                    <div className="bg-black/30 rounded-xl border border-amber-500/30 overflow-hidden">
                        <div className="bg-amber-500/10 p-3 border-b border-amber-500/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏛️</span>
                                <h3 className="text-amber-400 font-bold uppercase text-xs tracking-wider">Govt Civic Data API</h3>
                            </div>
                            <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded">SECURE</span>
                        </div>
                        <div className="p-4">
                            <p className="text-gray-300 text-[11px] mb-3 leading-relaxed">
                                High-level access for <b className="text-white">Municipal Corporations</b>.
                            </p>
                            <div className="bg-black p-2 rounded border border-gray-700 flex items-center justify-between gap-2">
                                <code className="text-[10px] text-gray-400 font-mono truncate">{API_BASE_URL}/civic</code>
                                <button 
                                    onClick={() => copyToClipboard(`${API_BASE_URL}/civic`, "civic")}
                                    className="text-[10px] bg-gray-800 text-white px-2 py-1 rounded border border-gray-600 hover:bg-gray-700"
                                >
                                    {copied === "civic" ? "Copied" : "Copy Link"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl text-center">
                        <h4 className="text-blue-300 font-bold text-xs uppercase mb-1">Need Access Keys?</h4>
                        <p className="text-[10px] text-gray-400">Keys are issued to verified organizations only.</p>
                        
                        {!showEmail ? (
                            <button 
                                onClick={() => setShowEmail(true)}
                                className="mt-3 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors uppercase tracking-widest shadow-lg"
                            >
                                Contact GPTR Admin
                            </button>
                        ) : (
                            <div className="mt-3 animate-in fade-in zoom-in">
                                <p className="text-white font-mono text-sm font-bold bg-black/40 py-2 rounded border border-blue-500/30 select-all">
                                    gptrofficial@gmail.com
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiModal;
