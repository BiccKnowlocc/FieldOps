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
export type MediaTag = 'progress' | 'before' | 'after' | 'defect' | 'delivery';
export type ParentType = 'daily_log' | 'punch_item' | 'jobsite';

export type Collection =
  | 'settings'
  | 'jobsites'
  | 'crew'
  | 'daily_logs'
  | 'punch_items'
  | 'media'
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
  tempF: number;
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

export type AppSettings = {
  selectedJobsiteId: string;
  operatorName: string;
};

export type ConflictRecord = {
  id: string;
  collection: Collection;
  entityId: string;
  local: StoredDoc;
  remote: StoredDoc;
  createdAt: number;
};
