import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  Booking,
  Equipment,
  ResearchProject,
  UserProfile,
} from '../../types/lablink';
import { api } from '../../lib/api';
import {
  ClayModal,
  ClayTiltCard,
  SPRING_TACTILE,
  TactileButton,
} from '../motion/MotionPrimitives';

interface ProjectsViewProps {
  user: UserProfile | null;
  projects: ResearchProject[];
  equipment: Equipment[];
  onProjectCreated: (project: ResearchProject) => void;
  onSelectEquipment: (equipmentId: string) => void;
  onOpenAuth: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  user,
  projects,
  equipment,
  onProjectCreated,
  onSelectEquipment,
  onOpenAuth,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [grantCode, setGrantCode] = useState('NSF-ENG-2026');
  const [department, setDepartment] = useState(user?.department || 'Bioengineering');
  const [category, setCategory] = useState('Bioengineering');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-12-15');
  const [creating, setCreating] = useState(false);
  const [aiMatching, setAiMatching] = useState(false);
  const [aiResult, setAiResult] = useState<{
    analysisSummary: string;
    recommendedEquipmentIds: string[];
    safetyPrerequisites: string[];
    estimatedHoursPerWeek: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAiAnalyze = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Enter a project title and methodology description first so Gemini can match instruments.');
      return;
    }
    setError(null);
    setAiMatching(true);
    try {
      const res = await api.aiProjectMatch({
        title,
        department,
        description,
        deadline,
      });
      setAiResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI project analysis failed.');
    } finally {
      setAiMatching(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const res = await api.createProject({
        title,
        grantCode,
        department,
        category,
        description,
        deadline,
        recommendedEquipmentIds: aiResult?.recommendedEquipmentIds || [],
        aiAnalysisSummary: aiResult?.analysisSummary,
      });
      onProjectCreated(res.project);
      setShowModal(false);
      setTitle('');
      setDescription('');
      setAiResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#29695a]">
            03 / Research Workspace
          </span>
          <h1 className="text-3xl font-bold text-[#1d1c15]">Projects & Equipment Access</h1>
          <p className="text-sm text-[#3f4945]">
            Organize research grants, run Gemini protocol-to-instrument matching, and request lab access.
          </p>
        </div>

        <TactileButton
          variant="primary"
          onClick={() => {
            if (!user) {
              onOpenAuth();
              return;
            }
            setShowModal(true);
          }}
          className="px-6 py-3 text-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[19px]">add_circle</span>
          <span>New Research Project</span>
        </TactileButton>
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {projects.map((proj, idx) => {
            const bgClass =
              proj.tone === 'mint'
                ? 'bg-[#a8e8d5]/45'
                : proj.tone === 'blue'
                  ? 'bg-[#b0e4fd]/45'
                  : 'bg-[#ffcfd9]/45';
            const badgeClass =
              proj.tone === 'mint'
                ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                : proj.tone === 'blue'
                  ? 'bg-[#b0e4fd] text-[#32677c]'
                  : 'bg-[#ffcfd9] text-[#84515e]';
            const matchedEquip = equipment.filter((e) =>
              proj.recommendedEquipmentIds.includes(e.id),
            );

            return (
              <motion.div
                key={proj.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_TACTILE, delay: idx * 0.04 }}
              >
                <ClayTiltCard
                  tiltMax={4}
                  className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-5 h-full"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                        {proj.category}
                      </span>
                      <span className="text-xs font-semibold text-[#3f4945] tabular-nums">
                        Due {proj.deadline}
                      </span>
                    </div>

                    <div className={`${bgClass} rounded-2xl p-4 flex items-start gap-3`}>
                      <div className="w-10 h-10 rounded-full bg-[#ffffff] flex items-center justify-center shrink-0 text-[#29695a] shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">{proj.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-[#1d1c15] leading-snug">
                          {proj.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-[#3f4945] mt-0.5">
                          Grant: {proj.grantCode} · Lead: {proj.ownerName}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#3f4945] leading-relaxed">{proj.description}</p>

                    {proj.aiAnalysisSummary && (
                      <div className="bg-[#f8f3e8] rounded-2xl p-3.5 clay-well flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] text-[#29695a] shrink-0">
                          auto_awesome
                        </span>
                        <p className="text-xs text-[#1d1c15] leading-relaxed">
                          {proj.aiAnalysisSummary}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4945]">
                        Matched Instruments ({matchedEquip.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedEquip.length > 0 ? (
                          matchedEquip.map((eq) => (
                            <button
                              key={eq.id}
                              type="button"
                              onClick={() => onSelectEquipment(eq.id)}
                              className="px-3 py-1.5 rounded-full bg-[#f8f3e8] hover:bg-[#a8e8d5] text-[#1d1c15] hover:text-[#2b6a5b] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {eq.name} →
                            </button>
                          ))
                        ) : (
                          <button
                            type="button"
                            onClick={() => equipment[0] && onSelectEquipment(equipment[0].id)}
                            className="px-3 py-1.5 rounded-full bg-[#f8f3e8] text-xs font-semibold text-[#29695a] cursor-pointer"
                          >
                            Browse Catalog →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-[#e7e2d7]">
                    <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                      <span className="text-[#3f4945]">Milestone Progress</span>
                      <span className="text-[#29695a]">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#f8f3e8] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#29695a]"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </ClayTiltCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <ClayModal
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidthClass="max-w-lg"
        ariaLabel="Create Research Project"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#29695a]">
                Project Setup
              </span>
              <h3 className="text-xl font-bold text-[#1d1c15]">New Research Project</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-full bg-[#f8f3e8] flex items-center justify-center text-[#3f4945] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <input
            required
            placeholder="Project Title (e.g., Soft Pneumatic End-Effector)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-full bg-[#f8f3e8] px-4 py-2.5 text-sm clay-well focus:outline-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              required
              placeholder="Grant Code"
              value={grantCode}
              onChange={(e) => setGrantCode(e.target.value)}
              className="rounded-full bg-[#f8f3e8] px-3.5 py-2 text-xs clay-well focus:outline-none"
            />
            <input
              required
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-full bg-[#f8f3e8] px-3.5 py-2 text-xs clay-well focus:outline-none"
            />
            <input
              required
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-full bg-[#f8f3e8] px-3.5 py-2 text-xs clay-well focus:outline-none"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full bg-[#f8f3e8] px-4 py-2.5 text-xs font-semibold clay-well"
          >
            <option value="Bioengineering">Bioengineering</option>
            <option value="Robotics">Robotics</option>
            <option value="Materials Science">Materials Science</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
          </select>

          <textarea
            required
            rows={3}
            placeholder="Describe experimental methods, sample tolerances, or compute needs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl bg-[#f8f3e8] p-4 text-sm clay-well focus:outline-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#b0e4fd]/35 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#32677c]">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Match campus instruments with Gemini AI</span>
            </div>
            <TactileButton
              type="button"
              variant="secondary"
              loading={aiMatching}
              onClick={handleAiAnalyze}
              className="px-4 py-1.5 text-xs"
            >
              Analyze Protocol
            </TactileButton>
          </div>

          {aiResult && (
            <div className="rounded-2xl bg-[#a8e8d5]/40 p-4 flex flex-col gap-2 text-xs text-[#1d1c15]">
              <p className="font-semibold text-[#2b6a5b]">
                AI Recommendation (~{aiResult.estimatedHoursPerWeek}h/week)
              </p>
              <p className="leading-relaxed">{aiResult.analysisSummary}</p>
              {aiResult.recommendedEquipmentIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {aiResult.recommendedEquipmentIds.map((id) => {
                    const eq = equipment.find((item) => item.id === id);
                    return eq ? (
                      <span
                        key={id}
                        className="px-2.5 py-1 rounded-full bg-[#ffffff] text-[#29695a] font-semibold"
                      >
                        {eq.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {aiResult.safetyPrerequisites.length > 0 && (
                <p className="text-[11px] text-[#3f4945]">
                  Prerequisites: {aiResult.safetyPrerequisites.join(' · ')}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-[#93000a] bg-[#ffdad6] rounded-2xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <TactileButton
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="px-5 py-2.5 text-xs"
            >
              Cancel
            </TactileButton>
            <TactileButton
              type="submit"
              variant="primary"
              loading={creating}
              className="px-6 py-2.5 text-xs"
            >
              Create Project & Save Matches
            </TactileButton>
          </div>
        </form>
      </ClayModal>
    </div>
  );
};

interface ReservationsViewProps {
  user: UserProfile | null;
  bookings: Booking[];
  onBookingUpdated: (booking: Booking) => void;
  onSelectEquipment: (equipmentId: string) => void;
  onNavigate: (route: string) => void;
  onOpenAuth: () => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  user,
  bookings,
  onBookingUpdated,
  onSelectEquipment,
  onNavigate,
  onOpenAuth,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | Booking['status']>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleBookings = bookings.filter((b) => {
    const scopeMatch = user?.role === 'student' ? b.userId === user.id || b.userId === 'u-maya' : true;
    const statusMatch = statusFilter === 'all' ? true : b.status === statusFilter;
    return scopeMatch && statusMatch;
  });

  const handleCancel = async (bookingId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setError(null);
    setCancellingId(bookingId);
    try {
      const res = await api.cancelBooking(bookingId);
      onBookingUpdated(res.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#29695a]">
            04 / Scheduling History
          </span>
          <h1 className="text-3xl font-bold text-[#1d1c15]">My Reservations</h1>
          <p className="text-sm text-[#3f4945]">
            Track confirmed instrument windows, pending faculty sign-offs, and FairSlot suggestions.
          </p>
        </div>

        <TactileButton
          variant="primary"
          onClick={() => onNavigate('discover')}
          className="px-6 py-3 text-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[19px]">add</span>
          <span>New Booking</span>
        </TactileButton>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: 'All Reservations' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'pending', label: 'Pending Approval' },
            { id: 'alternative_suggested', label: 'Alt Suggested' },
            { id: 'cancelled', label: 'Cancelled' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-[#a8e8d5] text-[#2b6a5b] shadow-sm'
                : 'bg-[#ffffff] text-[#3f4945] clay-button-soft'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-3 text-xs font-semibold">
          {error}
        </div>
      )}

      {visibleBookings.length === 0 ? (
        <div className="bg-[#ffffff] rounded-[2rem] p-10 clay-card text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#29695a]">event_busy</span>
          <p className="text-base font-bold text-[#1d1c15]">No matching reservations</p>
          <p className="text-sm text-[#3f4945]">
            Explore campus equipment to reserve your next laboratory slot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleBookings.map((bk) => {
            const pillClass =
              bk.status === 'confirmed'
                ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                : bk.status === 'pending'
                  ? 'bg-[#f8de91] text-[#4a3800]'
                  : bk.status === 'alternative_suggested'
                    ? 'bg-[#b0e4fd] text-[#32677c]'
                    : 'bg-[#ffd9e0] text-[#340e1b]';
            return (
              <ClayTiltCard
                key={bk.id}
                tiltMax={3}
                className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-[#1d1c15] truncate">
                        {bk.equipmentName}
                      </h3>
                      <p className="text-xs text-[#3f4945] truncate">
                        {bk.projectTitle} · Reserved by {bk.userName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${pillClass}`}>
                      {bk.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-[#f8f3e8] rounded-2xl p-4 clay-well grid grid-cols-3 gap-2 text-xs tabular-nums">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#3f4945] block">
                        Date
                      </span>
                      <span className="font-bold text-[#1d1c15]">{bk.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#3f4945] block">
                        Window
                      </span>
                      <span className="font-bold text-[#1d1c15]">
                        {String(bk.startHour).padStart(2, '0')}:00–
                        {String(bk.startHour + bk.durationHours).padStart(2, '0')}:00
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-[#3f4945] block">
                        Grant Charge
                      </span>
                      <span className="font-bold text-[#29695a]">${bk.totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {bk.suggestedAlternative && (
                    <div className="rounded-2xl bg-[#b0e4fd]/40 p-3.5 text-xs text-[#001f29] flex flex-col gap-1">
                      <span className="font-semibold">
                        Faculty Alternative Proposed: {bk.suggestedAlternative.date} at{' '}
                        {String(bk.suggestedAlternative.startHour).padStart(2, '0')}:00
                      </span>
                      <span className="opacity-85">{bk.suggestedAlternative.reason}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e7e2d7]">
                  <TactileButton
                    variant="soft"
                    onClick={() => onSelectEquipment(bk.equipmentId)}
                    className="px-4 py-2 text-xs"
                  >
                    View Instrument
                  </TactileButton>

                  {(bk.status === 'confirmed' || bk.status === 'pending') && (
                    <TactileButton
                      variant="danger"
                      loading={cancellingId === bk.id}
                      onClick={() => handleCancel(bk.id)}
                      className="px-4 py-2 text-xs"
                    >
                      Cancel Slot
                    </TactileButton>
                  )}
                </div>
              </ClayTiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
