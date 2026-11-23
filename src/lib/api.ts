import type {
  AppNotification,
  Booking,
  Department,
  Equipment,
  FairSlotConflictCase,
  Laboratory,
  MaintenanceLog,
  ResearchProject,
  UserProfile,
  UserRole,
  UtilizationAnalytics,
} from '../types/lablink';

let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (inMemoryToken) {
    headers.Authorization = `Bearer ${inMemoryToken}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`) as Error & {
      status?: number;
      conflictDetected?: boolean;
    };
    err.status = res.status;
    err.conflictDetected = Boolean(data?.conflictDetected);
    throw err;
  }
  return data as T;
}

export interface BootstrapPayload {
  user: UserProfile | null;
  departments: Department[];
  laboratories: Laboratory[];
  equipment: Equipment[];
  projects: ResearchProject[];
  bookings: Booking[];
  conflicts: FairSlotConflictCase[];
  maintenance: MaintenanceLog[];
  notifications: AppNotification[];
  analytics: UtilizationAnalytics;
  users: UserProfile[];
}

export const api = {
  health: () =>
    request<{ ok: boolean; supabaseConfigured: boolean; geminiConfigured: boolean }>('/api/health'),

  bootstrap: () => request<BootstrapPayload>('/api/bootstrap'),

  login: (email: string, password: string) =>
    request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { email: string; name: string; password: string; department: string }) =>
    request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  demoSession: (role: UserRole) =>
    request<{ user: UserProfile; token: string }>('/api/auth/demo-session', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  createBooking: (payload: {
    equipmentId: string;
    projectId: string;
    date: string;
    startHour: number;
    durationHours: number;
    submitToFairSlotOnConflict?: boolean;
  }) =>
    request<{ booking?: Booking; fairSlotSubmitted?: boolean; conflictCase?: FairSlotConflictCase }>(
      '/api/bookings',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),

  cancelBooking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${id}/cancel`, { method: 'PATCH' }),

  decideApproval: (
    id: string,
    decision: 'confirmed' | 'rejected' | 'alternative_suggested',
    alternative?: Booking['suggestedAlternative'],
  ) =>
    request<{ booking: Booking }>(`/api/approvals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, alternative }),
    }),

  resolveFairSlot: (
    id: string,
    mode: 'resolved_ai' | 'overridden_faculty',
    alternativeId?: string,
  ) =>
    request<{ conflict: FairSlotConflictCase; createdBooking?: Booking }>(
      `/api/fairslot/conflicts/${id}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ mode, alternativeId }),
      },
    ),

  createProject: (payload: {
    title: string;
    grantCode: string;
    department: string;
    category: string;
    description: string;
    deadline: string;
    recommendedEquipmentIds?: string[];
    aiAnalysisSummary?: string;
  }) =>
    request<{ project: ResearchProject }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addEquipment: (payload: {
    code?: string;
    name: string;
    category: string;
    departmentId: string;
    laboratoryId: string;
    hourlyRate: number;
    requiresFacultyApproval: boolean;
    certificationRequired: string;
    description: string;
    specsPreview: string;
  }) =>
    request<{ equipment: Equipment }>('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateEquipmentStatus: (id: string, status: Equipment['status']) =>
    request<{ equipment: Equipment }>(`/api/equipment/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  addDepartment: (payload: { name: string; code: string; headName: string }) =>
    request<{ department: Department }>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addLaboratory: (payload: {
    name: string;
    departmentId: string;
    building: string;
    room: string;
    capacity: number;
    managerName: string;
  }) =>
    request<{ laboratory: Laboratory }>('/api/laboratories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUserRole: (id: string, role: UserRole) =>
    request<{ user: UserProfile }>(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  addMaintenance: (payload: {
    equipmentId: string;
    technician: string;
    taskTitle: string;
    status: MaintenanceLog['status'];
    scheduledDate: string;
    notes: string;
  }) =>
    request<{ maintenance: MaintenanceLog }>('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),

  // Server-side Gemini AI endpoints
  aiDiscover: (query: string) =>
    request<{
      summary: string;
      matches: Array<{
        equipmentId: string;
        matchScore: number;
        reason: string;
        recommendedSlotHint: string;
      }>;
    }>('/api/ai/discover', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  aiProjectMatch: (payload: {
    title: string;
    department: string;
    description: string;
    deadline: string;
  }) =>
    request<{
      analysisSummary: string;
      recommendedEquipmentIds: string[];
      safetyPrerequisites: string[];
      estimatedHoursPerWeek: number;
    }>('/api/ai/project-match', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  aiFairSlotAnalyze: (conflictId: string) =>
    request<{
      fairnessScore: number;
      headlineRecommendation: string;
      explanation: string;
      recommendedPrimaryStudentId: string;
      recommendedAlternativeId: string;
      factors: Array<{ title: string; detail: string }>;
    }>(`/api/ai/fairslot/${conflictId}/analyze`, {
      method: 'POST',
    }),

  aiAssistant: (prompt: string) =>
    request<{
      answer: string;
      suggestedEquipmentIds: string[];
      safetyNote: string;
    }>('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};
