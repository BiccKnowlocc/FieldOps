export type SyncStatus = 'pending' | 'synced' | 'conflict';

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'wind'
  | 'heat'
  | 'cold';

export type DelayType =
  | 'weather_hold'
  | 'trade_conflict'
  | 'material_wait'
  | 'equipment_down'
  | 'inspection'
  | 'access'
  | 'other';

export type Trade =
  | 'general'
  | 'sitework'
  | 'concrete'
  | 'framing'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'drywall'
  | 'roofing'
  | 'finishes';

export type PunchPriority = 'low' | 'medium' | 'high' | 'critical';
export type PunchStatus = 'open' | 'in_progress' | 'ready_for_review' | 'closed';
export type MediaKind = 'photo' | 'video';
export type MediaTag = 'progress' | 'before' | 'after' | 'defect' | 'delivery' | 'receipt' | 'incident' | 'ticket';
export type ParentType = 'daily_log' | 'punch_item' | 'jobsite' | 'receipt' | 'change_order' | 'work_order' | 'incident' | 'toolbox_talk';
export type AssetKind = 'heavy' | 'tool' | 'truck';
export type AssetStatus = 'available' | 'checked_out' | 'down' | 'in_service';
export type MeterUnit = 'hours' | 'km';
export type ServiceKind = 'oil' | 'hyd';

export type Collection =
  | 'settings'
  | 'jobsites'
  | 'crew'
  | 'daily_logs'
  | 'punch_items'
  | 'media'
  | 'assets'
  | 'meter_entries'
  | 'inspections'
  | 'service_logs'
  | 'checkouts'
  | 'estimate_lines'
  | 'takeoffs'
  | 'change_orders'
  | 'receipts'
  | 'purchase_orders'
  | 'time_entries'
  | 'shifts'
  | 'work_orders'
  | 'toolbox_talks'
  | 'incidents'
  | 'drawings'
  | 'certifications'
  | 'bim_pins'
  | 'pay_apps'
  | 'lien_waivers'
  | 'drone_surveys'
  | 'remote_mirror'
  | 'conflicts';

export type StoredDoc<T = unknown> = {
  id: string;
  collection: Collection;
  data: T;
  updatedAt: number;
  deletedAt: number | null;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;
};

export type Jobsite = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  geofenceRadiusM: number;
  status: 'active' | 'complete';
};

export type CrewMember = {
  id: string;
  jobsiteId: string;
  name: string;
  role: string;
  company: string;
  trade: Trade;
};

export type LogVisitor = {
  id: string;
  name: string;
  company: string;
  purpose: string;
};

export type LogDelivery = {
  id: string;
  supplier: string;
  description: string;
  received: boolean;
};

export type LogDelay = {
  id: string;
  type: DelayType;
  hours: number;
  notes: string;
};

export type DailyLog = {
  id: string;
  jobsiteId: string;
  logDate: string;
  weather: WeatherCondition;
  tempC: number;
  crewIds: string[];
  workChips: string[];
  workNotes: string;
  visitors: LogVisitor[];
  deliveries: LogDelivery[];
  delays: LogDelay[];
  createdBy: string;
  createdAt: number;
};

export type PunchItem = {
  id: string;
  jobsiteId: string;
  title: string;
  description: string;
  trade: Trade;
  assignee: string;
  company: string;
  priority: PunchPriority;
  status: PunchStatus;
  dueDate: string;
  locationNote: string;
  beforeMediaIds: string[];
  afterMediaIds: string[];
  createdAt: number;
};

export type StrokePoint = { x: number; y: number };

export type MarkupStroke = {
  id: string;
  kind: 'draw' | 'arrow' | 'highlight';
  color: string;
  width: number;
  points: StrokePoint[];
};

export type MediaItem = {
  id: string;
  jobsiteId: string;
  uri: string;
  kind: MediaKind;
  tag: MediaTag;
  capturedAt: number;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  parentType: ParentType | null;
  parentId: string | null;
  markup: MarkupStroke[];
  caption: string;
};

export type Asset = {
  id: string;
  jobsiteId: string;
  name: string;
  kind: AssetKind;
  make: string;
  model: string;
  unitNumber: string;
  qrCode: string;
  meterUnit: MeterUnit;
  hourMeter: number;
  idleHours: number;
  fuelUsedLitres: number;
  lastOilHours: number;
  lastHydHours: number;
  status: AssetStatus;
  assignedTo: string | null;
  assignedLocation: string | null;
};

export type MeterEntry = {
  id: string;
  assetId: string;
  jobsiteId: string;
  hourMeter: number;
  idleAdded: number;
  fuelAdded: number;
  createdAt: number;
  createdBy: string;
};

export type InspectionItem = {
  id: string;
  label: string;
  ok: boolean | null;
};

export type Inspection = {
  id: string;
  assetId: string;
  jobsiteId: string;
  createdAt: number;
  operator: string;
  result: 'pass' | 'fail';
  items: InspectionItem[];
};

export type ServiceLog = {
  id: string;
  assetId: string;
  kind: ServiceKind;
  hoursAtService: number;
  createdAt: number;
};

