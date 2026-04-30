export type AssignmentWarning =
  | "CAPACITY_EXCEEDED"
  | "FAR_DISTANCE"
  | "OUT_OF_SERVICE_AREA"
  | "NO_CANDIDATE"
  | "MISSING_COORDINATES"
  | "MANUAL_OVERRIDE";

export type AssignmentConfidence = "high" | "medium" | "low";

export type Region =
  | "北海道・東北"
  | "関東"
  | "中部"
  | "関西"
  | "中国・四国"
  | "九州・沖縄";

export type TargetSite = {
  siteId: string;
  siteName: string;
  prefecture: string;
  address: string;
  lat: number | null;
  lng: number | null;
  priority: string;
  desiredMonth: string;
  status: string;
  region: Region | null;
  sourceWarnings: AssignmentWarning[];
};

export type CarrierOffice = {
  officeId: string;
  carrierName: string;
  officeName: string;
  prefecture: string;
  address: string;
  lat: number | null;
  lng: number | null;
  serviceArea: string[];
  monthlyCapacity: number;
  region: Region | null;
  sourceWarnings: AssignmentWarning[];
};

export type AssignmentCandidate = {
  officeId: string;
  score: number;
  distanceKm: number | null;
  samePrefecture: boolean;
  inServiceArea: boolean;
  sameRegion: boolean;
  capacityAvailable: boolean;
};

export type AssignmentResult = {
  siteId: string;
  siteName: string;
  assignedOfficeId: string;
  assignedOfficeName: string;
  carrierName: string;
  distanceKm: number | null;
  plannedMonth: string;
  priority: string;
  confidence: AssignmentConfidence;
  warning: AssignmentWarning[];
  manuallyOverridden: boolean;
};

export type AssignmentRow = AssignmentResult & {
  site: TargetSite;
  assignedOffice: CarrierOffice | null;
};

export type CsvValidationIssue = {
  row: number;
  message: string;
};

export type ParsedCsvResult<T> = {
  records: T[];
  issues: CsvValidationIssue[];
};
