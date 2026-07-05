import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  User,
  Timestamp 
} from '../lib/firebase';
import { 
  Cloud, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  History, 
  Save, 
  Database, 
  Key, 
  Fingerprint, 
  FileCode, 
  Trash2,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { BioreactorInputs, SimulationResult } from '../types';

interface FirebaseCloudSuiteProps {
  currentInputs: BioreactorInputs;
  currentTwinData: SimulationResult;
  onRestoreInputs: (restored: BioreactorInputs) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

interface SavedSimulation {
  id: string;
  name: string;
  volume: number;
  temperature: number;
  stirrerSpeed: number;
  aerationRate: number;
  metabolicLoad: number;
  feedRate: number;
  viability: number;
  timestamp: any;
}

export default function FirebaseCloudSuite({ 
  currentInputs, 
  currentTwinData, 
  onRestoreInputs, 
  showToast 
}: FirebaseCloudSuiteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  
  // Custom passphrase login fallback to bypass iframe popup blockers if needed
  const [useSovereignFallback, setUseSovereignFallback] = useState<boolean>(false);
  const [fallbackEmail, setFallbackEmail] = useState<string>('guest.architect@vundla.io');
  const [fallbackPassword, setFallbackPassword] = useState<string>('SovereignTwin2026!');
  const [isRegisteringFallback, setIsRegisteringFallback] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firestore Saved Configurations states
  const [savedConfigs, setSavedConfigs] = useState<SavedSimulation[]>([]);
  const [configLabel, setConfigLabel] = useState<string>('Sovereign Batch A-1');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetchingConfigs, setIsFetchingConfigs] = useState<boolean>(false);

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        showToast(`Authenticated secure session: ${currentUser.email || 'Sovereign Architect'}`, "success");
        fetchSavedConfigs(currentUser.uid);
      } else {
        setSavedConfigs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sign in using real Google provider
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      showToast("Redirecting to Google secure authentication gate...", "info");
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      // Fallback instructions if blocked by iframe sandbox
      setAuthError(err.message || "Failed Google Auth (popups may be blocked in iframe).");
      showToast("Google Pop-up was restricted. Try utilizing Sovereign Passphrase login.", "warning");
      setUseSovereignFallback(true);
    }
  };

  // Sign in / Sign up with custom email and password fallback
  const handleSovereignAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!fallbackEmail || !fallbackPassword) {
      setAuthError("Email and password fields must be configured.");
      return;
    }
    
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
    try {
      if (isRegisteringFallback) {
        showToast("Registering new secure keys within Firebase Auth...", "info");
        await createUserWithEmailAndPassword(auth, fallbackEmail, fallbackPassword);
        showToast("Sovereign security profile registered successfully.", "success");
      } else {
        showToast("Verifying credentials against Firebase Auth directory...", "info");
        await signInWithEmailAndPassword(auth, fallbackEmail, fallbackPassword);
      }
    } catch (err: any) {
      console.error("Passphrase Auth error:", err);
      setAuthError(err.message || "Authentication verification failed.");
      showToast("Verification failed. Please check credentials or register.", "error");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast("Secure session logged out. Local sandbox activated.", "info");
    } catch (err) {
      showToast("Failed to disconnect cloud session.", "error");
    }
  };

  // Save current parameters to Firestore
  const handleSaveConfig = async () => {
    if (!user) {
      showToast("Authentication required to save parameters to Cloud Firestore.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const docData = {
        userId: user.uid,
        name: configLabel,
        volume: currentInputs.volume,
        temperature: currentInputs.temperature,
        stirrerSpeed: currentInputs.stirrerSpeed,
        aerationRate: currentInputs.aerationRate,
        metabolicLoad: currentInputs.metabolicLoad,
        feedRate: currentInputs.feedRate,
        viability: currentTwinData.viability,
        timestamp: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'simulations'), docData);
      showToast(`Batch configuration "${configLabel}" archived in Cloud Firestore!`, "success");
      
      // Reset input label and reload configs
      setConfigLabel(`Sovereign Batch A-${savedConfigs.length + 2}`);
      fetchSavedConfigs(user.uid);
    } catch (err: any) {
      console.error("Firestore Save Error:", err);
      showToast("Failed to persist simulation state to Firestore.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch configs for authenticated user
  const fetchSavedConfigs = async (userId: string) => {
    setIsFetchingConfigs(true);
    try {
      const q = query(
        collection(db, 'simulations'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(15)
      );
      
      const querySnapshot = await getDocs(q);
      const fetched: SavedSimulation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          name: data.name || 'Unnamed Batch',
          volume: data.volume,
          temperature: data.temperature,
          stirrerSpeed: data.stirrerSpeed,
          aerationRate: data.aerationRate,
          metabolicLoad: data.metabolicLoad,
          feedRate: data.feedRate,
          viability: data.viability || 100,
          timestamp: data.timestamp
        });
      });
      setSavedConfigs(fetched);
    } catch (err) {
      console.error("Firestore Fetch error:", err);
    } finally {
      setIsFetchingConfigs(false);
    }
  };

  const handleRestore = (config: SavedSimulation) => {
    const restoredInputs: BioreactorInputs = {
      volume: config.volume,
      temperature: config.temperature,
      stirrerSpeed: config.stirrerSpeed,
      aerationRate: config.aerationRate,
      metabolicLoad: config.metabolicLoad,
      feedRate: config.feedRate
    };
    onRestoreInputs(restoredInputs);
    showToast(`Restored twin inputs from archive "${config.name}".`, "success");
  };

  return (
    <div className="mt-8 border-t border-slate-800 pt-8" id="firebase_cloud_integration_section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-slate-800 gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-500 font-bold">Cloud Synchronization Gate</span>
          <h2 className="text-2xl font-serif italic text-white mt-1">Firebase Auth & Durable Firestore Persistence</h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {user ? (
            <span className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              SECURE CLOUD ONLINE
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-500 flex items-center gap-1.5 font-bold">
              <Cloud className="w-3.5 h-3.5" />
              LOCAL STATE ONLY
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Auth Gate and Client Sign-In Dashboard */}
        <div className="lg:col-span-5 bg-slate-950/40 p-6 rounded-2xl border border-slate-900 flex flex-col justify-between" id="firebase_auth_gate">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                Sovereign Security Gate
              </h3>
              <span className="text-[9px] text-slate-500 font-mono">FIREBASE CORE</span>
            </div>

            {loadingAuth ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-[10px] font-mono text-slate-500">Decrypting session matrices...</span>
              </div>
            ) : !user ? (
              <div className="space-y-5">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Authenticate your workspace to save scale-up recipes directly inside our secure Firebase Firestore cloud cluster. This permits real-time restoration of experimental bioreactor batches across distributed nodes.
                </p>

                {/* Login tabs or direct options */}
                <div className="flex gap-2 p-1 bg-slate-950 rounded border border-slate-900">
                  <button
                    onClick={() => setUseSovereignFallback(false)}
                    className={`flex-1 py-1.5 text-center font-mono text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer ${!useSovereignFallback ? 'bg-cyan-950/40 border border-cyan-800/40 text-white font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Google Federated
                  </button>
                  <button
                    onClick={() => setUseSovereignFallback(true)}
                    className={`flex-1 py-1.5 text-center font-mono text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer ${useSovereignFallback ? 'bg-cyan-950/40 border border-cyan-800/40 text-white font-bold' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Passphrase Credentials
                  </button>
                </div>

                {!useSovereignFallback ? (
                  <div className="py-4 flex flex-col items-center gap-3">
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-950 hover:shadow-lg transition-all font-mono text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                    >
                      <LogIn className="w-4 h-4 text-slate-950" />
                      Sign In With Google
                    </button>
                    <span className="text-[9px] font-mono text-slate-600 text-center leading-normal">
                      Note: If Google pop-ups are sandboxed by your browser frame constraints, toggle the Passphrase tab.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSovereignAuth} className="space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase tracking-widest block">Architect Signature ID (Email)</label>
                      <input
                        type="email"
                        value={fallbackEmail}
                        onChange={(e) => setFallbackEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        placeholder="guest.architect@vundla.io"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-500 uppercase tracking-widest block">Access Passphrase</label>
                      <input
                        type="password"
                        value={fallbackPassword}
                        onChange={(e) => setFallbackPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-900 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                        placeholder="••••••••••••••"
                      />
                    </div>

                    {authError && (
                      <p className="text-[10px] text-rose-500 font-mono mt-1 leading-relaxed bg-rose-950/20 p-2 rounded border border-rose-900/30">
                        {authError}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        onClick={() => setIsRegisteringFallback(false)}
                        className="flex-1 py-2 px-3 rounded bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer text-center"
                      >
                        Authenticate Keys
                      </button>
                      <button
                        type="submit"
                        onClick={() => setIsRegisteringFallback(true)}
                        className="py-2 px-3 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-mono text-[10px] uppercase tracking-wider cursor-pointer text-center"
                      >
                        Register Profile
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Logged in view */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 space-y-4">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} referrerPolicy="no-referrer" alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-cyan-500/40" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center">
                        <Fingerprint className="w-5 h-5 text-cyan-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-white font-mono leading-tight">{user.displayName || 'Sovereign Clan Architect'}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-900">
                    <div>
                      <span className="text-slate-600 block uppercase text-[8px] tracking-wider">SECURE TOKEN</span>
                      <span className="text-emerald-400 font-bold truncate block">{user.uid.slice(0, 15)}...</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block uppercase text-[8px] tracking-wider">SYNC LEVEL</span>
                      <span className="text-cyan-400 font-bold block">CLUSTERS SYNCED</span>
                    </div>
                  </div>
                </div>

                {/* Save Current Simulation Box */}
                <div className="space-y-3 bg-cyan-950/10 p-4 rounded-xl border border-cyan-950/40">
                  <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                    <Save className="w-3.5 h-3.5" />
                    Archive Twin Parameters
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Persist current physical parameters ({currentTwinData.volume}L, {currentTwinData.stirrerSpeed} RPM) to Firestore.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={configLabel}
                      onChange={(e) => setConfigLabel(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-900 rounded px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="Label this batch config..."
                    />
                    <button
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                      className="py-1.5 px-3 rounded bg-cyan-500 hover:bg-cyan-600 text-slate-950 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {isSaving ? <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span> : <Database className="w-3.5 h-3.5" />}
                      Push State
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="pt-6 border-t border-slate-900 flex justify-between items-center mt-6">
              <span className="text-[9px] font-mono text-slate-500">SESSION LIFETIME: 24H KEY</span>
              <button
                onClick={handleSignOut}
                className="py-1 px-2.5 rounded border border-rose-950/40 text-rose-400/80 hover:text-white hover:bg-rose-950/20 font-mono text-[9px] uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Firestore Saved Configurations Registry */}
        <div className="lg:col-span-7 bg-slate-950/40 p-6 rounded-2xl border border-slate-900 flex flex-col justify-between" id="firestore_registry_box">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-500" />
                Cloud Batch Archive ({savedConfigs.length})
              </h3>
              <button
                onClick={() => user && fetchSavedConfigs(user.uid)}
                disabled={!user || isFetchingConfigs}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                title="Refresh Cloud Lists"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingConfigs ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {!user ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-900 rounded-xl bg-slate-950/10">
                <FolderSync className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Archive Vault Encrypted</h4>
                <p className="text-[10px] text-slate-600 font-mono max-w-xs mt-1.5 leading-relaxed">
                  Authenticate your identity to synchronized batch archives with real-time replication clusters.
                </p>
              </div>
            ) : isFetchingConfigs ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-[10px] font-mono text-slate-500">Synchronizing database indices...</span>
              </div>
            ) : savedConfigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-900 rounded-xl bg-slate-950/10">
                <Database className="w-8 h-8 text-slate-700 mb-3" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">No Archived Batches</h4>
                <p className="text-[10px] text-slate-600 font-mono max-w-xs mt-1.5 leading-relaxed">
                  Current bioreactor layouts will display here once you push your first batch configuration.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {savedConfigs.map((config) => (
                  <div 
                    key={config.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-900/80 hover:border-cyan-500/40 transition-all flex justify-between items-center group"
                  >
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white leading-none">{config.name}</span>
                        <span className="text-[8px] bg-slate-900 text-slate-500 border border-slate-800 px-1 py-0.2 rounded">
                          {config.volume}L
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-500">
                        <span>Temp: {config.temperature}°C</span>
                        <span>Speed: {config.stirrerSpeed} RPM</span>
                        <span>Metabolism: {config.metabolicLoad}%</span>
                        <span>Viability: <strong className={config.viability >= 90 ? 'text-emerald-400' : 'text-amber-500'}>{config.viability}%</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestore(config)}
                      className="py-1 px-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 group-hover:bg-cyan-500 group-hover:text-slate-950 group-hover:border-transparent transition-all font-mono text-[9px] uppercase font-bold tracking-wider cursor-pointer"
                    >
                      Restore Parameters
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-slate-900/10 rounded-xl border border-slate-900/40 font-mono text-[10px] leading-relaxed text-slate-500 flex items-start gap-2.5">
            <Key className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>Multi-Replication Sync State:</strong> Transactions processed via Firestore instantly stream triggers to simulated master Mnesia and Erlang nodes, maintaining persistent consistency matrices.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