export type CheckoutEvent = {
  id: string;
  assetId: string;
  action: 'out' | 'in';
  operator: string;
  location: string;
  createdAt: number;
};

export type TakeoffKind = 'concrete' | 'aggregate' | 'sf' | 'framing' | 'drywall';
export type LineSource = 'estimate' | 'takeoff' | 'change_order' | 'po';
export type ChangeOrderStatus = 'draft' | 'signed' | 'void';
export type PoStatus = 'draft' | 'issued';

export type EstimateLine = {
  id: string;
  jobsiteId: string;
  costCode: string;
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  source: LineSource;
  takeoffId: string | null;
  changeOrderId: string | null;
};

export type Takeoff = {
  id: string;
  jobsiteId: string;
  kind: TakeoffKind;
  qty: number;
  unit: string;
  wastePct: number;
  notes: string;
  createdAt: number;
};

export type ChangeOrderLine = {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  costCode: string;
};

export type ChangeOrder = {
  id: string;
  jobsiteId: string;
  number: string;
  title: string;
  laborHours: number;
  laborRate: number;
  lines: ChangeOrderLine[];
  status: ChangeOrderStatus;
  signature: MarkupStroke[];
  signedBy: string | null;
  signedAt: number | null;
  createdAt: number;
};

export type Receipt = {
  id: string;
  jobsiteId: string;
  vendor: string;
  costCode: string;
  amount: number;
  photoUri: string | null;
  ocrNote: string;
  createdAt: number;
};

export type PurchaseOrder = {
  id: string;
  jobsiteId: string;
  vendor: string;
  costCode: string;
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  status: PoStatus;
  createdAt: number;
};

export type TimeEntry = {
  id: string;
  jobsiteId: string;
  crewId: string;
  crewName: string;
  taskCode: string;
  clockIn: number;
  clockOut: number | null;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  insideGeofence: boolean;
};

export type Shift = {
  id: string;
  jobsiteId: string;
  date: string;
  crewId: string;
  crewName: string;
  trade: Trade;
  assetId: string | null;
  startHour: number;
  endHour: number;
  alertSent: boolean;
};

export type WorkOrderStatus = 'offered' | 'accepted' | 'declined' | 'in_progress' | 'complete';

export type WorkOrderDelivery = {
  id: string;
  note: string;
  createdAt: number;
};

export type WorkOrder = {
  id: string;
  jobsiteId: string;
  number: string;
  company: string;
  trade: Trade;
  title: string;
  scope: string;
  status: WorkOrderStatus;
  deliveries: WorkOrderDelivery[];
  invoiceUri: string | null;
  invoiceAmount: number | null;
  createdAt: number;
};

export type IncidentKind = 'incident' | 'near_miss';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RootCause = 'housekeeping' | 'ppe' | 'procedure' | 'equipment' | 'communication' | 'other';
export type DrawingDiscipline = 'arch' | 'struct' | 'mep' | 'civil';
export type CertKind = 'osha10' | 'osha30' | 'first_aid' | 'lift' | 'license' | 'insurance';

export type ToolboxTalk = {
  id: string;
  jobsiteId: string;
  date: string;
  topic: string;
  points: string[];
  attendeeIds: string[];
  createdAt: number;
};

export type Incident = {
  id: string;
  jobsiteId: string;
  kind: IncidentKind;
  severity: IncidentSeverity;
  title: string;
  description: string;
  locationNote: string;
  rootCauses: RootCause[];
  involvedIds: string[];
  photoUris: string[];
  createdAt: number;
};

export type Drawing = {
  id: string;
  jobsiteId: string;
  discipline: DrawingDiscipline;
  sheetNumber: string;
  title: string;
  revision: string;
  issuedDate: string;
  current: boolean;
  supersedesId: string | null;
  linkHint: string;
  markup: MarkupStroke[];
  createdAt: number;
};

export type Certification = {
  id: string;
  jobsiteId: string;
  crewId: string;
  crewName: string;
  kind: CertKind;
  number: string;
  expiresOn: string;
  photoUri: string | null;
};

export type BimPin = {
  id: string;
  jobsiteId: string;
  x: number;
  y: number;
  z: number;
  trade: string;
  title: string;
  createdAt: number;
};

export type PayAppStatus = 'draft' | 'submitted' | 'approved' | 'paid';

export type PayApp = {
  id: string;
  jobsiteId: string;
  number: string;
  company: string;
  lineTitle: string;
  percentComplete: number;
  amount: number;
  photoUris: string[];
  status: PayAppStatus;
  createdAt: number;
};

export type LienWaiver = {
  id: string;
  payAppId: string;
  kind: 'conditional' | 'unconditional';
  signedBy: string | null;
  signedAt: number | null;
};

export type DroneSurvey = {
  id: string;
  jobsiteId: string;
  date: string;
  cutCy: number;
  fillCy: number;
  netCy: number;
  notes: string;
  createdAt: number;
};

export type AppSettings = {
  selectedJobsiteId: string;
  operatorName: string;
  unitsVersion?: number;
};

export type ConflictRecord = {
  id: string;
  collection: Collection;
  entityId: string;
  local: StoredDoc;
  remote: StoredDoc;
  createdAt: number;
};
