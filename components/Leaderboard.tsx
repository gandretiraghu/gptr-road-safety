
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { getLeaderboard } from '../services/userService';

interface LeaderboardProps {
    onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLB = async () => {
            const data = await getLeaderboard();
            setUsers(data);
            setLoading(false);
        };
        fetchLB();
    }, []);

    const getRankStyle = (index: number) => {
        if (index === 0) return "bg-yellow-500/20 border-yellow-500 text-yellow-500";
        if (index === 1) return "bg-slate-300/20 border-slate-300 text-slate-300";
        if (index === 2) return "bg-orange-700/20 border-orange-700 text-orange-700";
        return "bg-slate-800 border-slate-700 text-gray-400";
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col">
             <div className="bg-slate-900 p-5 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Leaderboard</h2>
                </div>
                <button onClick={onClose} className="text-gray-400">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
                {loading ? (
                    <div className="text-center text-white py-10">Loading ranks...</div>
                ) : (
                    <div className="space-y-3">
                        {users.map((user, index) => (
                            <div 
                                key={user.uid} 
                                className={`p-4 rounded-xl border flex items-center gap-4 ${getRankStyle(index)}`}
                            >
                                <div className="font-black text-xl w-6 text-center">{index + 1}</div>
                                
                                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center font-bold text-white border border-white/10">
                                    {user.name.charAt(0)}
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                        {user.name}
                                        {index === 0 && <span className="bg-yellow-500 text-black text-[8px] px-1.5 rounded font-black">HERO</span>}
                                    </h4>
                                    <p className="text-[10px] opacity-70">{user.district}</p>
                                </div>

                                <div className="text-right">
                                    <p className="font-black text-lg text-white">{user.points}</p>
                                    <p className="text-[8px] uppercase opacity-70">Points</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
