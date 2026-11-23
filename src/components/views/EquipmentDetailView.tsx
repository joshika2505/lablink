import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type {
  Booking,
  Equipment,
  FairSlotConflictCase,
  Laboratory,
  ResearchProject,
  UserProfile,
} from '../../types/lablink';
import { api } from '../../lib/api';
import { ClayEquipmentArtwork } from '../clay/ClayEquipmentArtwork';
import { ClayTiltCard, SPRING_TACTILE, TactileButton } from '../motion/MotionPrimitives';
import { BookingConfirmationModal } from '../motion/BookingConfirmationModal';

interface EquipmentDetailViewProps {
  equipment: Equipment;
  laboratory?: Laboratory;
  projects: ResearchProject[];
  bookings: Booking[];
  user: UserProfile | null;
  onBack: () => void;
  onOpenAuth: () => void;
  onBookingCreated: (booking: Booking) => void;
  onConflictSubmitted: (conflict: FairSlotConflictCase) => void;
  onNavigate: (route: string) => void;
}

const TIME_SLOTS = [
  { label: '09:00 AM', hour: 9 },
  { label: '11:00 AM', hour: 11 },
  { label: '02:00 PM', hour: 14 },
  { label: '04:00 PM', hour: 16 },
];

export const EquipmentDetailView: React.FC<EquipmentDetailViewProps> = ({
  equipment,
  laboratory,
  projects,
  bookings,
  user,
  onBack,
  onOpenAuth,
  onBookingCreated,
  onConflictSubmitted,
  onNavigate,
}) => {
  const [favorited, setFavorited] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [selectedHour, setSelectedHour] = useState(11);
  const [durationHours, setDurationHours] = useState(2);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 'proj-crispr');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictPrompt, setConflictPrompt] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const calendarDays = useMemo(() => {
    return Array.from({ length: 14 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() + idx);
      const iso = d.toISOString().slice(0, 10);
      const dayBookings = bookings.filter(
        (b) =>
          b.equipmentId === equipment.id &&
          b.date === iso &&
          (b.status === 'confirmed' || b.status === 'pending'),
      );
      return {
        offset: idx,
        iso,
        dayNum: d.getDate(),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        bookedCount: dayBookings.length,
      };
    });
  }, [bookings, equipment.id]);

  const activeDate = calendarDays[selectedDayOffset]?.iso || calendarDays[0].iso;

  const isHourOccupied = (hour: number, dur: number) => {
    const reqEnd = hour + dur;
    return bookings.some((b) => {
      if (b.equipmentId !== equipment.id || b.date !== activeDate) return false;
      if (b.status !== 'confirmed' && b.status !== 'pending') return false;
      const bEnd = b.startHour + b.durationHours;
      return hour < bEnd && b.startHour < reqEnd;
    });
  };

  const selectedSlotOccupied = isHourOccupied(selectedHour, durationHours);
  const totalCost = equipment.hourlyRate * durationHours;

  const handleBook = async (submitToFairSlot = false) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.createBooking({
        equipmentId: equipment.id,
        projectId: selectedProjectId,
        date: activeDate,
        startHour: selectedHour,
        durationHours,
        submitToFairSlotOnConflict: submitToFairSlot,
      });

      if (res.fairSlotSubmitted && res.conflictCase) {
        setConflictPrompt(false);
        onConflictSubmitted(res.conflictCase);
        onNavigate('ai-assistant');
        return;
      }

      if (res.booking) {
        setConflictPrompt(false);
        onBookingCreated(res.booking);
        setConfirmedBooking(res.booking);
      }
    } catch (err) {
      const e = err as Error & { conflictDetected?: boolean };
      if (e.conflictDetected) {
        setConflictPrompt(true);
      }
      setError(e.message || 'Could not complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1360px] w-full mx-auto py-4">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <TactileButton variant="soft" onClick={onBack} className="px-4 py-1.5 text-xs">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Discover</span>
          </TactileButton>
          <span className="text-[#707975]">/</span>
          <span className="text-[#2f6579] font-semibold">{equipment.category}</span>
          <span className="text-[#707975]">/</span>
          <span className="font-semibold text-[#1d1c15] truncate">{equipment.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <TactileButton
            variant="soft"
            aria-label="Save equipment"
            onClick={() => setFavorited((f) => !f)}
            className={`w-10 h-10 p-0 ${favorited ? 'text-[#82505d]' : 'text-[#3f4945]'}`}
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </TactileButton>
        </div>
      </div>

      {/* 12-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8 min-w-0">
          {/* Equipment Visual Card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING_TACTILE}
            className="bg-[#ffffff] rounded-[2rem] p-6 clay-card"
          >
            <div className="relative w-full h-72 sm:h-88 rounded-[1.5rem] overflow-hidden mb-6">
              <ClayEquipmentArtwork theme={equipment.clayTheme} />
              <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                    equipment.status === 'available'
                      ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                      : 'bg-[#ffd9e0] text-[#673946]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      equipment.status === 'available' ? 'bg-[#29695a]' : 'bg-[#82505d]'
                    }`}
                  />
                  {equipment.status === 'available' ? 'Available Today' : 'Active Schedule'}
                </span>
                {equipment.requiresFacultyApproval && (
                  <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#ffffff]/95 text-[#1d1c15] text-xs font-semibold shadow-sm">
                    <span className="material-symbols-outlined text-[15px] text-[#29695a]">
                      verified_user
                    </span>
                    Faculty Sign-off
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 right-4 px-3.5 py-1.5 rounded-full bg-[#ffffff]/95 text-[#1d1c15] text-xs font-semibold shadow-sm flex items-center gap-2 tabular-nums">
                <span>Calibrated {equipment.lastCalibrated}</span>
                <span className="text-[#707975]">·</span>
                <span>{equipment.totalBookings} Bookings</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#29695a] mb-1">
              <span>{equipment.code}</span>
              <span className="text-[#707975]">·</span>
              <span className="text-[#3f4945]">{equipment.biosafetyLevel}</span>
            </div>
            <h1 className="text-3xl font-bold text-[#1d1c15] mb-2">{equipment.name}</h1>
            <p className="text-base text-[#3f4945] leading-relaxed">{equipment.description}</p>
          </motion.section>

          {/* Technical Specifications Grid */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#1d1c15]">Technical Specifications</h2>
              <span className="text-xs font-semibold text-[#3f4945]">
                {equipment.specs.length} Key Parameters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {equipment.specs.map((spec) => {
                const iconBg =
                  spec.tone === 'mint'
                    ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                    : spec.tone === 'blue'
                      ? 'bg-[#b0e4fd] text-[#32677c]'
                      : spec.tone === 'pink'
                        ? 'bg-[#ffcfd9] text-[#84515e]'
                        : 'bg-[#f2ede2] text-[#1d1c15]';
                return (
                  <ClayTiltCard
                    key={spec.label}
                    tiltMax={4}
                    className="bg-[#ffffff] rounded-[1.5rem] p-4 clay-card flex items-start gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{spec.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#3f4945]">{spec.label}</p>
                      <p className="text-sm font-semibold text-[#1d1c15] truncate">{spec.value}</p>
                    </div>
                  </ClayTiltCard>
                );
              })}
            </div>
          </section>

          {/* Facility Location & Specialist */}
          <section className="bg-[#ffffff] rounded-[2rem] p-6 clay-card">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#29695a]">
                    Facility Location
                  </span>
                  <h2 className="text-2xl font-bold text-[#1d1c15] mt-1">
                    {laboratory?.name || equipment.locationLabel}
                  </h2>
                  <p className="text-sm text-[#3f4945] mt-1">
                    {laboratory ? `${laboratory.building} · ${laboratory.room}` : equipment.locationLabel}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f8f3e8] clay-well">
                  <div className="w-11 h-11 rounded-full bg-[#a8e8d5] text-[#2b6a5b] flex items-center justify-center font-bold shrink-0">
                    {(laboratory?.managerName || 'ER')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1d1c15] truncate">
                      {laboratory?.managerName || 'Dr. Elena Rostova'}
                    </p>
                    <p className="text-xs text-[#3f4945] truncate">
                      {laboratory?.managerTitle || 'Lead Specialist · Training Required'}
                    </p>
                  </div>
                  <TactileButton
                    variant="soft"
                    success={messageSent}
                    successLabel="Sent"
                    onClick={() => {
                      setMessageSent(true);
                      setTimeout(() => setMessageSent(false), 2500);
                    }}
                    className="px-4 py-1.5 text-xs"
                  >
                    Message
                  </TactileButton>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#3f4945]">
                  <span>{laboratory?.accessLevel || 'Keycard Access'}</span>
                  <span>·</span>
                  <span>Requires {equipment.certificationRequired}</span>
                </div>
              </div>

              {/* Stylized Campus Floorplan Preview */}
              <div className="md:col-span-5">
                <div className="w-full h-48 rounded-[1.5rem] bg-gradient-to-br from-[#e7f8f3] via-[#f8f3e8] to-[#dff3fd] clay-well p-4 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#29695a]">
                    <span>Campus Grid</span>
                    <span>{laboratory?.room || 'Suite B'}</span>
                  </div>
                  <div className="relative flex-1 flex items-center justify-center">
                    <div className="w-28 h-20 rounded-2xl border-2 border-dashed border-[#29695a]/40 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="w-8 h-8 rounded-full bg-[#a8e8d5] text-[#29695a] flex items-center justify-center shadow-md"
                      >
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                      </motion.div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('lab-map')}
                    className="text-xs font-semibold text-[#29695a] hover:underline text-left cursor-pointer"
                  >
                    Open Interactive Campus Lab Map →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Usage Guidelines */}
          <section className="bg-[#ffffff] rounded-[2rem] p-6 clay-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#1d1c15]">Usage Guidelines & Protocols</h2>
              <span className="px-3 py-1 rounded-full bg-[#ffcfd9] text-[#84515e] text-xs font-semibold">
                Mandatory
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {equipment.guidelines.map((g) => (
                <div
                  key={g.title}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8f3e8] clay-well"
                >
                  <span className="material-symbols-outlined text-[#29695a] text-[20px] mt-0.5">
                    {g.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1d1c15]">{g.title}</p>
                    <p className="text-xs text-[#3f4945] mt-1 leading-relaxed">{g.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Sticky Claymorphic Booking Card */}
        <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
          <div className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#29695a]">
                  Instant Reservation
                </span>
                <h2 className="text-2xl font-bold text-[#1d1c15]">Book Equipment</h2>
              </div>
              <div className="text-right tabular-nums">
                <span className="text-xl font-bold text-[#1d1c15]">${equipment.hourlyRate}</span>
                <span className="text-xs text-[#3f4945] block">/ hour</span>
              </div>
            </div>

            {/* Pastel 2-Week Calendar Picker */}
            <div className="bg-[#f8f3e8] rounded-[1.5rem] p-4 clay-well">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1d1c15]">Select Date</span>
                <span className="text-xs font-semibold text-[#29695a] tabular-nums">
                  {activeDate}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {calendarDays.map((d) => {
                  const selected = d.offset === selectedDayOffset;
                  const hasBooked = d.bookedCount > 0;
                  return (
                    <motion.button
                      key={d.iso}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setSelectedDayOffset(d.offset);
                        setError(null);
                        setConflictPrompt(false);
                      }}
                      className={`py-1.5 rounded-2xl flex flex-col items-center transition-colors cursor-pointer tabular-nums ${
                        selected
                          ? 'bg-[#a8e8d5] text-[#2b6a5b] font-bold shadow-sm'
                          : hasBooked
                            ? 'bg-[#ffd9e0] text-[#673946] font-semibold'
                            : 'bg-[#ffffff]/70 text-[#1d1c15] hover:bg-[#b0e4fd]'
                      }`}
                    >
                      <span className="text-[10px] opacity-75">{d.weekday}</span>
                      <span className="text-xs">{d.dayNum}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4 mt-3 pt-2 text-[11px] text-[#3f4945]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a8e8d5]" /> Selected
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffffff]" /> Open
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffd9e0]" /> Active Slots
                </span>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#1d1c15]">Available Time Slots</label>
                <span className="text-xs font-semibold text-[#29695a] tabular-nums">
                  {activeDate}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const occupied = isHourOccupied(slot.hour, durationHours);
                  const active = selectedHour === slot.hour;
                  return (
                    <motion.button
                      key={slot.hour}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedHour(slot.hour);
                        setError(null);
                        setConflictPrompt(isHourOccupied(slot.hour, durationHours));
                      }}
                      className={`py-2 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer tabular-nums ${
                        active && !occupied
                          ? 'bg-[#a8e8d5] text-[#2b6a5b] shadow-sm'
                          : active && occupied
                            ? 'bg-[#ffcfd9] text-[#84515e] shadow-sm'
                            : occupied
                              ? 'bg-[#f8f3e8] text-[#82505d] opacity-80 hover:bg-[#ffd9e0]'
                              : 'bg-[#f8f3e8] text-[#3f4945] hover:bg-[#b0e4fd] hover:text-[#32677c]'
                      }`}
                    >
                      {slot.label} {occupied ? '(Busy)' : ''}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-sm font-semibold text-[#1d1c15] block mb-2">Duration</label>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-[#f8f3e8] clay-well">
                {[
                  { label: '1 hr', hours: 1 },
                  { label: '2 hrs', hours: 2 },
                  { label: '4 hrs', hours: 4 },
                  { label: 'Full Day', hours: 8 },
                ].map((opt) => {
                  const active = durationHours === opt.hours;
                  return (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => {
                        setDurationHours(opt.hours);
                        setConflictPrompt(isHourOccupied(selectedHour, opt.hours));
                      }}
                      className={`py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#ffffff] text-[#1d1c15] shadow-sm'
                          : 'text-[#3f4945] hover:text-[#1d1c15]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Assignment */}
            <div>
              <label
                htmlFor="booking-project-select"
                className="text-sm font-semibold text-[#1d1c15] block mb-2"
              >
                Assign to Project / Grant
              </label>
              <div className="relative">
                <select
                  id="booking-project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full appearance-none rounded-full bg-[#f8f3e8] px-4 py-2.5 pr-10 text-sm text-[#1d1c15] clay-well focus:outline-none cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.grantCode})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[20px] text-[#3f4945] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#f8f3e8]">
              <span className="text-sm text-[#3f4945]">Estimated Grant Charge</span>
              <span className="text-xl font-bold text-[#1d1c15] tabular-nums">
                ${totalCost.toFixed(2)}
              </span>
            </div>

            {(error || selectedSlotOccupied) && (
              <div className="rounded-2xl bg-[#ffd9e0] text-[#673946] p-3.5 text-xs flex flex-col gap-2">
                <p className="font-semibold">
                  {error ||
                    'This time window already has an active reservation. You can submit an overlapping request to FairSlot AI arbitration.'}
                </p>
                {(conflictPrompt || selectedSlotOccupied) && (
                  <TactileButton
                    variant="secondary"
                    loading={submitting}
                    onClick={() => handleBook(true)}
                    className="w-full py-2 text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>Submit Conflict to FairSlot AI</span>
                  </TactileButton>
                )}
              </div>
            )}

            <TactileButton
              variant="primary"
              loading={submitting}
              disabled={equipment.status === 'maintenance'}
              onClick={() => handleBook(false)}
              className="w-full py-3.5 text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">event_available</span>
              <span>
                {equipment.status === 'maintenance'
                  ? 'Under Maintenance'
                  : equipment.requiresFacultyApproval && user?.role === 'student'
                    ? 'Request Faculty-Approved Slot'
                    : 'Confirm Booking'}
              </span>
            </TactileButton>
          </div>
        </aside>
      </div>

      <BookingConfirmationModal
        booking={confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
        onViewReservations={() => onNavigate('my-reservations')}
      />
    </div>
  );
};
