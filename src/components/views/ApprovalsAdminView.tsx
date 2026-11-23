import React, { useState } from 'react';
import type {
  Booking,
  Department,
  Equipment,
  EquipmentCategory,
  Laboratory,
  MaintenanceLog,
  UserProfile,
  UserRole,
  UtilizationAnalytics,
} from '../../types/lablink';
import { api } from '../../lib/api';
import { ClayModal, ClayTiltCard, TactileButton } from '../motion/MotionPrimitives';

interface ApprovalsAdminViewProps {
  user: UserProfile | null;
  bookings: Booking[];
  equipment: Equipment[];
  laboratories: Laboratory[];
  departments: Department[];
  maintenance: MaintenanceLog[];
  users: UserProfile[];
  analytics: UtilizationAnalytics;
  onBookingUpdated: (booking: Booking) => void;
  onEquipmentAdded: (eq: Equipment) => void;
  onEquipmentStatusUpdated: (eq: Equipment) => void;
  onDepartmentAdded: (dept: Department) => void;
  onLaboratoryAdded: (lab: Laboratory) => void;
  onMaintenanceAdded: (log: MaintenanceLog) => void;
  onUserRoleUpdated: (user: UserProfile) => void;
  onOpenAuth: () => void;
}

export const ApprovalsAdminView: React.FC<ApprovalsAdminViewProps> = ({
  user,
  bookings,
  equipment,
  laboratories,
  departments,
  maintenance,
  users,
  analytics,
  onBookingUpdated,
  onEquipmentAdded,
  onEquipmentStatusUpdated,
  onDepartmentAdded,
  onLaboratoryAdded,
  onMaintenanceAdded,
  onUserRoleUpdated,
  onOpenAuth,
}) => {
  const [adminTab, setAdminTab] = useState<
    'equipment' | 'reservations' | 'maintenance' | 'users'
  >('equipment');
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);

  // Alternative slot modal state
  const [altTargetBooking, setAltTargetBooking] = useState<Booking | null>(null);
  const [altHour, setAltHour] = useState(16);

  // Admin Modals
  const [showAddEq, setShowAddEq] = useState(false);
  const [newEqName, setNewEqName] = useState('');
  const [newEqCat, setNewEqCat] = useState<EquipmentCategory>('Research');
  const [newEqDept, setNewEqDept] = useState(departments[0]?.id || 'dept-bio');
  const [newEqLab, setNewEqLab] = useState(laboratories[0]?.id || 'lab-imaging');
  const [newEqRate, setNewEqRate] = useState(40);
  const [newEqSpecs, setNewEqSpecs] = useState('');

  const [showAddDept, setShowAddDept] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');

  const [showAddLab, setShowAddLab] = useState(false);
  const [labName, setLabName] = useState('');
  const [labDept, setLabDept] = useState(departments[0]?.id || 'dept-bio');
  const [labBuilding, setLabBuilding] = useState('');
  const [labRoom, setLabRoom] = useState('');

  const [showAddMaint, setShowAddMaint] = useState(false);
  const [maintEqId, setMaintEqId] = useState(equipment[0]?.id || '');
  const [maintTask, setMaintTask] = useState('');
  const [maintTech, setMaintTech] = useState('R. Gomez');

  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const pendingApprovals = bookings.filter((b) => b.status === 'pending');

  const handleDecision = async (
    bookingId: string,
    decision: 'confirmed' | 'rejected' | 'alternative_suggested',
    alternative?: Booking['suggestedAlternative'],
  ) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!isFacultyOrAdmin) {
      setActionError(
        'Faculty or Administrator permissions are required to approve, reject, or suggest alternative slots.',
      );
      return;
    }
    setActionError(null);
    setLoadingBookingId(bookingId);
    try {
      const res = await api.decideApproval(bookingId, decision, alternative);
      onBookingUpdated(res.booking);
      setAltTargetBooking(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval action failed.');
    } finally {
      setLoadingBookingId(null);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addEquipment({
        name: newEqName,
        category: newEqCat,
        departmentId: newEqDept,
        laboratoryId: newEqLab,
        hourlyRate: newEqRate,
        requiresFacultyApproval: true,
        certificationRequired: 'General Lab Safety',
        description: `${newEqName} shared campus instrument.`,
        specsPreview: newEqSpecs || 'Calibrated • Standard Interface',
      });
      onEquipmentAdded(res.equipment);
      setShowAddEq(false);
      setNewEqName('');
      setNewEqSpecs('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add equipment.');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addDepartment({
        name: deptName,
        code: deptCode,
        headName: deptHead,
      });
      onDepartmentAdded(res.department);
      setShowAddDept(false);
      setDeptName('');
      setDeptCode('');
      setDeptHead('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add department.');
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addLaboratory({
        name: labName,
        departmentId: labDept,
        building: labBuilding,
        room: labRoom,
        capacity: 10,
        managerName: user?.name || 'Lab Manager',
      });
      onLaboratoryAdded(res.laboratory);
      setShowAddLab(false);
      setLabName('');
      setLabBuilding('');
      setLabRoom('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add laboratory.');
    }
  };

  const handleCreateMaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addMaintenance({
        equipmentId: maintEqId || equipment[0]?.id,
        technician: maintTech,
        taskTitle: maintTask,
        status: 'in_progress',
        scheduledDate: new Date().toISOString().slice(0, 10),
        notes: 'Logged from Admin Operations console.',
      });
      onMaintenanceAdded(res.maintenance);
      setShowAddMaint(false);
      setMaintTask('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to schedule maintenance.');
    }
  };

  return (
    <div className="flex flex-col w-full gap-10">
      {/* SECTION 01: Faculty Review Queue */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#29695a]">
              <span>01. Faculty Review Queue</span>
              <span className="text-[#707975]">·</span>
              <span className="text-[#3f4945]">Spring Semester</span>
            </div>
            <h1 className="text-3xl font-bold text-[#1d1c15]">Pending Approval Requests</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#ffffff] rounded-full px-4 py-1.5 clay-card flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5b5c4]" />
              <span className="text-sm font-semibold text-[#1d1c15] tabular-nums">
                {pendingApprovals.length} Pending
              </span>
            </div>
            {!isFacultyOrAdmin && (
              <TactileButton variant="secondary" onClick={onOpenAuth} className="px-4 py-1.5 text-xs">
                Switch to Faculty / Admin
              </TactileButton>
            )}
          </div>
        </div>

        {actionError && (
          <div className="rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-3 text-xs font-semibold">
            {actionError}
          </div>
        )}

        {pendingApprovals.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pendingApprovals.map((req) => {
              const initials = req.userName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const badgeClass =
                req.urgencyTag === 'Urgent'
                  ? 'bg-[#ffd9e0] text-[#340e1b]'
                  : req.urgencyTag === 'Certified'
                    ? 'bg-[#afefdc] text-[#002019]'
                    : 'bg-[#bce9ff] text-[#001f29]';
              return (
                <ClayTiltCard
                  key={req.id}
                  tiltMax={4}
                  className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-5"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#a8e8d5] text-[#2b6a5b] font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-[#1d1c15] truncate">
                            {req.userName}
                          </h3>
                          <p className="text-xs text-[#3f4945] truncate">{req.userRoleTitle}</p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 ${badgeClass}`}
                      >
                        {req.urgencyTag || 'Routine'}
                      </span>
                    </div>

                    <div className="bg-[#f8f3e8] rounded-2xl p-4 clay-well flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4945]">
                        Project & Equipment
                      </span>
                      <p className="text-sm font-semibold text-[#1d1c15]">{req.projectTitle}</p>
                      <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold">
                        <span className="px-3 py-1 rounded-full bg-[#a8e8d5] text-[#2b6a5b]">
                          {req.equipmentName}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-[#ffffff] text-[#3f4945] tabular-nums">
                          {req.date} · {String(req.startHour).padStart(2, '0')}:00–
                          {String(req.startHour + req.durationHours).padStart(2, '0')}:00
                        </span>
                      </div>
                    </div>

                    {req.aiNote && (
                      <div className="bg-[#b0e4fd]/45 rounded-2xl p-4 flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-[#32677c] text-[20px] shrink-0">
                          auto_awesome
                        </span>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-xs font-semibold text-[#32677c]">
                            AI Scheduling Suggestion
                          </span>
                          <p className="text-xs text-[#1d1c15] leading-relaxed">{req.aiNote}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <TactileButton
                      variant="primary"
                      loading={loadingBookingId === req.id}
                      onClick={() => handleDecision(req.id, 'confirmed')}
                      className="flex-1 py-2.5 px-4 text-xs"
                    >
                      <span className="material-symbols-outlined text-[17px]">check</span>
                      <span>Approve</span>
                    </TactileButton>
                    <TactileButton
                      variant="ghost"
                      disabled={loadingBookingId === req.id}
                      onClick={() => setAltTargetBooking(req)}
                      className="py-2.5 px-4 text-xs"
                    >
                      Suggest Alt
                    </TactileButton>
                    <TactileButton
                      variant="danger"
                      aria-label="Reject request"
                      disabled={loadingBookingId === req.id}
                      onClick={() => handleDecision(req.id, 'rejected')}
                      className="w-10 h-10 p-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </TactileButton>
                  </div>
                </ClayTiltCard>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#f8f3e8] rounded-[2rem] p-8 clay-well text-center">
            <p className="text-sm font-semibold text-[#1d1c15]">
              All pending faculty approval requests have been reviewed!
            </p>
          </div>
        )}
      </section>

      {/* SECTION 02: Admin & Resource Operations */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2f6579]">
              <span>02. Admin & Resource Operations</span>
              <span className="text-[#707975]">·</span>
              <span className="text-[#3f4945]">Live Utilization</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1d1c15]">Facility Analytics & Management</h2>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#f8f3e8] p-1 rounded-full clay-well">
            {(
              [
                { id: 'equipment', label: 'Equipment' },
                { id: 'reservations', label: 'Reservations' },
                { id: 'maintenance', label: 'Maintenance' },
                { id: 'users', label: 'Users & Roles' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  adminTab === tab.id
                    ? 'bg-[#ffffff] text-[#1d1c15] shadow-sm'
                    : 'text-[#3f4945] hover:text-[#1d1c15]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Weekly Resource Utilisation Bar Chart */}
          <div className="lg:col-span-7 bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4945]">
                  Weekly Resource Utilisation
                </span>
                <h3 className="text-xl font-bold text-[#1d1c15] tabular-nums">
                  {analytics.peakCapacityPercent}% Peak Campus Capacity
                </h3>
              </div>
              <span className="bg-[#a8e8d5] text-[#2b6a5b] text-xs font-semibold px-3.5 py-1 rounded-full tabular-nums">
                {analytics.deltaVsLastWeek}
              </span>
            </div>

            <div className="w-full pt-2">
              <svg
                aria-label="Weekly Resource Utilisation Bar Chart"
                className="w-full h-48 overflow-visible"
                role="img"
                viewBox="0 0 560 190"
              >
                <g stroke="#ede8dd" strokeDasharray="4 4" strokeWidth="1">
                  <line x1="0" x2="560" y1="30" y2="30" />
                  <line x1="0" x2="560" y1="75" y2="75" />
                  <line x1="0" x2="560" y1="120" y2="120" />
                  <line x1="0" x2="560" y1="165" y2="165" />
                </g>
                {analytics.weeklyBars.map((bar, i) => {
                  const x = 24 + i * 76;
                  const h = Math.round((bar.percent / 100) * 155);
                  const y = 165 - h;
                  const fill = bar.isPeak
                    ? '#29695a'
                    : i < 2
                      ? '#a8e8d5'
                      : i < 5
                        ? '#b0e4fd'
                        : '#ffcfd9';
                  return (
                    <g key={bar.day}>
                      <rect x={x} y={y} width="44" height={h} rx="14" fill={fill} />
                      <text
                        x={x + 22}
                        y="185"
                        textAnchor="middle"
                        className="fill-[#3f4945] text-[11px] font-semibold"
                      >
                        {bar.day}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Active Instrument Split Donut */}
          <div className="lg:col-span-5 bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4945]">
                Utilisation by Lab Zone
              </span>
              <h3 className="text-xl font-bold text-[#1d1c15]">Active Instrument Split</h3>
            </div>

            <div className="flex items-center justify-around gap-4 py-2">
              <svg
                aria-label="Lab Zone Utilisation Donut Chart"
                className="w-32 h-32 shrink-0 -rotate-90"
                role="img"
                viewBox="0 0 120 120"
              >
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="46"
                  stroke="#f8f3e8"
                  strokeWidth="16"
                />
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="46"
                  stroke="#a8e8d5"
                  strokeDasharray="130 289"
                  strokeLinecap="round"
                  strokeWidth="16"
                />
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="46"
                  stroke="#b0e4fd"
                  strokeDasharray="92 289"
                  strokeDashoffset="-135"
                  strokeLinecap="round"
                  strokeWidth="16"
                />
                <circle
                  cx="60"
                  cy="60"
                  fill="none"
                  r="46"
                  stroke="#ffcfd9"
                  strokeDasharray="58 289"
                  strokeDashoffset="-232"
                  strokeLinecap="round"
                  strokeWidth="16"
                />
              </svg>

              <div className="flex flex-col gap-2.5 flex-1 tabular-nums">
                {analytics.zoneSplit.map((z) => (
                  <div key={z.zone} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: z.color }}
                      />
                      <span className="text-[#1d1c15]">{z.zone}</span>
                    </div>
                    <span className="font-semibold text-[#1d1c15]">{z.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#f8f3e8] rounded-2xl p-3.5 flex items-center justify-between text-xs tabular-nums">
              <span className="text-[#3f4945]">
                {analytics.onlineInstruments} of {analytics.totalInstruments} instruments online
              </span>
              <span className="font-semibold text-[#29695a]">{analytics.uptimePercent}% Uptime</span>
            </div>
          </div>

          {/* Left: Laboratory & Department Management */}
          <div className="lg:col-span-5 bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4945]">
                  Laboratory & Dept Management
                </span>
                <h3 className="text-xl font-bold text-[#1d1c15]">Campus Facilities</h3>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <TactileButton
                    variant="ghost"
                    onClick={() => setShowAddDept(true)}
                    className="px-3 py-1.5 text-xs"
                  >
                    + Dept
                  </TactileButton>
                  <TactileButton
                    variant="primary"
                    onClick={() => setShowAddLab(true)}
                    className="px-3 py-1.5 text-xs"
                  >
                    + Lab
                  </TactileButton>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {laboratories.slice(0, 4).map((lab) => {
                const statusClass =
                  lab.status === 'open'
                    ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                    : lab.status === 'high_load'
                      ? 'bg-[#b0e4fd] text-[#32677c]'
                      : 'bg-[#ffd9e0] text-[#340e1b]';
                return (
                  <div
                    key={lab.id}
                    className="bg-[#f8f3e8] rounded-2xl p-3.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1d1c15] truncate">
                        {lab.name} · {lab.room}
                      </p>
                      <p className="text-xs text-[#3f4945] tabular-nums">
                        {lab.occupied}/{lab.capacity} benches occupied · {lab.departmentName}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 ${statusClass}`}
                    >
                      {lab.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Equipment / Reservations / Maintenance / Users Management */}
          <div className="lg:col-span-7 bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4945]">
                  {adminTab === 'equipment'
                    ? 'Equipment Management'
                    : adminTab === 'reservations'
                      ? 'Reservations'
                      : adminTab === 'maintenance'
                        ? 'Maintenance Status'
                        : 'User & Role Management'}
                </span>
                <h3 className="text-xl font-bold text-[#1d1c15]">
                  {adminTab === 'equipment'
                    ? 'Instrument Inventory & Status'
                    : adminTab === 'reservations'
                      ? 'All Campus Bookings'
                      : adminTab === 'maintenance'
                        ? 'Active Service & Calibration'
                        : 'Campus Access Roles'}
                </h3>
              </div>

              {adminTab === 'equipment' && isAdmin && (
                <TactileButton
                  variant="primary"
                  onClick={() => setShowAddEq(true)}
                  className="px-4 py-1.5 text-xs"
                >
                  + Add Equipment
                </TactileButton>
              )}

              {adminTab === 'maintenance' && isFacultyOrAdmin && (
                <TactileButton
                  variant="secondary"
                  onClick={() => setShowAddMaint(true)}
                  className="px-4 py-1.5 text-xs"
                >
                  + Log Service
                </TactileButton>
              )}
            </div>

            {adminTab === 'equipment' && (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {equipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="bg-[#f8f3e8] rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1d1c15] truncate">{eq.name}</p>
                      <p className="text-xs text-[#3f4945] truncate">
                        {eq.locationLabel} · Calibrated {eq.lastCalibrated}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isFacultyOrAdmin ? (
                        <select
                          aria-label={`Status for ${eq.name}`}
                          value={eq.status}
                          onChange={async (e) => {
                            const updated = await api.updateEquipmentStatus(
                              eq.id,
                              e.target.value as Equipment['status'],
                            );
                            onEquipmentStatusUpdated(updated.equipment);
                          }}
                          className="rounded-full bg-[#ffffff] px-3 py-1 text-xs font-semibold text-[#1d1c15] cursor-pointer"
                        >
                          <option value="available">Operational</option>
                          <option value="in_use">In Use</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-[#a8e8d5] text-[#2b6a5b] text-xs font-semibold">
                          {eq.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'reservations' && (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {bookings.map((bk) => (
                  <div
                    key={bk.id}
                    className="bg-[#f8f3e8] rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1d1c15] truncate tabular-nums">
                        {bk.date}, {String(bk.startHour).padStart(2, '0')}:00 · {bk.equipmentName}
                      </p>
                      <p className="text-xs text-[#3f4945] truncate">
                        {bk.userName} · {bk.projectTitle}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#b0e4fd] text-[#32677c] text-xs font-semibold shrink-0">
                      {bk.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'maintenance' && (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {maintenance.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#f8f3e8] rounded-2xl p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1d1c15] truncate">
                        {log.equipmentName} · {log.taskTitle}
                      </p>
                      <p className="text-xs text-[#3f4945] truncate">
                        Technician: {log.technician} · {log.notes}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                        log.status === 'cleared'
                          ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                          : 'bg-[#ffcfd9] text-[#84515e]'
                      }`}
                    >
                      {log.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'users' && (
              <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                {users.length === 0 ? (
                  <p className="text-xs text-[#3f4945] p-3">
                    Sign in as Faculty or Admin to inspect campus user roles and certifications.
                  </p>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="bg-[#f8f3e8] rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1d1c15] truncate">{u.name}</p>
                        <p className="text-xs text-[#3f4945] truncate">
                          {u.email} · {u.department}
                        </p>
                      </div>
                      {isAdmin ? (
                        <select
                          aria-label={`Role for ${u.name}`}
                          value={u.role}
                          onChange={async (e) => {
                            const updated = await api.updateUserRole(
                              u.id,
                              e.target.value as UserRole,
                            );
                            onUserRoleUpdated(updated.user);
                          }}
                          className="rounded-full bg-[#ffffff] px-3 py-1 text-xs font-semibold text-[#1d1c15] cursor-pointer"
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-[#a8e8d5] text-[#2b6a5b] text-xs font-semibold">
                          {u.role}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Suggest Alternative Slot Modal */}
      <ClayModal
        open={Boolean(altTargetBooking)}
        onClose={() => setAltTargetBooking(null)}
        maxWidthClass="max-w-md"
        ariaLabel="Suggest Alternative Slot"
      >
        {altTargetBooking && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-[#1d1c15]">Suggest Alternative Slot</h3>
            <p className="text-xs text-[#3f4945]">
              Propose an adjusted window for {altTargetBooking.userName} on{' '}
              {altTargetBooking.equipmentName}.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#3f4945] block mb-1">
                New Start Hour ({altTargetBooking.date})
              </label>
              <select
                value={altHour}
                onChange={(e) => setAltHour(Number(e.target.value))}
                className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
              >
                {[9, 10, 12, 14, 16, 17].map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00 –{' '}
                    {String(h + altTargetBooking.durationHours).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <TactileButton
                variant="ghost"
                onClick={() => setAltTargetBooking(null)}
                className="px-4 py-2 text-xs"
              >
                Cancel
              </TactileButton>
              <TactileButton
                variant="primary"
                onClick={() =>
                  handleDecision(altTargetBooking.id, 'alternative_suggested', {
                    date: altTargetBooking.date,
                    startHour: altHour,
                    durationHours: altTargetBooking.durationHours,
                    equipmentId: altTargetBooking.equipmentId,
                    equipmentName: altTargetBooking.equipmentName,
                    reason: 'Faculty suggested off-peak maintenance-free window.',
                  })
                }
                className="px-5 py-2 text-xs"
              >
                Send Suggestion
              </TactileButton>
            </div>
          </div>
        )}
      </ClayModal>

      {/* Add Equipment Modal */}
      <ClayModal
        open={showAddEq}
        onClose={() => setShowAddEq(false)}
        maxWidthClass="max-w-md"
        ariaLabel="Add Equipment"
      >
        <form onSubmit={handleCreateEquipment} className="flex flex-col gap-3.5">
          <h3 className="text-xl font-bold text-[#1d1c15]">Add Laboratory Instrument</h3>
          <input
            required
            placeholder="Instrument Name (e.g., Bruker AFM)"
            value={newEqName}
            onChange={(e) => setNewEqName(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newEqCat}
              onChange={(e) => setNewEqCat(e.target.value as EquipmentCategory)}
              className="rounded-full bg-[#f8f3e8] px-3 py-2 text-xs clay-well"
            >
              <option value="Research">Research</option>
              <option value="Robotics">Robotics</option>
              <option value="Electronics">Electronics</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Computing">Computing</option>
              <option value="Fabrication">Fabrication</option>
            </select>
            <input
              type="number"
              min={5}
              value={newEqRate}
              onChange={(e) => setNewEqRate(Number(e.target.value))}
              placeholder="Rate $/hr"
              className="rounded-full bg-[#f8f3e8] px-3 py-2 text-xs clay-well"
            />
          </div>
          <select
            value={newEqDept}
            onChange={(e) => setNewEqDept(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-xs clay-well"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={newEqLab}
            onChange={(e) => setNewEqLab(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-xs clay-well"
          >
            {laboratories.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.room})
              </option>
            ))}
          </select>
          <input
            placeholder="Specs Preview (e.g., 1nm Z-res · Tapping Mode)"
            value={newEqSpecs}
            onChange={(e) => setNewEqSpecs(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <TactileButton type="submit" variant="primary" className="py-2.5 text-sm mt-1">
            Save Instrument
          </TactileButton>
        </form>
      </ClayModal>

      {/* Add Department Modal */}
      <ClayModal
        open={showAddDept}
        onClose={() => setShowAddDept(false)}
        maxWidthClass="max-w-md"
        ariaLabel="Add Department"
      >
        <form onSubmit={handleCreateDepartment} className="flex flex-col gap-3.5">
          <h3 className="text-xl font-bold text-[#1d1c15]">Add Academic Department</h3>
          <input
            required
            placeholder="Department Name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <input
            required
            placeholder="Code (e.g., AERO)"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <input
            required
            placeholder="Department Head"
            value={deptHead}
            onChange={(e) => setDeptHead(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <TactileButton type="submit" variant="primary" className="py-2.5 text-sm">
            Create Department
          </TactileButton>
        </form>
      </ClayModal>

      {/* Add Lab Modal */}
      <ClayModal
        open={showAddLab}
        onClose={() => setShowAddLab(false)}
        maxWidthClass="max-w-md"
        ariaLabel="Add Laboratory"
      >
        <form onSubmit={handleCreateLab} className="flex flex-col gap-3.5">
          <h3 className="text-xl font-bold text-[#1d1c15]">Add Laboratory Facility</h3>
          <input
            required
            placeholder="Laboratory Name"
            value={labName}
            onChange={(e) => setLabName(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <select
            value={labDept}
            onChange={(e) => setLabDept(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="Building"
              value={labBuilding}
              onChange={(e) => setLabBuilding(e.target.value)}
              className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
            />
            <input
              required
              placeholder="Room"
              value={labRoom}
              onChange={(e) => setLabRoom(e.target.value)}
              className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
            />
          </div>
          <TactileButton type="submit" variant="primary" className="py-2.5 text-sm">
            Create Facility
          </TactileButton>
        </form>
      </ClayModal>

      {/* Log Maintenance Modal */}
      <ClayModal
        open={showAddMaint}
        onClose={() => setShowAddMaint(false)}
        maxWidthClass="max-w-md"
        ariaLabel="Log Maintenance"
      >
        <form onSubmit={handleCreateMaint} className="flex flex-col gap-3.5">
          <h3 className="text-xl font-bold text-[#1d1c15]">Schedule Equipment Maintenance</h3>
          <select
            value={maintEqId || equipment[0]?.id}
            onChange={(e) => setMaintEqId(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          >
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Service Task (e.g., Cryogen Refill)"
            value={maintTask}
            onChange={(e) => setMaintTask(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <input
            required
            placeholder="Technician"
            value={maintTech}
            onChange={(e) => setMaintTech(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well"
          />
          <TactileButton type="submit" variant="secondary" className="py-2.5 text-sm">
            Start Maintenance Window
          </TactileButton>
        </form>
      </ClayModal>
    </div>
  );
};
