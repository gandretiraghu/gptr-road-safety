
import React, { useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { createUserProfile } from '../services/userService';

interface AuthModalProps {
    onClose: () => void;
    onLoginSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form Fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [district, setDistrict] = useState("");
    const [state, setState] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isSignup) {
                // SIGN UP LOGIC - Strict Checks
                if (!name.trim()) throw new Error("Please enter your Full Name");
                if (!district.trim()) throw new Error("Please enter your District");
                if (!state.trim()) throw new Error("Please enter your State");
                if (!email.trim()) throw new Error("Please enter your Email");
                if (!password.trim()) throw new Error("Please set a Password");

                const cred = await createUserWithEmailAndPassword(auth, email, password);
                if (cred.user) {
                    await updateProfile(cred.user, { displayName: name });
                    // Create Firestore Profile
                    await createUserProfile(cred.user.uid, {
                        email, name, district, state
                    });
                }

            } else {
                // LOGIN LOGIC
                if (!email.trim() || !password.trim()) throw new Error("Please enter Email and Password");
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes('api-key-not-valid')) {
                setError("System Error: Firebase Version Mismatch. Please refresh the page.");
            } else if (err.code === 'auth/invalid-credential') {
                setError("Incorrect Email or Password.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("This email is already registered. Try logging in.");
            } else {
                // Clean up Firebase error messages
                const msg = err.message || "Unknown error";
                setError(msg.replace("Firebase:", "").replace("auth/", ""));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                
                <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-wider">
                    {isSignup ? "Join GPTR Force" : "Officer Login"}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                    {isSignup ? "Create your civic profile to report hazards." : "Access your dashboard & earn safety points."}
                </p>

                {error && <div className="bg-red-500/20 border border-red-500 text-red-200 text-xs p-3 rounded mb-4 font-bold">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignup && (
                        <>
                            <input 
                                type="text" placeholder="Full Name (Required)" 
                                className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none text-sm"
                                value={name} onChange={e => setName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="text" placeholder="District" 
                                    className="w-1/2 bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none text-sm"
                                    value={district} onChange={e => setDistrict(e.target.value)}
                                />
                                <input 
                                    type="text" placeholder="State" 
                                    className="w-1/2 bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none text-sm"
                                    value={state} onChange={e => setState(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <input 
                        type="email" placeholder="Email Address" 
                        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none text-sm"
                        value={email} onChange={e => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" placeholder="Password (Min 6 chars)" 
                        className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none text-sm"
                        value={password} onChange={e => setPassword(e.target.value)}
                    />

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded shadow-lg uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : (isSignup ? "Create Account" : "Access Dashboard")}
                    </button>
                </form>

                <div className="mt-4 text-center pt-4 border-t border-slate-800">
                    <button 
                        onClick={() => {
                            setIsSignup(!isSignup);
                            setError(null);
                        }} 
                        className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                        {isSignup ? "Already have an account? Login here" : "New User? Create Account"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
