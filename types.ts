
export enum Severity {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical",
  NONE = "None"
}

export enum HazardType {
  POTHOLE = "pothole",
  SURFACE_DAMAGE = "road_surface_damage",
  NONE = "none"
}

// User Profile for Gamification
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  district: string;
  state: string;
  points: number;
  reportsCount: number;
  joinedAt: number;
}

// THE FORENSIC SUITE (Updated with Trust Layers)
export interface ForensicData {
  authenticity_score: number; // 0-100
  is_ai_generated: boolean;
  is_screen_capture: boolean;
  gps_trust_score: number; // 0 to 100
  location_consistency: "MATCH" | "MISMATCH" | "UNCERTAIN";
  consistency_reason: string; // "Photo shows highway but GPS is indoors"
  environment_match: string; // "Vegetation matches location context"
}

export interface VehicleImpact {
  two_wheeler_risk: "Low" | "Medium" | "High" | "Critical";
  four_wheeler_risk: "Low" | "Medium" | "High";
  visibility_risk: string; // "Shadows obscure depth"
}

export interface RepairData {
  suggested_action: "Monitor" | "Patch Work" | "Resurfacing" | "Reconstruction";
  estimated_cost_inr: string;
  urgency: "24 Hours" | "72 Hours" | "Week" | "Monitor";
  material: "Cold Mix" | "Hot Mix Asphalt" | "Concrete";
}

export interface GPTRAnalysisResult {
  is_road: boolean;
  hazard_detected: boolean;
  hazard_type: string;
  severity: string;
  
  // A. BASIC ROAD ANALYSIS
  road_type: string; // "Highway", "Residential", etc.
  surface_condition: string; // "Asphalt broken", "Exposed aggregate"

  // B. RISK & SAFETY
  accident_probability_score: number; // 0-100
  vehicle_impact: VehicleImpact;

  // C. HUMAN IMPACT
  sensitive_zones: string[]; // ["School", "Hospital"]
  impact_zone_score: number; // 0-10
  
  // D. TRUST (Forensics)
  forensics: ForensicData;

  // E. REPAIR INTELLIGENCE
  repair_info: RepairData;

  // F. HISTORY & CONTEXT
  is_duplicate_report: boolean; 
  history_summary: string; 
  nearby_place_detected: string;

  // AI META
  confidence_score: number;
  reasoning: string[];
  human_touch_statement: string; // "This pothole poses high risk to students nearby."
  
  // ** REPAIR AUDIT (NEW) **
  repair_quality_audit?: {
      status: "GENUINE_REPAIR" | "FAKE_COVERUP" | "POOR_QUALITY" | "NOT_REPAIRED" | "LOCATION_MISMATCH";
      evidence: string; // "Loose soil used instead of bitumen"
      verification_score: number; // 0-100
      match_confidence?: number; // 0-100 (How well does it match the old photo?)
  };
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number; // GPS Accuracy in meters
  speed?: number | null; // Speed in m/s
  heading?: number | null; // Direction
}

export interface AddressContext {
  street: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  formattedAddress: string;
}

export interface Report {
  id: string;
  deviceId?: string; 
  userId?: string; // Linked to UserProfile
  userName?: string; // ADDED: Display name of the reporter for attribution
  image: string; 
  location: GeoLocation | null;
  timestamp: number;
  analysis: GPTRAnalysisResult;
  reportType?: 'hazard' | 'repair';
  parentReportId?: string; // NEW: Links a repair to the original hazard ID
  addressContext?: AddressContext; 
}
