import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Setup Gemini client lazily to avoid crashes if GEMINI_API_KEY is not defined yet
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined. Falling back to local physics-rule generator.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Bioreactor Thermodynamic Simulation Engine
app.post('/api/simulate', (req, res) => {
  const {
    volume = 10000,
    temperature = 37.0,
    stirrerSpeed = 150,
    aerationRate = 1.5,
    metabolicLoad = 45,
    feedRate = 0.5
  } = req.body;

  // physical calculations based on real biomanufacturing engineering rules
  // 1. Fluid Velocity (impeller tip speed): v = pi * D * N / 60
  // Impeller diameter D grows with volume^(1/3)
  const D = 0.3 * Math.pow(volume / 1000, 1/3); // approx impeller diameter in meters
  const fluidVelocity = (Math.PI * D * stirrerSpeed) / 60; // m/s

  // 2. Reynolds Number (turbulent flag)
  // Re = N * D^2 * density / viscosity
  // Water-like density = 1000, viscosity = 0.001
  const reynoldsNumber = Math.round((stirrerSpeed / 60) * Math.pow(D, 2) * 1000 / 0.001);

  // 3. Heat accumulation & Gradient (Thermal Difference)
  // High volume = lower surface-area-to-volume ratio = poor cooling = high thermal difference
  // Metabolic load generates heat. Agitation also adds power input.
  const volumeFactor = volume / 10000; // normalized around 10kL
  const metabolicHeat = metabolicLoad * 0.15; // heat generation proportional to metabolism
  const coolingInefficiency = volumeFactor * 0.8; 
  const thermalDiff = Math.max(0.01, 0.02 + (metabolicHeat * coolingInefficiency) - (stirrerSpeed * 0.0001));

  // 4. Shear Stress (stiffness/physical damage to cells)
  // Shear stress grows with impeller tip speed and liquid viscosity
  const sheerStress = fluidVelocity * 1.8; // Pa

  // 5. Oxygen Mass Flux (kLa approximation)
  // kLa increases with stirrerSpeed and aerationRate, decreases with high volume
  const kLa = Math.max(1.0, (Math.pow(stirrerSpeed, 1.2) * Math.sqrt(aerationRate)) / (150 * volumeFactor));

  // 6. Cell Viability percentage (simulating cell stress and survival)
  // Optimal temp is 37C. Sheer stress threshold is around 3.5 Pa for animal cells.
  const tempDeviation = Math.abs(temperature - 37.0);
  let cellStress = 0;
  
  if (tempDeviation > 0.5) {
    cellStress += tempDeviation * 15; // rapid decay if temp drifts
  }
  if (sheerStress > 3.0) {
    cellStress += (sheerStress - 3.0) * 20; // sheer stress cell death
  }
  if (thermalDiff > 0.15) {
    cellStress += (thermalDiff - 0.15) * 80; // thermal gradient kills cells
  }
  if (metabolicLoad > 85) {
    cellStress += (metabolicLoad - 85) * 0.8; // overload stress
  }

  const viability = Math.max(0, Math.min(100, Math.round(100 - cellStress)));

  res.json({
    volume,
    temperature,
    stirrerSpeed,
    aerationRate,
    metabolicLoad,
    feedRate,
    fluidVelocity: parseFloat(fluidVelocity.toFixed(2)),
    reynoldsNumber,
    thermalDiff: parseFloat(thermalDiff.toFixed(2)),
    sheerStress: parseFloat(sheerStress.toFixed(2)),
    kLa: parseFloat(kLa.toFixed(1)),
    viability
  });
});

