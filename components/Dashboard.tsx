
import React, { useEffect, useState } from 'react';
import { UserProfile, Report } from '../types';
import { getUserReports, generateCertificate } from '../services/userService';
import { auth } from '../services/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Severity } from '../types';

interface DashboardProps {
    user: UserProfile;
    onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onClose }) => {
    const [history, setHistory] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [certLoading, setCertLoading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            const reports = await getUserReports(user.uid);
            setHistory(reports);
            setLoading(false);
        };
        fetchHistory();
    }, [user.uid]);

    const handleLogout = () => {
        signOut(auth);
        onClose();
    };

    const handleDownloadCertificate = async () => {
        setCertLoading(true);
        const dataUrl = await generateCertificate(user);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `GPTR_Certificate_${user.name}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setCertLoading(false);
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
        <div className="fixed inset-0 z-[1000] bg-black/95 overflow-y-auto">
            {/* Header */}
            <div className="bg-slate-900 p-5 border-b border-white/10 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-white font-bold leading-none">{user.name}</h2>
                        <p className="text-[10px] text-gray-400 uppercase">{user.district}, {user.state}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 text-2xl">✕</button>
            </div>

            <div className="p-5 space-y-6 max-w-2xl mx-auto">
                
                {/* Stats Card */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                        <p className="text-3xl font-black text-yellow-400">{user.points}</p>
                        <p className="text-[10px] uppercase text-gray-400 tracking-wider">Safety Points</p>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                        <p className="text-3xl font-black text-blue-400">{user.reportsCount}</p>
                        <p className="text-[10px] uppercase text-gray-400 tracking-wider">Hazards Reported</p>
                    </div>
                </div>

                {/* Certificate Section */}
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-5 rounded-xl border border-blue-700/50 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl mb-3">🎖️</div>
                    <h3 className="text-white font-bold uppercase tracking-widest text-sm mb-2">Appreciation Certificate</h3>
                    <p className="text-xs text-blue-200 mb-4 px-4">
                        Thank you for being a responsible citizen. Download your official GPTR contribution certificate.
                    </p>
                    <button 
                        onClick={handleDownloadCertificate}
                        disabled={certLoading}
                        className="bg-white text-blue-900 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
                    >
                        {certLoading ? "Generating..." : "Download Certificate"}
                    </button>
                </div>

                {/* History List */}
                <div>
                    <h3 className="text-white font-bold uppercase text-xs mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Report History
                    </h3>
                    
                    {loading ? (
                        <div className="text-center text-gray-500 text-xs py-10">Loading history...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center text-gray-500 text-xs py-10 border border-dashed border-gray-700 rounded">
                            No reports yet. Start checking roads!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map(report => (
                                <div key={report.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex gap-3">
                                    <div className="w-16 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                                        <img src={report.image} className="w-full h-full object-cover" alt="Thumb" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-white capitalize">{report.analysis.hazard_type.replace(/_/g, ' ')}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded text-white font-bold uppercase ${getSeverityColor(report.analysis.severity)}`}>
                                                {report.analysis.severity}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                                            {report.addressContext?.formattedAddress || "Location processing..."}
                                        </p>
                                        <p className="text-[9px] text-gray-500 mt-2">
                                            {new Date(report.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleLogout}
                    className="w-full py-3 border border-red-500/50 text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500/10"
                >
                    Logout
                </button>
                
                <div className="h-20"></div>
            </div>
        </div>
    );
};

export default Dashboard;
