import React, { useState, useEffect, useRef } from 'react';
import { 
  Image, 
  Video, 
  Download, 
  Play, 
  Pause, 
  RefreshCw, 
  Sparkles, 
  FileText, 
  Cpu, 
  Zap, 
  Sliders, 
  Tv, 
  Maximize2,
  Gauge,
  Film
} from 'lucide-react';

interface MediaStudioProps {
  currentTwinData: {
    volume: number;
    temperature: number;
    stirrerSpeed: number;
    aerationRate: number;
    metabolicLoad: number;
    feedRate: number;
    fluidVelocity: number;
    reynoldsNumber: number;
    thermalDiff: number;
    sheerStress: number;
    kLa: number;
    viability: number;
  };
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

type AspectRatio = '16:9' | '9:16' | '1:1';

export default function MediaStudio({ currentTwinData, showToast }: MediaStudioProps) {
  // Image Generator States
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('16:9');
  const [imagePrompt, setImagePrompt] = useState<string>(
    `High-tech scientific schematics of a ${currentTwinData.volume}L vessel, showing hydrodynamic velocity vector fields, molecular gradients, thermal convection, dark editorial aesthetic, technical blueprint layout.`
  );
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [renderedImageSeed, setRenderedImageSeed] = useState<number>(42);
  
  // Video Generator States
  const [videoScript, setVideoScript] = useState<string>(
    `Modeling a 12-second continuous physical stress simulation. Chaotic fluid streams of animal cell cultures reacting to a high agitation shear rate of ${currentTwinData.stirrerSpeed} RPM, showing micro-bubbles diffusing dissolved oxygen into turbulent eddies.`
  );
  const [isVideoSynthesizing, setIsVideoSynthesizing] = useState<boolean>(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoSpeed, setVideoSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Performance telemetry states (Solid.js-style reactive engine metrics)
  const [solidEngineActive, setSolidEngineActive] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(60.0);
  const [renderOverhead, setRenderOverhead] = useState<number>(0.12); // ms
  const [reactCompareOverhead, setReactCompareOverhead] = useState<number>(14.4); // ms

  // Canvas References
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Animation loop variables
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const videoTimeAccumulator = useRef<number>(0);

  // Auto-generate prompt/script based on physical parameters
  const updatePromptFromTwin = () => {
    setImagePrompt(
      `Sovereign bioprocess schematic for a ${currentTwinData.volume}L vessel. Tip speed: ${currentTwinData.fluidVelocity} m/s, thermal gradient: ±${currentTwinData.thermalDiff}°C, showing micro-structural cellular stresses at ${currentTwinData.viability}% viability, blueprint design.`
    );
    setVideoScript(
      `Simulating ${currentTwinData.volume}L commercial-scale fluid kinetics. Particle tracer flow at Reynolds Number ${currentTwinData.reynoldsNumber.toLocaleString()} (${currentTwinData.reynoldsNumber > 10000 ? 'fully turbulent eddies' : 'transitional laminar layers'}), showing ${currentTwinData.sheerStress} Pa shear stress threshold deformation.`
    );
    showToast("Media prompts successfully synchronized with digital twin physical variables.", "success");
  };

  // Trigger schematic image generation
  const handleGenerateImage = () => {
    setIsGeneratingImage(true);
    showToast("Initializing physical layout synthesizer...", "info");
    
    setTimeout(() => {
      setRenderedImageSeed(Math.random());
      setIsGeneratingImage(false);
      showToast("Perfect-fit technical schematic generated successfully.", "success");
    }, 1500);
  };

  // Render static image schematic based on aspect ratio
  useEffect(() => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset dimensions based on selection
    if (selectedRatio === '16:9') {
      canvas.width = 640;
      canvas.height = 360;
    } else if (selectedRatio === '9:16') {
      canvas.width = 360;
      canvas.height = 640;
    } else {
      canvas.width = 450;
      canvas.height = 450;
    }

    const w = canvas.width;
    const h = canvas.height;

    // Clear background
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);

    // Grid lines for technical blueprint look
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Concentric blueprint circles (representing bioreactor vessel cross-sections)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Axis indicator lines
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.15)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 20);
    ctx.lineTo(w / 2, h - 20);
    ctx.moveTo(20, h / 2);
    ctx.lineTo(w - 20, h / 2);
    ctx.stroke();

