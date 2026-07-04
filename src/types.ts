export interface BioreactorInputs {
  volume: number;       // Liters
  temperature: number;  // °C
  stirrerSpeed: number; // RPM
  aerationRate: number; // vvm
  metabolicLoad: number; // %
  feedRate: number;      // kg/h
}

export interface SimulationResult extends BioreactorInputs {
  fluidVelocity: number;  // m/s
  reynoldsNumber: number;
  thermalDiff: number;    // °C
  sheerStress: number;    // Pa
  kLa: number;            // h^-1
  viability: number;      // %
}

export interface AIGuardReport {
  complianceStatus: 'APPROVED' | 'WARNING' | 'REJECTED';
  thermodynamicAudit: string;
  fluidDynamicsAudit: string;
  quantumSyncAudit: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warnings: string[];
  recommendations: string[];
  certifiedBy: string;
}

export interface HoneyPotStatus {
  breachDetected: boolean;
  attackerIP: string;
  attackerLocation: string;
  honeyPotStatus: 'INACTIVE' | 'ENGAGED' | 'TRAPPED';
  voidTrapState: string;
  quantumCoordinate: string;
  actionTaken: string;
  dispatchTimestamp: string;
}
