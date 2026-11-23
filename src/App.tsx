/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
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
} from './types/lablink';
import { api, setAuthToken } from './lib/api';
import { WorkspaceShell, type WorkspaceRoute } from './components/layout/WorkspaceShell';
import { LandingPage } from './components/views/LandingPage';
import { DashboardView } from './components/views/DashboardView';
import { DiscoverView } from './components/views/DiscoverView';
import { EquipmentDetailView } from './components/views/EquipmentDetailView';
import { FairSlotView } from './components/views/FairSlotView';
import { ApprovalsAdminView } from './components/views/ApprovalsAdminView';
import {
  ProjectsView,
  ReservationsView,
} from './components/views/ProjectsAndReservationsView';
import { LabMapView, SettingsView } from './components/views/LabMapAndSettingsView';
import { AuthModal } from './components/views/AuthModal';
import { SPRING_TACTILE } from './components/motion/MotionPrimitives';

type AppRoute = 'landing' | WorkspaceRoute;

const EMPTY_ANALYTICS: UtilizationAnalytics = {
  peakCapacityPercent: 84.2,
  deltaVsLastWeek: '+6.4% vs last wk',
  weeklyBars: [
    { day: 'Mon', percent: 58 },
    { day: 'Tue', percent: 68 },
    { day: 'Wed', percent: 92, isPeak: true },
    { day: 'Thu', percent: 74 },
    { day: 'Fri', percent: 64 },
    { day: 'Sat', percent: 38 },
    { day: 'Sun', percent: 30 },
  ],
  zoneSplit: [
    { zone: 'Imaging', percent: 45, color: '#a8e8d5' },
    { zone: 'Spectroscopy', percent: 32, color: '#b0e4fd' },
    { zone: 'Wet Labs', percent: 23, color: '#ffcfd9' },
  ],
  onlineInstruments: 18,
  totalInstruments: 22,
  uptimePercent: 98.4,
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>('landing');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('eq-zeiss-lsm');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [conflicts, setConflicts] = useState<FairSlotConflictCase[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [analytics, setAnalytics] = useState<UtilizationAnalytics>(EMPTY_ANALYTICS);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const loadBootstrap = useCallback(async () => {
    try {
      const data = await api.bootstrap();
      if (data.user) setUser(data.user);
      setDepartments(data.departments);
      setLaboratories(data.laboratories);
      setEquipment(data.equipment);
      setProjects(data.projects);
      setBookings(data.bookings);
      setConflicts(data.conflicts);
      setMaintenance(data.maintenance);
      setNotifications(data.notifications);
      setAnalytics(data.analytics);
      setUsers(data.users || []);
      if (data.equipment[0] && !selectedEquipmentId) {
        setSelectedEquipmentId(data.equipment[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedEquipmentId]);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const ensureDemoSession = useCallback(
    async (preferredRole: UserRole = 'student') => {
      if (user) return user;
      const res = await api.demoSession(preferredRole);
      setAuthToken(res.token);
      setUser(res.user);
      await loadBootstrap();
      return res.user;
    },
    [user, loadBootstrap],
  );

  const handleNavigate = useCallback(
    (nextRoute: string, eqId?: string) => {
      if (eqId) setSelectedEquipmentId(eqId);
      setRoute(nextRoute as AppRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [],
  );

  const handleEnterWorkspace = useCallback(
    async (targetRoute?: string, eqId?: string) => {
      const resolved = (targetRoute as AppRoute) || 'dashboard';
      const preferredRole: UserRole = resolved === 'approvals' ? 'faculty' : 'student';
      try {
        await ensureDemoSession(preferredRole);
      } catch {
        // Proceed with catalog browsing even if demo session call fails
      }
      if (eqId) setSelectedEquipmentId(eqId);
      setRoute(resolved);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [ensureDemoSession],
  );

  const handleSwitchRole = async (role: UserRole) => {
    const res = await api.demoSession(role);
    setAuthToken(res.token);
    setUser(res.user);
    await loadBootstrap();
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.markNotificationRead(id);
    } catch {
      // Ignore network hiccup for read toggle
    }
  };

  const selectedEquipment =
    equipment.find((e) => e.id === selectedEquipmentId) || equipment[0];
  const selectedLab = laboratories.find((l) => l.id === selectedEquipment?.laboratoryId);
  const pendingApprovalsCount = bookings.filter((b) => b.status === 'pending').length;
  const openConflictsCount = conflicts.filter((c) => c.status === 'open').length;

  const fallbackStudent: UserProfile = user || {
    id: 'guest',
    email: 'guest@lablink.edu',
    name: 'Alex Rivera',
    role: 'student',
    department: 'Bioengineering',
    title: 'Research Fellow',
    weeklyQuotaHours: 8,
    usedHoursThisWeek: 2,
    certifications: ['Biosafety Level 1', 'General Lab Safety'],
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#fef9ee] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-[#a8e8d5] clay-card flex items-center justify-center text-[#29695a] animate-pulse">
          <span className="material-symbols-outlined text-3xl">science</span>
        </div>
        <p className="text-sm font-semibold text-[#3f4945]">Loading LabLink Campus Network...</p>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {route === 'landing' ? (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <LandingPage
              equipment={equipment}
              departments={departments}
              onEnterWorkspace={handleEnterWorkspace}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="workspace-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <WorkspaceShell
              activeRoute={route}
              user={user}
              notifications={notifications}
              pendingApprovalsCount={pendingApprovalsCount}
              openConflictsCount={openConflictsCount}
              onNavigate={(next) => handleNavigate(next)}
              onBackToLanding={() => handleNavigate('landing')}
              onOpenAuth={() => setAuthModalOpen(true)}
              onMarkNotificationRead={handleMarkNotificationRead}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${route}-${route === 'equipment-detail' ? selectedEquipmentId : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={SPRING_TACTILE}
                >
                  {route === 'dashboard' && (
                    <DashboardView
                      user={fallbackStudent}
                      equipment={equipment}
                      projects={projects}
                      bookings={bookings}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {route === 'discover' && (
                    <DiscoverView
                      equipment={equipment}
                      onSelectEquipment={(id) => handleNavigate('equipment-detail', id)}
                    />
                  )}

                  {route === 'equipment-detail' && selectedEquipment && (
                    <EquipmentDetailView
                      equipment={selectedEquipment}
                      laboratory={selectedLab}
                      projects={projects}
                      bookings={bookings}
                      user={user}
                      onBack={() => handleNavigate('discover')}
                      onOpenAuth={() => setAuthModalOpen(true)}
                      onBookingCreated={(bk) => {
                        setBookings((prev) => [bk, ...prev]);
                        loadBootstrap();
                      }}
                      onConflictSubmitted={(conflict) => {
                        setConflicts((prev) => [conflict, ...prev]);
                      }}
                      onNavigate={handleNavigate}
                    />
                  )}

                  {route === 'my-reservations' && (
                    <ReservationsView
                      user={user}
                      bookings={bookings}
                      onBookingUpdated={(bk) =>
                        setBookings((prev) => prev.map((b) => (b.id === bk.id ? bk : b)))
                      }
                      onSelectEquipment={(id) => handleNavigate('equipment-detail', id)}
                      onNavigate={handleNavigate}
                      onOpenAuth={() => setAuthModalOpen(true)}
                    />
                  )}

                  {route === 'projects' && (
                    <ProjectsView
                      user={user}
                      projects={projects}
                      equipment={equipment}
                      onProjectCreated={(proj) => setProjects((prev) => [proj, ...prev])}
                      onSelectEquipment={(id) => handleNavigate('equipment-detail', id)}
                      onOpenAuth={() => setAuthModalOpen(true)}
                    />
                  )}

                  {route === 'ai-assistant' && (
                    <FairSlotView
                      conflicts={conflicts}
                      equipment={equipment}
                      user={user}
                      onConflictResolved={(updatedConflict, createdBooking) => {
                        setConflicts((prev) =>
                          prev.map((c) => (c.id === updatedConflict.id ? updatedConflict : c)),
                        );
                        if (createdBooking) {
                          setBookings((prev) => [createdBooking, ...prev]);
                        }
                        loadBootstrap();
                      }}
                      onNavigate={handleNavigate}
                      onOpenAuth={() => setAuthModalOpen(true)}
                    />
                  )}

                  {route === 'approvals' && (
                    <ApprovalsAdminView
                      user={user}
                      bookings={bookings}
                      equipment={equipment}
                      laboratories={laboratories}
                      departments={departments}
                      maintenance={maintenance}
                      users={users}
                      analytics={analytics}
                      onBookingUpdated={(bk) =>
                        setBookings((prev) => prev.map((b) => (b.id === bk.id ? bk : b)))
                      }
                      onEquipmentAdded={(eq) => setEquipment((prev) => [eq, ...prev])}
                      onEquipmentStatusUpdated={(eq) =>
                        setEquipment((prev) => prev.map((item) => (item.id === eq.id ? eq : item)))
                      }
                      onDepartmentAdded={(dept) => setDepartments((prev) => [...prev, dept])}
                      onLaboratoryAdded={(lab) => setLaboratories((prev) => [...prev, lab])}
                      onMaintenanceAdded={(log) => setMaintenance((prev) => [log, ...prev])}
                      onUserRoleUpdated={(u) =>
                        setUsers((prev) => prev.map((item) => (item.id === u.id ? u : item)))
                      }
                      onOpenAuth={() => setAuthModalOpen(true)}
                    />
                  )}

                  {route === 'lab-map' && (
                    <LabMapView
                      laboratories={laboratories}
                      equipment={equipment}
                      onSelectEquipment={(id) => handleNavigate('equipment-detail', id)}
                    />
                  )}

                  {route === 'settings' && (
                    <SettingsView
                      user={user}
                      onOpenAuth={() => setAuthModalOpen(true)}
                      onSwitchRole={handleSwitchRole}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </WorkspaceShell>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={(authedUser) => {
          setUser(authedUser);
          loadBootstrap();
        }}
      />
    </MotionConfig>
  );
}