// 2. Newtonian AI Guard Verification (Using Gemini Server-Side API)
app.post('/api/gemini/report', async (req, res) => {
  const {
    volume = 10000,
    temperature = 37.0,
    stirrerSpeed = 150,
    aerationRate = 1.5,
    metabolicLoad = 45,
    feedRate = 0.5,
    fluidVelocity = 1.42,
    reynoldsNumber = 12000,
    thermalDiff = 0.04,
    sheerStress = 0.88,
    viability = 98
  } = req.body;

  const ai = getAI();

  if (!ai) {
    // If no Gemini API Key is available, return a highly polished local mock simulation response
    // ensuring the app is fully functional and responsive.
    let status: 'APPROVED' | 'WARNING' | 'REJECTED' = 'APPROVED';
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (viability < 70) {
      status = 'REJECTED';
      warnings.push(`Catastrophic cell viability collapse detected (${viability}%).`);
      recommendations.push("Reduce Stirrer Speed immediately to lower physical shear stress.");
      recommendations.push("Optimize the bioreactor's external jacket cooling system to minimize thermal gradients.");
    } else if (viability < 90) {
      status = 'WARNING';
      warnings.push(`Significant metabolic stress detected (Viability: ${viability}%).`);
      recommendations.push("Adjust feed rate to reduce excessive cell metabolic accumulation.");
      recommendations.push("Slightly increase aeration rate to buffer high metabolic demand.");
    } else {
      recommendations.push("Maintain current automated parameters. Fluid-thermodynamic sync is in golden balance.");
      recommendations.push("Proceed with pre-scale physical manufacturing planning.");
    }

    const localReport = {
      complianceStatus: status,
      thermodynamicAudit: `Thermodynamic stability evaluated for ${volume}L vessel. Heat accumulation estimated at ${metabolicLoad}% metabolic load. Calculated thermal difference: ±${thermalDiff}°C. Mass-energy conservation is maintained.`,
      fluidDynamicsAudit: `Fluid dynamics verified with stirrer speed at ${stirrerSpeed} RPM (Impeller tip velocity: ${fluidVelocity} m/s). Reynolds number is ${reynoldsNumber} indicating ${reynoldsNumber > 10000 ? "fully turbulent" : "laminar/transitional"} flow. Shear stress is stable at ${sheerStress} Pa.`,
      quantumSyncAudit: "Sovereign quantum sync engine aligns Mnesia database states with thermodynamic constraints. Universal physical constraints are within acceptable quantum deviation bounds.",
      riskLevel: viability > 90 ? 'LOW' : viability > 70 ? 'MEDIUM' : 'HIGH',
      warnings,
      recommendations,
      certifiedBy: "Newtonian AI Guard v1.0.4 - Local Real-time Engine (Offline Mode)"
    };

    return res.json(localReport);
  }

  try {
    const prompt = `You are the "Newtonian AI Guard", a rigorous automated biomanufacturing compliance and physical-law verification system.
Analyze the following bioreactor operational parameters for a biomanufacturing run:
- Bioreactor Volume: ${volume} L
- Temperature: ${temperature} °C
- Stirrer Speed: ${stirrerSpeed} RPM
- Aeration Rate: ${aerationRate} vvm
- Metabolic Load: ${metabolicLoad} %
- Feed Rate: ${feedRate} kg/h
- Calculated Fluid Velocity: ${fluidVelocity} m/s
- Calculated Reynolds Number: ${reynoldsNumber}
- Calculated Sheer Stress: ${sheerStress} Pa
- Calculated Heat Gradient (Max thermal diff): ±${thermalDiff} °C
- Estimated Cell Viability: ${viability}%

Generate a highly structured scientific validation report that:
1. Assesses Thermodynamics: Does the metabolic load match mass-energy conservation? (First and Second Laws of Thermodynamics, heat dissipation rates in a ${volume}L vessel).
2. Assesses Fluid Dynamics & Aerodynamics: Is the agitation (Stirrer Speed, Reynolds Number, Sheer Stress) within tolerable biological limits? Does the shear stress risk cell lysis?
3. Assesses MATLAB/Astro-Physics/Quantum Sync: Enforce quantum probability matrix alignment (humorously but scientifically integrated to match the Sovereign Biomanufacturing OS theme, citing zero-day physical anomalies).
4. Issues a compliance status: either APPROVED (safe to scale up), WARNING (minor cell death / stress), or REJECTED (catastrophic mass cell death / reactor instability).
5. Provides explicit optimization recommendations to stabilize the bioreactor.

Return your response strictly in standard JSON with the following structure:
{
  "complianceStatus": "APPROVED" | "WARNING" | "REJECTED",
  "thermodynamicAudit": "Detailed thermodynamic analysis...",
  "fluidDynamicsAudit": "Detailed fluid dynamics/aerodynamic audit...",
  "quantumSyncAudit": "Detailed quantum/astro-physical sync audit...",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "warnings": ["Warning 1", "Warning 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "certifiedBy": "Newtonian AI Guard v1.0.4 - Sovereign OS"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["complianceStatus", "thermodynamicAudit", "fluidDynamicsAudit", "quantumSyncAudit", "riskLevel", "warnings", "recommendations", "certifiedBy"],
          properties: {
            complianceStatus: { type: Type.STRING },
            thermodynamicAudit: { type: Type.STRING },
            fluidDynamicsAudit: { type: Type.STRING },
            quantumSyncAudit: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifiedBy: { type: Type.STRING }
          }
        },
        systemInstruction: "You are an elite, highly precise Newtonian AI Guard. You verify biological datasets strictly against laws of thermodynamics, fluid dynamics, aerodynamics, astrophysics, and quantum computing. Keep the style formal, highly technical, and matching the sovereign editorial aesthetic.",
        temperature: 0.2
      }
    });

    const reportText = response.text || "{}";
    const reportData = JSON.parse(reportText.trim());
    res.json(reportData);
  } catch (error: any) {
    console.error("Gemini Newtonian AI Guard failed:", error);
    res.status(500).json({ error: "Failed to generate AI validation report.", details: error.message });
  }
});

// 3. Astrophysics Honey-pot Trap Trigger
app.post('/api/honey-pot/trigger', (req, res) => {
  const mockIPs = [
    '185.220.101.44', '198.51.100.72', '203.0.113.195', '45.143.203.14', '109.201.154.33'
  ];
  const targetIP = mockIPs[Math.floor(Math.random() * mockIPs.length)];
  const locations = [
    'Stockholm, Sweden (Proxy Relay #14)',
    'Zurich, Switzerland (TOR Exit Node)',
    'Reykjavik, Iceland (Sovereign Server Room B)',
    'Bucharest, Romania (Distributed Botnet)',
    'Unknown (Deep Space Signal Mask)'
  ];
  const targetLoc = locations[Math.floor(Math.random() * locations.length)];

  res.json({
    breachDetected: true,
    attackerIP: targetIP,
    attackerLocation: targetLoc,
    honeyPotStatus: "ENGAGED",
    voidTrapState: "GRAVITATIONAL_SINGULARITY_LOCK",
    quantumCoordinate: `Q-SYS-${Math.floor(Math.random()*9000+1000)}-X`,
    actionTaken: "Attacker trapped inside virtual astrophysical event horizon. IP packets looped endlessly. Tracing complete. Dispatched report to local police department.",
    dispatchTimestamp: new Date().toISOString()
  });
});

// Serve frontend assets via Vite middleware in development, or Express.static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const docsPath = path.join(process.cwd(), 'docs');
    const distPath = path.join(process.cwd(), 'dist');
    const publicPath = fs.existsSync(docsPath) ? docsPath : distPath;
    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ThermoTwin Genesis Sovereign Server running on http://localhost:${PORT}`);
  });
}

startServer();