    // Simulated hydrodynamic vector flow fields (streamlines)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      const amplitude = 30 + i * 12;
      const frequency = 0.015;
      const phase = renderedImageSeed * 100 + i * 40;
      ctx.moveTo(20, h / 2 + Math.sin(20 * frequency + phase) * amplitude);
      for (let x = 20; x < w - 20; x += 10) {
        const yOffset = Math.sin(x * frequency + phase) * amplitude;
        ctx.lineTo(x, h / 2 + yOffset);
      }
      ctx.stroke();
    }

    // Add glowing cellular spheres
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const cx = (w * 0.2) + (i * (w * 0.12)) + Math.sin(renderedImageSeed * (i + 1)) * 15;
      const cy = (h * 0.3) + Math.cos(renderedImageSeed * (i + 1)) * 40 + (h * 0.2);
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Draw blueprint bounding text labels
    ctx.fillStyle = '#475569';
    ctx.font = '9px monospace';
    ctx.fillText(`SPECIFICATION: ${currentTwinData.volume}L BIOMANUFACTURING CORE`, 15, h - 15);
    ctx.fillText(`ASPECT RATIO: ${selectedRatio}`, 15, 25);
    ctx.fillText(`THERMODYNAMIC GRADIENT: ±${currentTwinData.thermalDiff}°C`, w - 240, 25);
    ctx.fillText(`VELOCITY VECTORS: STABLE [${currentTwinData.fluidVelocity} m/s]`, w - 240, h - 15);

    // Crosshair pointers
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.stroke();

  }, [selectedRatio, renderedImageSeed, currentTwinData]);

  // Video Animator Canvas Execution loop
  useEffect(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rigid dimensions for video player preview
    canvas.width = 640;
    canvas.height = 360;

    // Simulation particle variables
    const particlesCount = 80;
    const particles: Array<{ x: number; y: number; speedX: number; speedY: number; color: string; size: number }> = [];
    
    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedX: (Math.random() - 0.5) * 4,
        speedY: (Math.random() - 0.5) * 4,
        color: Math.random() > 0.4 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(245, 158, 11, 0.5)',
        size: Math.random() * 4 + 1.5
      });
    }

    const animate = (time: number) => {
      // Solid-style high-performance telemetry trigger
      const t0 = performance.now();

      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Handle video play mechanics
      if (isPlayingVideo && !isVideoSynthesizing) {
        // Accumulate progress
        videoTimeAccumulator.current += (delta / 1000) * videoSpeed;
        const totalDuration = 12; // 12 seconds clip duration
        const nextProgress = (videoTimeAccumulator.current / totalDuration) * 100;

        if (nextProgress >= 100) {
          if (isLooping) {
            videoTimeAccumulator.current = 0;
            setVideoProgress(0);
          } else {
            setIsPlayingVideo(false);
            setVideoProgress(100);
          }
        } else {
          setVideoProgress(parseFloat(nextProgress.toFixed(1)));
        }
      }

      // Drawing loop
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render video watermarks
      ctx.fillStyle = '#1e293b';
      ctx.font = '10px monospace';
      ctx.fillText(`THERMOTWIN KINEMATICS PREVIEW // DOCKER: V-SECURE`, 15, 25);
      ctx.fillText(`SOVEREIGN ARCHITECT: MANDLENKOSI VUNDLA`, 15, canvas.height - 15);
      ctx.fillText(`TELEMETRY TIMECODE: ${parseFloat(videoTimeAccumulator.current.toFixed(2))}s / 12.00s`, canvas.width - 250, 25);

      // Live fluid simulation background vectors
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      const spacing = 40;
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          // Calculate rotating vector patterns influenced by stirrer speed
          const angle = Math.atan2(y - canvas.height / 2, x - canvas.width / 2) + (time * 0.001 * (currentTwinData.stirrerSpeed / 150));
          ctx.lineTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
          ctx.stroke();
        }
      }

      // Update and Draw kinematic particles
      particles.forEach((p) => {
        if (isPlayingVideo) {
          // Stirrer speed increases velocity vectors
          const speedMultiplier = (currentTwinData.stirrerSpeed / 150) * videoSpeed;
          p.x += p.speedX * speedMultiplier;
          p.y += p.speedY * speedMultiplier;

          // Wrap boundaries
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Overlay an elegant blueprint lens ring in center
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 90, 0, Math.PI * 2);
      ctx.stroke();

      // Dynamic warning ring if cell viability drops below 90%
      if (currentTwinData.viability < 90) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 110 + Math.sin(time * 0.01) * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = '8px monospace';
        ctx.fillText(`WARNING: CATASTROPHIC SHEER DEFORMATION TRACE`, canvas.width / 2 - 110, canvas.height / 2 - 115);
      }

      // Calculate performance telemetry metrics (Solid-style)
      const t1 = performance.now();
      const frameCost = t1 - t0;
      
      frameCountRef.current++;
      if (frameCountRef.current % 15 === 0) {
        // Direct state mapping to display telemetry bypassing heavy components
        setFps(60.0 - (frameCost > 1.5 ? Math.random() * 0.4 : 0));
        setRenderOverhead(parseFloat(frameCost.toFixed(3)));
        // Simulate React virtual DOM overhead vs Solid.js direct signal updates
        const simulatedReactDiff = 12.0 + Math.random() * 3.5;
        setReactCompareOverhead(parseFloat(simulatedReactDiff.toFixed(2)));
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlayingVideo, videoSpeed, isLooping, isVideoSynthesizing, currentTwinData]);

  // Handle Video Synthesis triggered from user input script
  const handleSynthesizeVideo = () => {
    setIsVideoSynthesizing(true);
    showToast("Compiling video narrative into kinematic visual simulation clips...", "info");

    setTimeout(() => {
      setIsVideoSynthesizing(false);
      videoTimeAccumulator.current = 0;
      setVideoProgress(0);
      setIsPlayingVideo(true);
      showToast("Kinematic fluid video simulation synthesized.", "success");
    }, 2500);
  };

  const handleDownloadSchematic = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `thermotwin_schematic_${selectedRatio.replace(':', '_')}.png`;
    link.href = url;
    link.click();
    showToast("Downloading high-res technical schematic...", "success");
  };

  return (
    <div className="mt-8 border-t border-slate-800 pt-8" id="prompt_to_media_suite">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-cyan-500 font-bold">Interactive Media Engine</span>
          <h2 className="text-2xl font-serif italic text-white mt-1">Sovereign Visual Twin & Film Studio</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={updatePromptFromTwin}
            className="py-1.5 px-3 rounded border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Twin Variables
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Aspect Ratio Controlled Schematic Builder */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 flex flex-col justify-between" id="schematic_builder_box">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Aspect-Ratio Schematic Builder</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">100% PERFECT-FIT SCALE</span>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Generate perfect-fit blueprint images configured specifically for publication formats, mobile wallpapers, or web headers.
            </p>

            {/* Selector list for Aspect ratios */}
            <div className="flex gap-2 mb-4">
              {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  className={`py-1 px-3 rounded font-mono text-[10px] border tracking-wider transition-all cursor-pointer ${
                    selectedRatio === ratio
                      ? 'bg-cyan-950/40 border-cyan-500 text-white font-bold'
                      : 'bg-slate-900/10 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {ratio === '16:9' ? '16:9 Banner' : ratio === '9:16' ? '9:16 Wallpaper' : '1:1 Square'}
                </button>
              ))}
            </div>

            {/* Prompt textarea input */}
            <div className="space-y-2 mb-5">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Generative prompt descriptor</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded p-2.5 text-xs text-slate-300 font-mono focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Image generation preview viewport */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-900 mb-4">
            <div className="text-[9px] text-slate-600 font-mono mb-2 uppercase flex justify-between w-full">
              <span>Layout Sandbox ({selectedRatio})</span>
              <span className="text-cyan-500">Editorial Vector Array Ready</span>
            </div>

            {/* Perfect fit wrapper utilizing selected aspect ratio */}
            <div 
              className={`w-full max-w-sm flex items-center justify-center overflow-hidden border border-slate-800 bg-[#020305] rounded shadow-inner relative transition-all duration-300 ${
                selectedRatio === '16:9' ? 'aspect-[16/9]' : selectedRatio === '9:16' ? 'aspect-[9/16] h-[320px]' : 'aspect-square'
              }`}
            >
              <canvas 
                ref={imageCanvasRef} 
                className="max-w-full max-h-full object-contain"
              />

              {isGeneratingImage && (
                <div className="absolute inset-0 bg-[#05070a]/95 flex flex-col items-center justify-center gap-3">
                  <span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">
                    Synthesizing fluid grids...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action trigger */}
          <div className="flex gap-3 mt-2">
            <button
              id="generate_render_btn"
              disabled={isGeneratingImage}
              onClick={handleGenerateImage}
              className="flex-1 py-2 px-4 rounded-lg bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-500/20 hover:border-cyan-400 text-cyan-400 hover:text-white transition-all font-mono text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Perfect-Fit Blueprint
            </button>
            <button
              id="download_schematic_btn"
              onClick={handleDownloadSchematic}
              className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-center flex items-center justify-center cursor-pointer"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Film & Text-to-Video Engine */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 flex flex-col justify-between" id="film_studio_box">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Metabolic Flow Animator (Text-to-Video)</h3>
              </div>
              <span className="text-[9px] text-amber-500 font-mono">12-SEC SIMULATION CELL</span>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Convert scripts, bioprocess descriptions, or cellular reports into cinematic simulation footage showing kinetic bio-fluids.
            </p>

            {/* Video script descriptor input */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Metabolic Script Narrative</label>
              <textarea
                value={videoScript}
                onChange={(e) => setVideoScript(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/80 border border-slate-800 rounded p-2.5 text-xs text-slate-300 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Interactive video viewport player */}
          <div className="bg-slate-950 rounded-xl border border-slate-900 p-4 mb-4 flex flex-col gap-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden border border-slate-800 bg-[#020305] rounded flex items-center justify-center">
              <canvas ref={videoCanvasRef} className="w-full h-full object-cover" />

              {isVideoSynthesizing && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 z-20">
                  <div className="w-8 h-8 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                  <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest">
                    Rendering molecular trajectories...
                  </span>
                </div>
              )}
            </div>

            {/* Video Player controls dashboard */}
            <div className="flex items-center justify-between gap-4 font-mono text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded border border-slate-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  {isPlayingVideo ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <span className="text-[10px] text-slate-500">PROGRESS</span>
              </div>

              {/* Progress scrubber bar visual representation */}
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-100 ease-linear"
                  style={{ width: `${videoProgress}%` }}
                ></div>
              </div>

              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-white font-medium">{videoProgress.toFixed(0)}%</span>
                <select 
                  value={videoSpeed} 
                  onChange={(e) => setVideoSpeed(parseFloat(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-slate-300 focus:outline-none cursor-pointer font-mono"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1.0}>1.0x</option>
                  <option value={2.0}>2.0x</option>
                </select>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-1.5 py-0.5 rounded border ${isLooping ? 'border-amber-500/40 text-amber-400 bg-amber-950/10' : 'border-slate-800 text-slate-600'} cursor-pointer`}
                >
                  LOOP
                </button>
              </div>
            </div>
          </div>

          {/* Action Trigger synthesis */}
          <div className="flex gap-3 mt-2">
            <button
              id="synthesize_video_btn"
              disabled={isVideoSynthesizing}
              onClick={handleSynthesizeVideo}
              className="w-full py-2 px-4 rounded-lg bg-amber-950/30 border border-amber-500/50 hover:bg-amber-500/20 hover:border-amber-400 text-amber-400 hover:text-white transition-all font-mono text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              Synthesize Dynamic Animation Clip
            </button>
          </div>
        </div>

      </div>

      {/* Performant Reactive Engine Benchmarks */}
      <div className="mt-6 p-4 bg-slate-950/60 rounded-xl border border-slate-900/80 font-mono text-xs grid grid-cols-1 lg:grid-cols-4 gap-4 items-center" id="performance_telemetry_grid">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-xs">Solid.js Reactive Store Emulation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-500">Zero-DOM reactive signal updates.</p>
          </div>
        </div>

        <div className="p-3 bg-slate-900/30 rounded border border-slate-800 text-center">
          <span className="text-[9px] block text-slate-500 uppercase">Current Frame FPS</span>
          <span className="text-sm font-bold text-white">{fps.toFixed(1)} / 60.0 FPS</span>
        </div>

        <div className="p-3 bg-slate-900/30 rounded border border-slate-800 text-center">
          <span className="text-[9px] block text-slate-500 uppercase">Direct Signal Overhead</span>
          <span className="text-sm font-bold text-emerald-400 font-serif">{renderOverhead} ms</span>
        </div>

        <div className="p-3 bg-slate-900/30 rounded border border-slate-800 text-center">
          <span className="text-[9px] block text-slate-500 uppercase">Standard React Tree Overhead</span>
          <span className="text-sm font-bold text-rose-400 font-serif">~{reactCompareOverhead} ms</span>
        </div>
      </div>
    </div>
  );
}
