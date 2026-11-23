import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { Equipment, Laboratory, UserProfile } from '../../types/lablink';
import { api } from '../../lib/api';
import { ClayTiltCard, SPRING_TACTILE, TactileButton } from '../motion/MotionPrimitives';

interface LabMapViewProps {
  laboratories: Laboratory[];
  equipment: Equipment[];
  onSelectEquipment: (equipmentId: string) => void;
}

export const LabMapView: React.FC<LabMapViewProps> = ({
  laboratories,
  equipment,
  onSelectEquipment,
}) => {
  const [selectedLabId, setSelectedLabId] = useState(laboratories[0]?.id || 'lab-imaging');
  const selectedLab = laboratories.find((l) => l.id === selectedLabId) || laboratories[0];
  const labInstruments = equipment.filter((e) => e.laboratoryId === selectedLab?.id);

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#29695a]">
          05 / Campus Facility Atlas
        </span>
        <h1 className="text-3xl font-bold text-[#1d1c15]">Interactive Lab Map</h1>
        <p className="text-sm text-[#3f4945]">
          Inspect live bench occupancy, room access clearances, and available instruments across campus buildings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stylized Claymorphic Campus Map */}
        <div className="lg:col-span-7 bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#1d1c15]">Main Engineering & Bio Quad</span>
            <span className="px-3 py-1 rounded-full bg-[#a8e8d5] text-[#2b6a5b] text-xs font-semibold">
              {laboratories.length} Connected Labs
            </span>
          </div>

          <div className="relative w-full h-80 sm:h-96 rounded-[1.75rem] bg-gradient-to-br from-[#fef9ee] via-[#e9f8f2] to-[#e5f4fd] clay-well overflow-hidden">
            {/* Campus decorative pathways */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full opacity-55"
              viewBox="0 0 600 380"
              preserveAspectRatio="none"
            >
              <path
                d="M 40 280 Q 180 210 310 240 T 560 120"
                fill="none"
                stroke="#ffffff"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 110 40 Q 220 170 280 340"
                fill="none"
                stroke="#ffffff"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <rect x="65" y="75" width="120" height="75" rx="22" fill="#f8f3e8" />
              <rect x="370" y="65" width="145" height="90" rx="22" fill="#f8f3e8" />
              <rect x="200" y="220" width="160" height="95" rx="22" fill="#f8f3e8" />
            </svg>

            {laboratories.map((lab) => {
              const active = lab.id === selectedLab?.id;
              const pinColor =
                lab.status === 'open'
                  ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                  : lab.status === 'high_load'
                    ? 'bg-[#b0e4fd] text-[#32677c]'
                    : 'bg-[#ffcfd9] text-[#84515e]';
              return (
                <motion.button
                  key={lab.id}
                  type="button"
                  onClick={() => setSelectedLabId(lab.id)}
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING_TACTILE}
                  style={{
                    left: `${lab.coordinates.xPercent}%`,
                    top: `${lab.coordinates.yPercent}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold shadow-md cursor-pointer transition-all ${
                    active
                      ? 'bg-[#29695a] text-[#ffffff] ring-4 ring-[#a8e8d5]/70 z-20'
                      : `${pinColor} z-10`
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  <span className="whitespace-nowrap">{lab.room}</span>
                </motion.button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[#3f4945]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a8e8d5]" /> Open Capacity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b0e4fd]" /> High Load
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffcfd9]" /> Calibrating
            </span>
          </div>
        </div>

        {/* Selected Lab Details */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {selectedLab && (
            <ClayTiltCard
              tiltMax={3}
              className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#29695a]">
                    {selectedLab.departmentName}
                  </span>
                  <h2 className="text-2xl font-bold text-[#1d1c15]">{selectedLab.name}</h2>
                  <p className="text-xs text-[#3f4945] mt-0.5">
                    {selectedLab.building} · Room {selectedLab.room}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#a8e8d5] text-[#2b6a5b] text-xs font-semibold shrink-0">
                  {selectedLab.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#f8f3e8] rounded-2xl p-4 clay-well text-xs tabular-nums">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#3f4945] block">
                    Live Occupancy
                  </span>
                  <span className="text-base font-bold text-[#1d1c15]">
                    {selectedLab.occupied} / {selectedLab.capacity} benches
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#3f4945] block">
                    Clearance
                  </span>
                  <span className="text-sm font-bold text-[#29695a]">{selectedLab.accessLevel}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f8f3e8]">
                <div className="w-10 h-10 rounded-full bg-[#b0e4fd] text-[#32677c] flex items-center justify-center font-bold text-sm">
                  {selectedLab.managerName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1d1c15]">{selectedLab.managerName}</p>
                  <p className="text-xs text-[#3f4945]">{selectedLab.managerTitle}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3f4945]">
                  Instruments in Room ({labInstruments.length})
                </span>
                {labInstruments.length > 0 ? (
                  labInstruments.map((eq) => (
                    <div
                      key={eq.id}
                      onClick={() => onSelectEquipment(eq.id)}
                      className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-[#f8f3e8] hover:bg-[#a8e8d5]/40 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1d1c15] truncate">{eq.name}</p>
                        <p className="text-xs text-[#3f4945]">{eq.nextSlotLabel}</p>
                      </div>
                      <TactileButton variant="primary" className="px-3.5 py-1.5 text-xs shrink-0">
                        Book
                      </TactileButton>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#3f4945]">
                    Inspect instruments in Discover to reserve benches in this facility.
                  </p>
                )}
              </div>
            </ClayTiltCard>
          )}
        </div>
      </div>
    </div>
  );
};

interface SettingsViewProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSwitchRole: (role: UserProfile['role']) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  onOpenAuth,
  onSwitchRole,
}) => {
  const [health, setHealth] = useState<{
    ok: boolean;
    supabaseConfigured: boolean;
    geminiConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const quotaPct = user
    ? Math.min(100, Math.round((user.usedHoursThisWeek / Math.max(1, user.weeklyQuotaHours)) * 100))
    : 0;

  return (
    <div className="flex flex-col w-full gap-8 max-w-4xl">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#29695a]">
          06 / Account & Governance
        </span>
        <h1 className="text-3xl font-bold text-[#1d1c15]">Workspace Settings</h1>
        <p className="text-sm text-[#3f4945]">
          Manage your safety certifications, weekly instrument quota, and active campus role.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#a8e8d5] text-[#2b6a5b] flex items-center justify-center text-xl font-bold">
              {user ? user.name.slice(0, 2).toUpperCase() : 'LL'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1d1c15]">{user?.name || 'Guest Researcher'}</h2>
              <p className="text-xs text-[#3f4945]">
                {user ? `${user.title} · ${user.department}` : 'Sign in to sync reservations'}
              </p>
            </div>
          </div>

          {user && (
            <>
              <div className="bg-[#f8f3e8] rounded-2xl p-4 clay-well flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold tabular-nums">
                  <span className="text-[#3f4945]">Weekly FairSlot Quota</span>
                  <span className="text-[#29695a]">
                    {user.usedHoursThisWeek}h / {user.weeklyQuotaHours}h
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#ffffff] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#29695a]"
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3f4945]">
                  Verified Certifications
                </span>
                <div className="flex flex-wrap gap-2">
                  {user.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-3 py-1 rounded-full bg-[#b0e4fd] text-[#32677c] text-xs font-semibold"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-2 flex flex-wrap gap-2">
            <TactileButton variant="primary" onClick={onOpenAuth} className="px-5 py-2.5 text-xs">
              {user ? 'Switch Account / Sign In' : 'Sign In'}
            </TactileButton>
          </div>
        </div>

        {/* Role & Integration Readiness */}
        <div className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3f4945]">
              Campus Role Preview
            </span>
            <h2 className="text-xl font-bold text-[#1d1c15]">Active Persona</h2>
            <p className="text-xs text-[#3f4945] mt-1">
              Test Student booking, Faculty approval & FairSlot override, or Admin inventory controls.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['student', 'faculty', 'admin'] as const).map((r) => (
              <TactileButton
                key={r}
                variant={user?.role === r ? 'primary' : 'soft'}
                onClick={() => onSwitchRole(r)}
                className="py-2.5 text-xs capitalize"
              >
                {r}
              </TactileButton>
            ))}
          </div>

          <div className="bg-[#f8f3e8] rounded-2xl p-4 clay-well flex flex-col gap-2.5 text-xs">
            <span className="font-bold text-[#1d1c15]">Platform Services</span>
            <div className="flex items-center justify-between">
              <span className="text-[#3f4945]">Server-side Gemini AI</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold ${
                  health?.geminiConfigured
                    ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                    : 'bg-[#f8de91] text-[#4a3800]'
                }`}
              >
                {health?.geminiConfigured ? 'Connected' : 'Configure GEMINI_API_KEY'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#3f4945]">Supabase PostgreSQL Sync</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold ${
                  health?.supabaseConfigured
                    ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                    : 'bg-[#b0e4fd] text-[#32677c]'
                }`}
              >
                {health?.supabaseConfigured ? 'Connected' : 'Local Store + SQL Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
