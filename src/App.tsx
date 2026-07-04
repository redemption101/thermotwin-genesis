import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Thermometer,
  Cpu,
  Shield,
  Activity,
  Award,
  Zap,
  RotateCcw,
  AlertTriangle,
  Play,
  FileSpreadsheet,
  AlertOctagon,
  Settings,
  Flame,
  Binary,
  Compass,
  ArrowRight,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Skull
} from 'lucide-react';
import { BioreactorInputs, SimulationResult, AIGuardReport, HoneyPotStatus } from './types';
import MediaStudio from './components/MediaStudio';

export default function App() {
  // Bioreactor Inputs
  const [inputs, setInputs] = useState<BioreactorInputs>({
    volume: 10000,
    temperature: 37.0,
    stirrerSpeed: 150,
    aerationRate: 1.5,
    metabolicLoad: 45,
    feedRate: 0.5
  });

  // Simulation Outputs
  const [simulation, setSimulation] = useState<SimulationResult>({
    volume: 10000,
    temperature: 37.0,
    stirrerSpeed: 150,
    aerationRate: 1.5,
    metabolicLoad: 45,
    feedRate: 0.5,
    fluidVelocity: 1.42,
    reynoldsNumber: 12000,
    thermalDiff: 0.04,
    sheerStress: 0.88,
    kLa: 34.2,
    viability: 98
  });

  // AI Guard Report State
  const [aiReport, setAiReport] = useState<AIGuardReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Honey pot hack simulation state
  const [honeyPot, setHoneyPot] = useState<HoneyPotStatus>({
    breachDetected: false,
    attackerIP: '',
    attackerLocation: '',
    honeyPotStatus: 'INACTIVE',
    voidTrapState: '',
    quantumCoordinate: '',
    actionTaken: '',
    dispatchTimestamp: ''
  });

  const [activeTab, setActiveTab] = useState<'simulation' | 'equations' | 'credentials'>('simulation');
  const [customNotification, setCustomNotification] = useState<{message: string; type: 'success' | 'warning' | 'info' | 'error'} | null>(null);

  // Helper to show a premium custom notification toast
  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    setCustomNotification({ message, type });
    setTimeout(() => {
      setCustomNotification(null);
    }, 5000);
  };

  // Run initial simulation
  useEffect(() => {
    runSimulation(inputs);
  }, []);

  // Call Express simulation endpoint
  const runSimulation = async (currentInputs: BioreactorInputs) => {
    setSimulating(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInputs)
      });
      if (response.ok) {
        const data = await response.json();
        setSimulation(data);
      } else {
        // Local Fallback if server hasn't built or finished restarting yet
        calculateLocalSimulation(currentInputs);
      }
    } catch (e) {
      calculateLocalSimulation(currentInputs);
    } finally {
      setTimeout(() => setSimulating(false), 300);
    }
  };

  // Client-side math model fallback to ensure immediate responsiveness
  const calculateLocalSimulation = (currentInputs: BioreactorInputs) => {
    const { volume, temperature, stirrerSpeed, aerationRate, metabolicLoad } = currentInputs;
    const D = 0.3 * Math.pow(volume / 1000, 1 / 3);
    const fluidVelocity = (Math.PI * D * stirrerSpeed) / 60;
    const reynoldsNumber = Math.round((stirrerSpeed / 60) * Math.pow(D, 2) * 1000 / 0.001);
    const volumeFactor = volume / 10000;
    const metabolicHeat = metabolicLoad * 0.15;
    const coolingInefficiency = volumeFactor * 0.8;
    const thermalDiff = Math.max(0.01, 0.02 + (metabolicHeat * coolingInefficiency) - (stirrerSpeed * 0.0001));
    const sheerStress = fluidVelocity * 1.8;
    const kLa = Math.max(1.0, (Math.pow(stirrerSpeed, 1.2) * Math.sqrt(aerationRate)) / (150 * volumeFactor));

    const tempDeviation = Math.abs(temperature - 37.0);
    let cellStress = 0;
    if (tempDeviation > 0.5) cellStress += tempDeviation * 15;
    if (sheerStress > 3.0) cellStress += (sheerStress - 3.0) * 20;
    if (thermalDiff > 0.15) cellStress += (thermalDiff - 0.15) * 80;
    if (metabolicLoad > 85) cellStress += (metabolicLoad - 85) * 0.8;

    const viability = Math.max(0, Math.min(100, Math.round(100 - cellStress)));

    setSimulation({
      ...currentInputs,
      fluidVelocity: parseFloat(fluidVelocity.toFixed(2)),
      reynoldsNumber,
      thermalDiff: parseFloat(thermalDiff.toFixed(2)),
      sheerStress: parseFloat(sheerStress.toFixed(2)),
      kLa: parseFloat(kLa.toFixed(1)),
      viability
    });
  };

  // Run AI Guard validation
  const requestAIGuardReport = async () => {
    setGeneratingReport(true);
    setAiReport(null);
    showToast("Newtonian AI Guard is parsing fluid-dynamics & thermodynamic boundaries...", "info");

    try {
      const response = await fetch('/api/gemini/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulation)
      });
      if (response.ok) {
        const data = await response.json();
        setAiReport(data);
        if (data.complianceStatus === 'APPROVED') {
          showToast("AI Guard: Validation Successful. Scale-up design certified APPROVED.", "success");
        } else if (data.complianceStatus === 'WARNING') {
          showToast("AI Guard: Validation warning. Cell viability stress detected.", "warning");
        } else {
          showToast("AI Guard: Scale-up design REJECTED due to cellular stress violations.", "error");
        }
      } else {
        generateLocalReportFallback();
      }
    } catch (e) {
      generateLocalReportFallback();
    } finally {
      setGeneratingReport(false);
    }
  };

  // Local rule-based report fallback
  const generateLocalReportFallback = () => {
    const { viability, thermalDiff, sheerStress, volume, temperature } = simulation;
    let status: 'APPROVED' | 'WARNING' | 'REJECTED' = 'APPROVED';
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (viability < 70) {
      status = 'REJECTED';
      warnings.push(`Extreme cellular wall shear stress and thermal difference (±${thermalDiff}°C) detected.`);
      recommendations.push("Reduce Stirrer RPM to preserve shear-sensitive animal cell membranes.");
      recommendations.push("Increase jacket heat-exchange coolant flux to balance metabolic heat distribution.");
    } else if (viability < 90) {
      status = 'WARNING';
      warnings.push("Uneven mass transfer rates and minor heat pockets developing in deep bioreactor zones.");
      recommendations.push("Optimize feed rate to distribute glucose additions more uniformly.");
      recommendations.push("Increase aeration rate slightly to prevent localized dissolved oxygen depletion.");
    } else {
      recommendations.push("All physical laws are strictly conserved. Cells are behaving near optimal physiological parameters.");
      recommendations.push("System is structurally certified for 10,000L scaling operations.");
    }

    setAiReport({
      complianceStatus: status,
      thermodynamicAudit: `Thermodynamic audit completed. Volume: ${volume} L, Metabolic Load: ${simulation.metabolicLoad}%. Heat transfer constraints evaluated. Thermal Gradient is stable at ±${thermalDiff}°C.`,
      fluidDynamicsAudit: `Aerodynamics & Fluid analysis validated. Tip speed is ${simulation.fluidVelocity} m/s, yielding Reynolds Number of ${simulation.reynoldsNumber} (${simulation.reynoldsNumber > 10000 ? 'turbulent' : 'transitional'}). Sheer stress is ${sheerStress} Pa.`,
      quantumSyncAudit: "Mnesia database state successfully synchronized. Quantum coordinate matrices are fully stabilized within the thermal twin space.",
      riskLevel: viability > 90 ? 'LOW' : viability > 70 ? 'MEDIUM' : 'HIGH',
      warnings,
      recommendations,
      certifiedBy: "Newtonian AI Guard v1.0.4 - Local Rule Engine (Offline)"
    });
  };

  // Trigger Honey-Pot Hack sequence
  const triggerHoneyPotSequence = async () => {
    setHoneyPot(prev => ({
      ...prev,
      honeyPotStatus: 'ENGAGED',
      breachDetected: true,
      actionTaken: 'Initializing astrophysical event-horizon defense...'
    }));

    showToast("CYBER DEFENSE ALERT: Intrusion attempt detected on port 21/8080!", "error");

    try {
      const response = await fetch('/api/honey-pot/trigger', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        // Stagger states for visual drama
        setTimeout(() => {
          setHoneyPot({
            breachDetected: true,
            attackerIP: data.attackerIP,
            attackerLocation: data.attackerLocation,
            honeyPotStatus: 'TRAPPED',
            voidTrapState: data.voidTrapState,
            quantumCoordinate: data.quantumCoordinate,
            actionTaken: data.actionTaken,
            dispatchTimestamp: data.dispatchTimestamp
          });
          showToast("Astrophysics Void Honey-pot Trapped Hackers! Coordinates established.", "success");
        }, 1500);
      } else {
        triggerHoneyPotLocal();
      }
    } catch (e) {
      triggerHoneyPotLocal();
    }
  };

  const triggerHoneyPotLocal = () => {
    setTimeout(() => {
      setHoneyPot({
        breachDetected: true,
        attackerIP: '198.51.100.204',
        attackerLocation: 'Zurich, Switzerland (TOR Proxy Node)',
        honeyPotStatus: 'TRAPPED',
        voidTrapState: 'GRAVITATIONAL_SINGULARITY_LOCK',
        quantumCoordinate: 'Q-SYS-7429-X',
        actionTaken: 'Intruder routed directly into empty astrophysics void simulation. Connection locked into Schwarzschild singularity loop. Tracing sequence verified. Reporting payload sent to local law enforcement.',
        dispatchTimestamp: new Date().toISOString()
      });
      showToast("Astrophysics Void Trap Engaged. Hackers contained.", "success");
    }, 1500);
  };

  const resetHoneyPot = () => {
    setHoneyPot({
      breachDetected: false,
      attackerIP: '',
      attackerLocation: '',
      honeyPotStatus: 'INACTIVE',
      voidTrapState: '',
      quantumCoordinate: '',
      actionTaken: '',
      dispatchTimestamp: ''
    });
    showToast("Honey-pot system reset. Monitoring port status.", "info");
  };

  const handleInputChange = (key: keyof BioreactorInputs, val: number) => {
    const updatedInputs = { ...inputs, [key]: val };
    setInputs(updatedInputs);
    runSimulation(updatedInputs);
  };

  // Scale pre-sets
  const applyPreset = (preset: 'pilot' | 'standard' | 'heavy') => {
    let newInputs: BioreactorInputs;
    if (preset === 'pilot') {
      newInputs = { volume: 1000, temperature: 37.0, stirrerSpeed: 220, aerationRate: 2.0, metabolicLoad: 35, feedRate: 0.2 };
      showToast("Loaded 1,000L Pilot Scale Configuration", "info");
    } else if (preset === 'standard') {
      newInputs = { volume: 10000, temperature: 37.0, stirrerSpeed: 150, aerationRate: 1.5, metabolicLoad: 50, feedRate: 0.6 };
      showToast("Loaded 10,000L Commercial Scale Configuration", "info");
    } else {
      newInputs = { volume: 20000, temperature: 36.8, stirrerSpeed: 110, aerationRate: 1.0, metabolicLoad: 80, feedRate: 1.2 };
      showToast("Loaded 20,000L Heavy Industrial Scale Configuration", "info");
    }
    setInputs(newInputs);
    runSimulation(newInputs);
  };

  // Color mapping based on viability
  const getViabilityColor = (val: number) => {
    if (val >= 90) return 'text-emerald-400 border-emerald-500/20 bg-emerald-950/10';
    if (val >= 70) return 'text-amber-500 border-amber-500/20 bg-amber-950/10';
    return 'text-rose-500 border-rose-500/20 bg-rose-950/10';
  };

  const getViabilityProgressColor = (val: number) => {
    if (val >= 90) return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]';
    if (val >= 70) return 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
    return 'bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]';
  };

  return (
    <div id="app_root" className="min-h-screen bg-[#05070a] text-slate-300 font-sans flex flex-col p-4 md:p-8 selection:bg-cyan-500/30 selection:text-white">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {customNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-lg border max-w-md shadow-2xl flex items-start gap-3 backdrop-blur-md ${
              customNotification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' :
              customNotification.type === 'warning' ? 'bg-amber-950/80 border-amber-500/40 text-amber-200' :
              customNotification.type === 'error' ? 'bg-rose-950/80 border-rose-500/40 text-rose-200' :
              'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {customNotification.type === 'error' || customNotification.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
            ) : (
              <Activity className="w-5 h-5 mt-0.5 shrink-0 text-cyan-400" />
            )}
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-wider">System Communication</p>
              <p className="text-xs leading-relaxed mt-1">{customNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation / Brand Bar */}
      <header id="header_section" className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <h1 id="brand_title" className="text-4xl md:text-5xl font-serif italic text-white tracking-tighter">ThermoTwin Genesis</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-500 font-bold mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Sovereign Biomanufacturing OS // v1.0.4
          </p>
        </div>

        <div className="flex flex-wrap gap-6 md:gap-12 font-mono text-[11px] w-full md:w-auto justify-between md:justify-end border-t border-slate-800/50 pt-4 md:pt-0 md:border-0">
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase text-[9px] mb-1 tracking-wider">Sovereign Architect</span>
            <span className="text-white font-medium">Mandlenkosi Vundla</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase text-[9px] mb-1 tracking-wider">Security Protection</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Astrophysics Void Active
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 uppercase text-[9px] mb-1 tracking-wider">Erlang Runtime</span>
            <span className="text-cyan-400 font-medium">OTP 26.0 (Linked)</span>
          </div>
        </div>
      </header>

      {/* Grid Architecture */}
      <div id="main_layout_grid" className="flex-1 grid grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Physics Engine Controls */}
        <aside id="controls_panel" className="col-span-12 lg:col-span-3 lg:border-r lg:border-slate-800 lg:pr-6 flex flex-col gap-6">
          
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
              <h2 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                Physical Controls
              </h2>
              <span className="text-[9px] font-mono text-cyan-500 uppercase bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-800/30">
                10kL Spec
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                id="preset_pilot_btn"
                onClick={() => applyPreset('pilot')}
                className={`py-1.5 px-2 rounded font-mono text-[9px] border transition-all text-center uppercase tracking-wider ${
                  inputs.volume === 1000 
                    ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold' 
                    : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                1kL Pilot
              </button>
              <button
                id="preset_standard_btn"
                onClick={() => applyPreset('standard')}
                className={`py-1.5 px-2 rounded font-mono text-[9px] border transition-all text-center uppercase tracking-wider ${
                  inputs.volume === 10000 
                    ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold' 
                    : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                10kL Comm
              </button>
              <button
                id="preset_heavy_btn"
                onClick={() => applyPreset('heavy')}
                className={`py-1.5 px-2 rounded font-mono text-[9px] border transition-all text-center uppercase tracking-wider ${
                  inputs.volume === 20000 
                    ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold' 
                    : 'bg-slate-900/20 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                20kL Heavy
              </button>
            </div>

            {/* Sliders */}
            <div className="space-y-4 font-mono text-xs">
              
              {/* Bioreactor Volume Slider */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Reactor Volume</span>
                  <span className="text-white font-medium">{inputs.volume.toLocaleString()} Liters</span>
                </div>
                <input
                  id="volume_slider"
                  type="range"
                  min="500"
                  max="25000"
                  step="500"
                  value={inputs.volume}
                  onChange={(e) => handleInputChange('volume', parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">Vessel geometry alters mass transfer rate</span>
              </div>

              {/* Temperature Slider */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Temperature</span>
                  <span className="text-white font-medium">{inputs.temperature.toFixed(1)} °C</span>
                </div>
                <input
                  id="temperature_slider"
                  type="range"
                  min="30"
                  max="45"
                  step="0.1"
                  value={inputs.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>37.0°C Optimal</span>
                  <span className={Math.abs(inputs.temperature - 37.0) > 1 ? 'text-amber-500' : ''}>
                    {Math.abs(inputs.temperature - 37.0) > 1 ? 'Thermal Deviation' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* Stirrer Speed Slider */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Agitation Speed</span>
                  <span className="text-white font-medium">{inputs.stirrerSpeed} RPM</span>
                </div>
                <input
                  id="stirrer_slider"
                  type="range"
                  min="50"
                  max="350"
                  step="5"
                  value={inputs.stirrerSpeed}
                  onChange={(e) => handleInputChange('stirrerSpeed', parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">Speeds &gt; 250 RPM raise fluid sheer stress</span>
              </div>

              {/* Aeration Rate Slider */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Gas Sparging</span>
                  <span className="text-white font-medium">{inputs.aerationRate.toFixed(1)} vvm</span>
                </div>
                <input
                  id="aeration_slider"
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={inputs.aerationRate}
                  onChange={(e) => handleInputChange('aerationRate', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">Controls oxygen dissolution rate (kLa)</span>
              </div>

              {/* Metabolic Load Slider */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Cellular Metabolism</span>
                  <span className="text-white font-medium">{inputs.metabolicLoad} %</span>
                </div>
                <input
                  id="metabolic_slider"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={inputs.metabolicLoad}
                  onChange={(e) => handleInputChange('metabolicLoad', parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[9px] text-slate-500 mt-1 block">Generates continuous exothermic reaction heat</span>
              </div>

              {/* Feed Rate Slider */}
              <div className="bg-slate-950/40 p-3 rounded border border-slate-900">
                <div className="flex justify-between mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">Nutrient Feed Rate</span>
                  <span className="text-white font-medium">{inputs.feedRate.toFixed(1)} kg/h</span>
                </div>
                <input
                  id="feed_slider"
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.1"
                  value={inputs.feedRate}
                  onChange={(e) => handleInputChange('feedRate', parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* Newtonian AI Guard Launcher */}
          <div className="mt-auto bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-amber-500" />
                Newtonian AI Guard
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                Certifies the scale-up model against Laws of Thermodynamics and Fluid Dynamics using Gemini.
              </p>
            </div>

            <button
              id="ai_guard_cert_btn"
              disabled={generatingReport || simulating}
              onClick={requestAIGuardReport}
              className={`w-full py-2.5 px-4 rounded-lg font-mono text-[10px] tracking-wider uppercase border text-center transition-all flex items-center justify-center gap-2 font-bold ${
                generatingReport 
                  ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]'
              }`}
            >
              {generatingReport ? (
                <>
                  <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                  Validating Realities...
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5 animate-pulse" />
                  Request AI Verification
                </>
              )}
            </button>
          </div>

          <div id="infrastructure_box">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2 font-bold">Vundla Grid Node</h3>
            <ul className="text-[10px] font-mono space-y-1.5 opacity-80">
              <li className="flex justify-between border-b border-slate-900 pb-1"><span>Erlang OTP OTP_RELEASE</span> <span className="text-emerald-400">ONLINE</span></li>
              <li className="flex justify-between border-b border-slate-900 pb-1"><span>Rust FFI Safe Bridge</span> <span className="text-emerald-400">STABLE</span></li>
              <li className="flex justify-between border-b border-slate-900 pb-1"><span>Apache Kafka Bus</span> <span className="text-emerald-400">SYNCED</span></li>
              <li className="flex justify-between border-b border-slate-900 pb-1"><span>HashiCorp Vault</span> <span className="text-emerald-400">SSL_ACTIVE</span></li>
              <li className="flex justify-between pb-1"><span>Mnesia Distributed DB</span> <span className="text-emerald-400">REPLICATED</span></li>
            </ul>
          </div>

        </aside>

        {/* Middle: Digital Twin Visualization & Metrics */}
        <main id="twin_visualization" className="col-span-12 lg:col-span-6 flex flex-col gap-6">
          
          {/* Main Visual Vessel Container */}
          <div className="relative flex-1 min-h-[380px] bg-slate-950/50 rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between overflow-hidden">
            
            {/* Visual background atmospheric touch */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.04),transparent_60%)] pointer-events-none"></div>

            {/* Top status line */}
            <div className="flex justify-between items-start z-10 font-mono">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Live Simulation Run</span>
                <span className="text-xs text-white font-medium flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                  {inputs.volume.toLocaleString()}L Scale Model Vessel
                </span>
              </div>
              <div className={`p-2 rounded border font-mono text-[11px] text-right ${getViabilityColor(simulation.viability)}`}>
                <span className="text-[8px] block uppercase text-slate-500 tracking-wider">Cell Viability</span>
                <span className="text-base font-bold">{simulation.viability}%</span>
              </div>
            </div>

            {/* Center Bioreactor Graphics */}
            <div className="relative flex-1 flex items-center justify-center py-6">
              
              {/* Dynamic physical thermodiff fluid color backdrops */}
              <div 
                className="absolute w-52 h-[260px] rounded-3xl transition-all duration-700"
                style={{
                  background: `linear-gradient(to bottom, 
                    ${simulation.thermalDiff > 0.15 ? 'rgba(239,68,68,0.08)' : 'rgba(6,182,212,0.04)'}, 
                    rgba(6,182,212,0.01), 
                    rgba(6,182,212,0.04)
                  )`
                }}
              ></div>

              {/* Reactor Outer Hull */}
              <div className="relative w-52 h-[260px] border border-slate-700/40 rounded-[3rem] flex flex-col justify-between p-6 overflow-hidden backdrop-blur-[2px] shadow-[inset_0_0_24px_rgba(6,182,212,0.05)]">
                
                {/* Simulated Fluid Content */}
                <div 
                  className="absolute bottom-0 left-0 right-0 rounded-b-[2.8rem] border-t border-cyan-500/30 transition-all duration-700"
                  style={{
                    height: '82%',
                    background: `linear-gradient(to top, 
                      rgba(6,182,212,0.05), 
                      ${simulation.thermalDiff > 0.12 ? 'rgba(245,158,11,0.04)' : 'rgba(6,182,212,0.01)'}
                    )`
                  }}
                ></div>

                {/* Flow particles (representing sparged air bubble vectors) */}
                <div className="absolute inset-x-8 top-16 bottom-4 pointer-events-none overflow-hidden">
                  <div 
                    className="absolute left-1/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full particle-flow-1"
                    style={{ animationDuration: `${6 / (inputs.aerationRate || 1)}s` }}
                  ></div>
                  <div 
                    className="absolute left-1/2 w-1 h-1 bg-cyan-400/40 rounded-full particle-flow-2"
                    style={{ animationDuration: `${4 / (inputs.aerationRate || 1)}s` }}
                  ></div>
                  <div 
                    className="absolute right-1/4 w-2 h-2 bg-amber-400/25 rounded-full particle-flow-3"
                    style={{ animationDuration: `${8 / (inputs.aerationRate || 1)}s` }}
                  ></div>
                </div>

                {/* Internal Heat Accumulation warning zone */}
                {simulation.thermalDiff > 0.1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-10 bg-rose-500/10 rounded-full blur-md"
                  ></motion.div>
                )}

                {/* Stirrer Shaft / Impeller Mechanism */}
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1.5 bg-slate-800"></div>

                {/* Impeller Blades */}
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-36 h-4 flex items-center justify-center">
                  <div 
                    className="w-full h-1 bg-slate-500 flex justify-between px-2 impeller-spin"
                    style={{ animationDuration: `${60 / (inputs.stirrerSpeed || 150)}s` }}
                  >
                    <div className="w-3 h-3 bg-slate-400 rounded-sm -mt-1 shadow-sm"></div>
                    <div className="w-3 h-3 bg-slate-400 rounded-sm -mt-1 shadow-sm"></div>
                  </div>
                </div>

                {/* Bottom Impeller */}
                <div className="absolute top-[82%] left-1/2 -translate-x-1/2 w-32 h-4 flex items-center justify-center">
                  <div 
                    className="w-full h-1 bg-slate-600 flex justify-between px-2 impeller-spin"
                    style={{ animationDuration: `${60 / (inputs.stirrerSpeed || 150)}s` }}
                  >
                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-sm -mt-0.5"></div>
                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-sm -mt-0.5"></div>
                  </div>
                </div>

                {/* Interactive fluid ripple layer */}
                <div className="absolute top-[18%] left-0 right-0 h-1 bg-cyan-400/30 blur-[1px] bioreactor-pulse"></div>

                {/* Sparger Base Node */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-slate-700 rounded-sm border border-slate-600"></div>

              </div>

              {/* Absolute Overlay when simulating */}
              {simulating && (
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-mono text-cyan-400 bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-800/50 animate-pulse tracking-widest uppercase">
                    Recalculating Fluid Vector Fields...
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Live Data indicators */}
            <div className="flex justify-between items-end border-t border-slate-900 pt-4 z-10 font-mono text-xs">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Metabolic load status</span>
                <span className="text-white font-medium flex items-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  {inputs.metabolicLoad}% Exothermic Release
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase block">Scale status</span>
                <span className="text-cyan-400 font-bold uppercase tracking-wider">
                  {inputs.volume >= 15000 ? 'HEAVY INDUSTRIAL' : inputs.volume >= 5000 ? 'COMMERCIAL' : 'PILOT'}
                </span>
              </div>
            </div>

          </div>

          {/* Physical Metrics Grid */}
          <div id="metrics_bento_grid" className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Metric 1 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center flex flex-col justify-between">
              <span className="text-[9px] block text-slate-500 uppercase font-mono tracking-wider">Fluid Velocity</span>
              <span className="text-lg md:text-xl font-serif text-white mt-1.5 font-bold">{simulation.fluidVelocity} m/s</span>
              <span className="text-[9px] text-cyan-500 font-mono mt-1 opacity-70">Impeller Tip</span>
            </div>

            {/* Metric 2 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center flex flex-col justify-between">
              <span className="text-[9px] block text-slate-500 uppercase font-mono tracking-wider">Thermal Diff</span>
              <span className="text-lg md:text-xl font-serif text-white mt-1.5 font-bold">±{simulation.thermalDiff}°C</span>
              <span className={`text-[9px] font-mono mt-1 ${simulation.thermalDiff > 0.12 ? 'text-amber-500' : 'text-slate-500'}`}>
                {simulation.thermalDiff > 0.12 ? 'High Gradient' : 'Stable'}
              </span>
            </div>

            {/* Metric 3 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center flex flex-col justify-between">
              <span className="text-[9px] block text-slate-500 uppercase font-mono tracking-wider">Reynolds No.</span>
              <span className="text-lg md:text-xl font-serif text-white mt-1.5 font-bold">{simulation.reynoldsNumber.toLocaleString()}</span>
              <span className="text-[9px] text-cyan-500 font-mono mt-1 opacity-70">Turbulent Regime</span>
            </div>

            {/* Metric 4 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center flex flex-col justify-between">
              <span className="text-[9px] block text-slate-500 uppercase font-mono tracking-wider">Mass Flux (kLa)</span>
              <span className="text-lg md:text-xl font-serif text-white mt-1.5 font-bold">{simulation.kLa} h⁻¹</span>
              <span className="text-[9px] text-slate-500 font-mono mt-1">Oxygen Transfer</span>
            </div>

            {/* Metric 5 */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-center flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-[9px] block text-slate-500 uppercase font-mono tracking-wider">Shear Stress</span>
              <span className="text-lg md:text-xl font-serif text-white mt-1.5 font-bold">{simulation.sheerStress} Pa</span>
              <span className={`text-[9px] font-mono mt-1 ${simulation.sheerStress > 3.0 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                {simulation.sheerStress > 3.0 ? 'Lysis Risk!' : 'Safe Limit'}
              </span>
            </div>

          </div>

          {/* Details & Equations Section / AI Report presentation */}
          <div className="bg-slate-950/20 rounded-2xl border border-slate-900 p-5">
            <div className="flex border-b border-slate-900 pb-3 mb-4 gap-4 text-xs font-mono uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('simulation')}
                className={`pb-1 transition-all ${activeTab === 'simulation' ? 'text-white border-b border-cyan-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Physical Twin Specs
              </button>
              <button
                onClick={() => setActiveTab('equations')}
                className={`pb-1 transition-all ${activeTab === 'equations' ? 'text-white border-b border-cyan-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Thermodynamic Equations
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`pb-1 transition-all ${activeTab === 'credentials' ? 'text-white border-b border-cyan-500 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                System Integrity
              </button>
            </div>

            {activeTab === 'simulation' && (
              <div className="text-xs leading-relaxed space-y-2 text-slate-400">
                <p>
                  At scaling thresholds like <span className="text-white font-medium">10,000 to 20,000 Liters</span>, standard bioprocess setups undergo mass-energy distribution breakdowns. Shear-sensitive cellular arrays collapse under hydrodynamic stresses caused by rapid tip velocity.
                </p>
                <p>
                  This digital twin uses numerical models matching <span className="text-white">Navier-Stokes equations</span> for micro-velocity fields and <span className="text-white">energy conservation models</span> to predict hotspots. Move the left-side sliders to explore the exact boundary ranges where viability remains high.
                </p>
              </div>
            )}

            {activeTab === 'equations' && (
              <div className="font-mono text-[11px] leading-relaxed text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-900">
                  <span className="text-[9px] text-cyan-400 uppercase tracking-widest block mb-1">Impeller Tip Velocity (Fluid Dynamics)</span>
                  <code className="text-white text-xs block py-1 font-bold">v = (π * D * N) / 60</code>
                  <p className="text-[10px] mt-1 text-slate-500">Calculates shear risk parameters based on diameter scaling matrices.</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-900">
                  <span className="text-[9px] text-cyan-400 uppercase tracking-widest block mb-1">Reynolds Boundary (Aerodynamics)</span>
                  <code className="text-white text-xs block py-1 font-bold">Re = (ρ * N * D²) / μ</code>
                  <p className="text-[10px] mt-1 text-slate-500">Establishes the macro-mixing boundary conditions for nutrients.</p>
                </div>
              </div>
            )}

            {activeTab === 'credentials' && (
              <div className="text-xs leading-relaxed text-slate-400 space-y-3 font-mono">
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span>Author & sovereign architect:</span>
                  <span className="text-white">Mandlenkosi Vundla</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/50 pb-1">
                  <span>SSL & Cryptography Standard:</span>
                  <span className="text-emerald-400">AES-GCM-256 (Vault-Backed)</span>
                </div>
                <div className="flex justify-between">
                  <span>Orchestration:</span>
                  <span className="text-cyan-500">Kubernetes Cluster (Omega-Point Ready)</span>
                </div>
              </div>
            )}
          </div>

        </main>

        {/* Right Column: Advisory Council & Cyber Defense Honey-Pot */}
        <aside id="security_panel" className="col-span-12 lg:col-span-3 lg:border-l lg:border-slate-800 lg:pl-6 flex flex-col gap-6">
          
          {/* Advisory Panel */}
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-cyan-500" />
              Advisory Council
            </h2>
            <div className="space-y-4">
              <div className="border-l-2 border-slate-700 pl-3">
                <p className="text-xs text-white font-medium">Mrs. Codex</p>
                <p className="text-[10px] text-slate-500 italic">Co-Founder / Genetics Protocol</p>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <p className="text-xs text-white font-medium">Sempi Mvala</p>
                <p className="text-[10px] text-slate-500 italic">Advisor / Bioreactor Logistics</p>
              </div>
              <div className="border-l-2 border-slate-700 pl-3">
                <p className="text-xs text-white font-medium">Theodore Swarts</p>
                <p className="text-[10px] text-slate-500 italic">Co-Founder / Structural Arch</p>
              </div>
            </div>
          </div>

          {/* Cyber Defense Panel & Event-Horizon Void Honey-Pot */}
          <div className="p-4 bg-rose-950/10 border border-rose-900/30 rounded-xl flex flex-col gap-4">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${honeyPot.breachDetected ? 'bg-red-500 animate-ping' : 'bg-rose-500'}`}></span>
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">
                  {honeyPot.breachDetected ? 'Void Trap Engaged' : 'Void Honey-Pot Active'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-rose-500/70">Astrophysics Protocol</span>
            </div>

            <p className="text-[10px] leading-relaxed text-rose-200/60 font-mono">
              Enforces gravitational void trap boundaries. Intruder packets are redirected into an endless loop inside a simulated event horizon space-time singularity.
            </p>

            {honeyPot.breachDetected ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-950/30 border border-red-500/30 rounded font-mono text-[10px] space-y-2 text-rose-200"
              >
                <div className="flex justify-between items-center text-red-400 font-bold border-b border-red-900/50 pb-1">
                  <span className="flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    INTRUDER CAPTURED
                  </span>
                  <span className="animate-pulse">SINGULARITY LOCK</span>
                </div>
                <div className="space-y-1">
                  <p><strong>Attacker IP:</strong> <span className="text-white">{honeyPot.attackerIP}</span></p>
                  <p><strong>Location:</strong> <span className="text-white">{honeyPot.attackerLocation}</span></p>
                  <p><strong>Gravitational Radius:</strong> <span className="text-yellow-400">Schwarzschild Bounds</span></p>
                  <p><strong>Quantum Coord:</strong> <span className="text-white">{honeyPot.quantumCoordinate}</span></p>
                  <p className="leading-normal text-rose-300/80 text-[9px] bg-red-950/50 p-1.5 rounded mt-1">
                    {honeyPot.actionTaken}
                  </p>
                </div>

                <button
                  id="reset_honeypot_btn"
                  onClick={resetHoneyPot}
                  className="w-full mt-2 py-1 px-2 rounded bg-red-500 text-white font-bold text-[9px] hover:bg-red-400 transition-colors cursor-pointer"
                >
                  Reset Cyber Defense Trap
                </button>
              </motion.div>
            ) : (
              <button
                id="trigger_hack_test_btn"
                onClick={triggerHoneyPotSequence}
                className="w-full py-2 px-3 rounded-lg bg-red-950/40 border border-red-700/40 text-red-400 hover:bg-red-500/20 hover:text-white transition-all font-mono text-[9px] uppercase tracking-wider text-center cursor-pointer"
              >
                Trigger Cyber-Attack Demo
              </button>
            )}

          </div>

          <div className="mt-auto pt-6 text-[9px] text-slate-600 font-mono leading-relaxed uppercase border-t border-slate-900">
            Authored & sealed by Mandlenkosi Vundla.<br/>
            Docker Orchestration: V-Secure<br/>
            K8s Cluster Node: Omega-Point<br/>
            Newtonian AI Guard: Verified
          </div>

        </aside>

      </div>

      {/* Interactive Media Engine Suite */}
      <MediaStudio currentTwinData={simulation} showToast={showToast} />

      {/* AI Guard Certificate Report Overlay Presentation */}
      <AnimatePresence>
        {aiReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#020305]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#05070a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 md:p-8 shadow-[0_0_50px_rgba(245,158,11,0.06)] relative text-slate-300 font-mono"
            >
              
              {/* Certificate Stamp Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-5 mb-6">
                <div>
                  <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">Newtonian AI Guard // Validation Registry</span>
                  <h3 className="text-2xl font-serif italic text-white mt-1">Compliance Certification</h3>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest border ${
                  aiReport.complianceStatus === 'APPROVED' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' :
                  aiReport.complianceStatus === 'WARNING' ? 'text-amber-500 border-amber-500/30 bg-amber-950/20' :
                  'text-rose-500 border-rose-500/30 bg-rose-950/20'
                }`}>
                  Status: {aiReport.complianceStatus}
                </div>
              </div>

              {/* Technical Audits */}
              <div className="space-y-4 text-xs leading-relaxed">
                
                {/* Thermodynamics */}
                <div className="bg-slate-950/40 p-3.5 rounded border border-slate-900">
                  <span className="text-[9px] text-cyan-400 uppercase tracking-wider font-bold block mb-1">Thermodynamic Energy Validation</span>
                  <p className="text-slate-300">{aiReport.thermodynamicAudit}</p>
                </div>

                {/* Fluid Dynamics */}
                <div className="bg-slate-950/40 p-3.5 rounded border border-slate-900">
                  <span className="text-[9px] text-cyan-400 uppercase tracking-wider font-bold block mb-1">Aerodynamics & Fluid Dynamics Audit</span>
                  <p className="text-slate-300">{aiReport.fluidDynamicsAudit}</p>
                </div>

                {/* Quantum Mnesia */}
                <div className="bg-slate-950/40 p-3.5 rounded border border-slate-900">
                  <span className="text-[9px] text-cyan-400 uppercase tracking-wider font-bold block mb-1">Quantum Alignment & Mnesia Check</span>
                  <p className="text-slate-300">{aiReport.quantumSyncAudit}</p>
                </div>

                {/* Warnings & recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Warnings column */}
                  <div className="p-3 bg-rose-950/10 rounded border border-rose-950/20">
                    <span className="text-[9px] text-rose-400 uppercase font-bold tracking-wider block mb-1">Active Stress Alarms</span>
                    {aiReport.warnings.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No cell stress flags triggered.</p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-1 text-rose-300 text-[10px]">
                        {aiReport.warnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Recommendations column */}
                  <div className="p-3 bg-amber-950/10 rounded border border-amber-950/20">
                    <span className="text-[9px] text-amber-400 uppercase font-bold tracking-wider block mb-1">Mitigation Recommendations</span>
                    <ul className="list-disc pl-4 space-y-1 text-amber-300 text-[10px]">
                      {aiReport.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

              {/* Signatures & Seal */}
              <div className="mt-8 pt-5 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] text-slate-500">
                <div>
                  <p>CERTIFICATE AUTHORITY ID: <span className="text-slate-300">Q-CERT-{inputs.volume}-GENESIS</span></p>
                  <p className="mt-1">STAMP: <span className="text-slate-400 font-bold">{aiReport.certifiedBy}</span></p>
                </div>
                <button
                  id="close_report_btn"
                  onClick={() => setAiReport(null)}
                  className="py-1.5 px-4 rounded border border-slate-700 hover:border-white text-slate-300 hover:text-white transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                >
                  Dismiss Certification Log
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Micro-Bar */}
      <footer id="footer_section" className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-800 pt-4 opacity-60 text-[10px] uppercase tracking-widest gap-2 font-mono">
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          <span>Solid.js High-Perf Architecture Simulation</span>
          <span>Mnesia DB Active</span>
          <span>Quantum Sync Engine Enabled</span>
        </div>
        <div className="text-slate-500 text-center md:text-right">© 2026 Vundla Global Life Sciences</div>
      </footer>

    </div>
  );
}
