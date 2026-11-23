export type UserRole = 'student' | 'faculty' | 'admin';

export type EquipmentCategory =
  | 'Robotics'
  | 'Electronics'
  | 'Manufacturing'
  | 'Research'
  | 'Computing'
  | 'Fabrication';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  title: string;
  weeklyQuotaHours: number;
  usedHoursThisWeek: number;
  certifications: string[];
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headName: string;
  instrumentCount: number;
  uptimePercent: number;
  accentColor: 'mint' | 'blue' | 'pink' | 'butter';
  icon: string;
}

export interface Laboratory {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  building: string;
  room: string;
  accessLevel: string;
  capacity: number;
  occupied: number;
  status: 'open' | 'high_load' | 'calibrating' | 'closed';
  managerName: string;
  managerTitle: string;
  managerAvatar?: string;
  coordinates: { lat: number; lng: number; xPercent: number; yPercent: number };
}

export interface EquipmentSpec {
  label: string;
  value: string;
  icon: string;
  tone: 'mint' | 'blue' | 'pink' | 'neutral';
}

export interface EquipmentGuideline {
  title: string;
  detail: string;
  icon: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  departmentId: string;
  departmentName: string;
  laboratoryId: string;
  locationLabel: string;
  status: 'available' | 'in_use' | 'maintenance';
  hourlyRate: number;
  requiresFacultyApproval: boolean;
  certificationRequired: string;
  biosafetyLevel: string;
  nextSlotLabel: string;
  lastCalibrated: string;
  totalBookings: number;
  description: string;
  specsPreview: string;
  specs: EquipmentSpec[];
  guidelines: EquipmentGuideline[];
  imageUrl: string;
  clayTheme: 'microscope' | 'robot' | 'printer' | 'oscilloscope' | 'compute' | 'cnc' | 'xrd';
}

export interface ResearchProject {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  grantCode: string;
  department: string;
  category: string;
  description: string;
  deadline: string;
  progress: number;
  tone: 'mint' | 'blue' | 'pink';
  icon: string;
  recommendedEquipmentIds: string[];
  aiAnalysisSummary?: string;
  status: 'active' | 'pending_access' | 'completed';
}

export type BookingStatus =
  | 'confirmed'
  | 'pending'
  | 'rejected'
  | 'cancelled'
  | 'alternative_suggested';

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  userRoleTitle: string;
  projectId: string;
  projectTitle: string;
  date: string; // YYYY-MM-DD
  startHour: number; // 8..20
  durationHours: number; // 1..8
  status: BookingStatus;
  totalCost: number;
  urgencyTag?: 'Urgent' | 'Routine' | 'Certified';
  aiNote?: string;
  suggestedAlternative?: {
    date: string;
    startHour: number;
    durationHours: number;
    equipmentId: string;
    equipmentName: string;
    reason: string;
  };
  facultyReviewerName?: string;
  createdAt: string;
}

export interface FairSlotCandidate {
  bookingId: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentTitle: string;
  projectTitle: string;
  deadlineDescription: string;
  hoursUntilDeadline: number;
  priorityScore: number;
  weeklyUsedHours: number;
  weeklyQuotaHours: number;
  requestedStartHour: number;
  requestedDurationHours: number;
  recommended: boolean;
}

export interface FairSlotAlternative {
  id: string;
  badge: string;
  score: number;
  timeLabel: string;
  date: string;
  startHour: number;
  durationHours: number;
  equipmentId: string;
  equipmentName: string;
  bayLabel: string;
  rationale: string;
}

export interface FairSlotFactor {
  title: string;
  icon: string;
  tone: 'mint' | 'blue' | 'pink';
  detail: string;
}

export interface FairSlotConflictCase {
  id: string;
  caseCode: string;
  equipmentId: string;
  equipmentName: string;
  bayLabel: string;
  date: string;
  conflictStartHour: number;
  conflictEndHour: number;
  status: 'open' | 'resolved_ai' | 'overridden_faculty';
  fairnessScore: number;
  headlineRecommendation: string;
  explanation: string;
  candidates: [FairSlotCandidate, FairSlotCandidate];
  factors: FairSlotFactor[];
  alternatives: FairSlotAlternative[];
  timelineBlocks: Array<{
    hourLabel: string;
    startHour: number;
    label: string;
    kind: 'booked' | 'conflict' | 'ai_suggested' | 'open';
  }>;
  resolvedBy?: string;
  selectedAlternativeId?: string;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  technician: string;
  taskTitle: string;
  status: 'scheduled' | 'in_progress' | 'cleared';
  scheduledDate: string;
  notes: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'confirmed' | 'warning' | 'ai' | 'info';
  read: boolean;
  createdAt: string;
}

export interface UtilizationAnalytics {
  peakCapacityPercent: number;
  deltaVsLastWeek: string;
  weeklyBars: Array<{ day: string; percent: number; isPeak?: boolean }>;
  zoneSplit: Array<{ zone: string; percent: number; color: string }>;
  onlineInstruments: number;
  totalInstruments: number;
  uptimePercent: number;
}
