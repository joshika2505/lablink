import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  requireAuth,
  requireRole,
  resolveAuthFromRequest,
  signSessionToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth.js';
import { db } from './server/db.js';
import {
  analyzeProjectWithAI,
  askLabAssistantWithAI,
  discoverEquipmentWithAI,
  evaluateFairSlotWithAI,
} from './server/gemini.js';
import type { EquipmentCategory, UserRole } from './src/types/lablink.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      geminiConfigured: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
      ),
    });
  });

  // Authentication endpoints
  app.post('/api/auth/login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const user = db.findUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const publicUser = db.toPublicUser(user);
    const token = signSessionToken(publicUser);
    res.json({ user: publicUser, token });
  });

  app.post('/api/auth/register', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const department =
      typeof req.body?.department === 'string' ? req.body.department.trim() : 'Bioengineering';

    if (!email || !name || password.length < 6) {
      res.status(400).json({
        error: 'Please provide your name, university email, and a password of at least 6 characters.',
      });
      return;
    }
    try {
      const publicUser = db.createUser({ email, name, password, department, role: 'student' });
      const token = signSessionToken(publicUser);
      res.status(201).json({ user: publicUser, token });
    } catch (err) {
      res.status(409).json({ error: err instanceof Error ? err.message : 'Registration failed.' });
    }
  });

  app.post('/api/auth/demo-session', (req, res) => {
    const requestedRole = req.body?.role as UserRole | undefined;
    const roleMap: Record<UserRole, string> = {
      student: 'alex.rivera@lablink.edu',
      faculty: 'elena.rostova@lablink.edu',
      admin: 'marcus.chen@lablink.edu',
    };
    const email = roleMap[requestedRole || 'student'] || roleMap.student;
    const user = db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'Workspace persona not found.' });
      return;
    }
    const publicUser = db.toPublicUser(user);
    const token = signSessionToken(publicUser);
    res.json({ user: publicUser, token });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = db.findUserById(req.authUser!.sub);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }
    res.json({ user: db.toPublicUser(user) });
  });

  // Bootstrap data (catalog is public; bookings/notifications tailored to auth user)
  app.get('/api/bootstrap', async (req, res) => {
    const authUser = await resolveAuthFromRequest(req);
    const user = authUser ? db.findUserById(authUser.sub) : undefined;
    res.json({
      user: user ? db.toPublicUser(user) : null,
      departments: db.getDepartments(),
      laboratories: db.getLaboratories(),
      equipment: db.getEquipment(),
      projects: db.getProjects(authUser?.sub, authUser?.role),
      bookings: db.getBookings(),
      conflicts: db.getConflicts(),
      maintenance: db.getMaintenance(),
      notifications: authUser ? db.getNotifications(authUser.sub) : [],
      analytics: db.getAnalytics(),
      users:
        authUser && (authUser.role === 'admin' || authUser.role === 'faculty')
          ? db.getPublicUsers()
          : [],
    });
  });

  // Equipment, Departments & Labs
  app.get('/api/equipment', (_req, res) => {
    res.json({ equipment: db.getEquipment() });
  });

  app.post('/api/equipment', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res) => {
    const {
      code,
      name,
      category,
      departmentId,
      laboratoryId,
      hourlyRate,
      requiresFacultyApproval,
      certificationRequired,
      description,
      specsPreview,
    } = req.body ?? {};

    if (!name || !category || !departmentId || !laboratoryId) {
      res.status(400).json({ error: 'Name, category, department, and laboratory are required.' });
      return;
    }
    const dept = db.getDepartments().find((d) => d.id === departmentId);
    const lab = db.getLaboratories().find((l) => l.id === laboratoryId);
    if (!dept || !lab) {
      res.status(400).json({ error: 'Invalid department or laboratory selection.' });
      return;
    }

    const themeMap: Record<EquipmentCategory, 'robot' | 'oscilloscope' | 'cnc' | 'microscope' | 'compute' | 'printer'> = {
      Robotics: 'robot',
      Electronics: 'oscilloscope',
      Manufacturing: 'cnc',
      Research: 'microscope',
      Computing: 'compute',
      Fabrication: 'printer',
    };

    const created = db.addEquipment({
      code: String(code || `EQ-${Math.floor(1000 + Math.random() * 9000)}`),
      name: String(name).trim(),
      category: category as EquipmentCategory,
      departmentId: dept.id,
      departmentName: dept.name,
      laboratoryId: lab.id,
      locationLabel: `${lab.name}, ${lab.room}`,
      status: 'available',
      hourlyRate: Number(hourlyRate) || 35,
      requiresFacultyApproval: Boolean(requiresFacultyApproval),
      certificationRequired: String(certificationRequired || 'General Lab Safety'),
      biosafetyLevel: 'Campus Standard',
      nextSlotLabel: 'Today, 1:00 PM',
      lastCalibrated: 'Today',
      description: String(description || 'Shared campus research instrument.'),
      specsPreview: String(specsPreview || 'Calibrated • Standard Lab Interface'),
      specs: [
        { label: 'Category', value: String(category), icon: 'science', tone: 'mint' },
        { label: 'Facility', value: `${lab.building} ${lab.room}`, icon: 'location_on', tone: 'blue' },
        {
          label: 'Certification',
          value: String(certificationRequired || 'General Lab Safety'),
          icon: 'verified_user',
          tone: 'pink',
        },
      ],
      guidelines: [
        {
          title: 'Safety Protocol',
          detail: 'Verify lab certification and log sample metadata before start.',
          icon: 'school',
        },
      ],
      imageUrl: '',
      clayTheme: themeMap[category as EquipmentCategory] || 'microscope',
    });

    res.status(201).json({ equipment: created });
  });

  app.patch(
    '/api/equipment/:id/status',
    requireAuth,
    requireRole('admin', 'faculty'),
    (req: AuthenticatedRequest, res) => {
      const status = req.body?.status;
      if (status !== 'available' && status !== 'in_use' && status !== 'maintenance') {
        res.status(400).json({ error: 'Invalid equipment status.' });
        return;
      }
      try {
        const updated = db.updateEquipmentStatus(String(req.params.id), status);
        res.json({ equipment: updated });
      } catch (err) {
        res.status(404).json({ error: err instanceof Error ? err.message : 'Not found' });
      }
    },
  );

  app.post('/api/departments', requireAuth, requireRole('admin'), (req, res) => {
    const { name, code, headName } = req.body ?? {};
    if (!name || !code) {
      res.status(400).json({ error: 'Department name and code are required.' });
      return;
    }
    const created = db.addDepartment({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      headName: String(headName || 'Faculty Chair'),
      instrumentCount: 0,
      uptimePercent: 99.0,
      accentColor: 'mint',
      icon: 'science',
    });
    res.status(201).json({ department: created });
  });

  app.post('/api/laboratories', requireAuth, requireRole('admin'), (req, res) => {
    const { name, departmentId, building, room, capacity, managerName } = req.body ?? {};
    if (!name || !departmentId || !building || !room) {
      res.status(400).json({ error: 'Name, department, building, and room are required.' });
      return;
    }
    const dept = db.getDepartments().find((d) => d.id === departmentId);
    if (!dept) {
      res.status(400).json({ error: 'Department not found.' });
      return;
    }
    const created = db.addLaboratory({
      name: String(name).trim(),
      departmentId: dept.id,
      departmentName: dept.name,
      building: String(building).trim(),
      room: String(room).trim(),
      accessLevel: 'Keycard Access',
      capacity: Number(capacity) || 8,
      occupied: 0,
      status: 'open',
      managerName: String(managerName || dept.headName),
      managerTitle: 'Laboratory Coordinator',
      coordinates: { lat: 42.361, lng: -71.09, xPercent: 50, yPercent: 50 },
    });
    res.status(201).json({ laboratory: created });
  });

  // Projects
  app.get('/api/projects', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ projects: db.getProjects(req.authUser!.sub, req.authUser!.role) });
  });

  app.post('/api/projects', requireAuth, (req: AuthenticatedRequest, res) => {
    const { title, grantCode, department, category, description, deadline, recommendedEquipmentIds, aiAnalysisSummary } =
      req.body ?? {};
    if (!title || !description || !deadline) {
      res.status(400).json({ error: 'Project title, description, and deadline are required.' });
      return;
    }
    const created = db.createProject({
      ownerId: req.authUser!.sub,
      ownerName: req.authUser!.name,
      title: String(title).trim(),
      grantCode: String(grantCode || 'DEPT-2026').trim(),
      department: String(department || 'Bioengineering'),
      category: String(category || 'Research'),
      description: String(description).trim(),
      deadline: String(deadline),
      progress: 15,
      tone: 'mint',
      icon: 'science',
      recommendedEquipmentIds: Array.isArray(recommendedEquipmentIds) ? recommendedEquipmentIds : [],
      aiAnalysisSummary: typeof aiAnalysisSummary === 'string' ? aiAnalysisSummary : undefined,
      status: 'active',
    });
    res.status(201).json({ project: created });
  });

  // Bookings & Atomic Conflict Prevention
  app.get('/api/bookings', (_req, res) => {
    res.json({ bookings: db.getBookings() });
  });

  app.post('/api/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
    const { equipmentId, projectId, date, startHour, durationHours, submitToFairSlotOnConflict } =
      req.body ?? {};
    const parsedStart = Number(startHour);
    const parsedDuration = Number(durationHours);

    if (
      !equipmentId ||
      !date ||
      !Number.isInteger(parsedStart) ||
      parsedStart < 7 ||
      parsedStart > 21 ||
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 8
    ) {
      res.status(400).json({ error: 'Invalid equipment, date, start time, or duration.' });
      return;
    }

    try {
      const result = db.createBookingAtomic({
        equipmentId: String(equipmentId),
        userId: req.authUser!.sub,
        projectId: String(projectId || 'proj-crispr'),
        date: String(date),
        startHour: parsedStart,
        durationHours: parsedDuration,
        submitToFairSlotOnConflict: Boolean(submitToFairSlotOnConflict),
      });

      if (result.conflictError) {
        res.status(409).json({ error: result.conflictError, conflictDetected: true });
        return;
      }

      if (result.conflictCase) {
        res.status(202).json({
          fairSlotSubmitted: true,
          conflictCase: result.conflictCase,
          message: 'Slot conflict submitted to FairSlot AI for Faculty arbitration.',
        });
        return;
      }

      res.status(201).json({ booking: result.booking });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Booking failed.' });
    }
  });

  app.patch('/api/bookings/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    try {
      const booking = db.cancelBooking(
        String(req.params.id),
        req.authUser!.sub,
        req.authUser!.role,
      );
      res.json({ booking });
    } catch (err) {
      res.status(403).json({ error: err instanceof Error ? err.message : 'Cancel failed.' });
    }
  });

  // Faculty Approvals (Faculty / Admin only)
  app.patch(
    '/api/approvals/:id',
    requireAuth,
    requireRole('faculty', 'admin'),
    (req: AuthenticatedRequest, res) => {
      const decision = req.body?.decision;
      if (
        decision !== 'confirmed' &&
        decision !== 'rejected' &&
        decision !== 'alternative_suggested'
      ) {
        res.status(400).json({ error: 'Invalid approval decision.' });
        return;
      }
      try {
        const booking = db.decideBooking(
          String(req.params.id),
          decision,
          req.authUser!.name,
          req.body?.alternative,
        );
        res.json({ booking });
      } catch (err) {
        res.status(409).json({ error: err instanceof Error ? err.message : 'Decision failed.' });
      }
    },
  );

  // FairSlot Conflicts (AI advises; Faculty/Admin retain final approval & override authority)
  app.get('/api/fairslot/conflicts', (_req, res) => {
    res.json({ conflicts: db.getConflicts() });
  });

  app.post(
    '/api/fairslot/conflicts/:id/resolve',
    requireAuth,
    requireRole('faculty', 'admin'),
    (req: AuthenticatedRequest, res) => {
      const mode = req.body?.mode === 'overridden_faculty' ? 'overridden_faculty' : 'resolved_ai';
      const alternativeId =
        typeof req.body?.alternativeId === 'string' ? req.body.alternativeId : undefined;
      try {
        const result = db.resolveConflict(
          String(req.params.id),
          mode,
          alternativeId,
          req.authUser!.name,
        );
        res.json(result);
      } catch (err) {
        res.status(404).json({ error: err instanceof Error ? err.message : 'Conflict not found.' });
      }
    },
  );

  // Admin User & Role Management
  app.get('/api/users', requireAuth, requireRole('admin', 'faculty'), (_req, res) => {
    res.json({ users: db.getPublicUsers() });
  });

  app.patch('/api/users/:id/role', requireAuth, requireRole('admin'), (req, res) => {
    const role = req.body?.role as UserRole;
    if (role !== 'student' && role !== 'faculty' && role !== 'admin') {
      res.status(400).json({ error: 'Invalid role.' });
      return;
    }
    try {
      const user = db.updateUserRole(String(req.params.id), role);
      res.json({ user });
    } catch (err) {
      res.status(404).json({ error: err instanceof Error ? err.message : 'User not found.' });
    }
  });

  // Maintenance
  app.get('/api/maintenance', (_req, res) => {
    res.json({ maintenance: db.getMaintenance() });
  });

  app.post(
    '/api/maintenance',
    requireAuth,
    requireRole('admin', 'faculty'),
    (req, res) => {
      const { equipmentId, technician, taskTitle, status, scheduledDate, notes } = req.body ?? {};
      const eq = db.getEquipmentById(String(equipmentId));
      if (!eq || !taskTitle) {
        res.status(400).json({ error: 'Valid equipment and task title are required.' });
        return;
      }
      const log = db.addMaintenance({
        equipmentId: eq.id,
        equipmentName: eq.name,
        technician: String(technician || 'Lab Engineering'),
        taskTitle: String(taskTitle).trim(),
        status: status === 'in_progress' || status === 'cleared' ? status : 'scheduled',
        scheduledDate: String(scheduledDate || new Date().toISOString().slice(0, 10)),
        notes: String(notes || ''),
      });
      res.status(201).json({ maintenance: log });
    },
  );

  // Notifications
  app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ notifications: db.getNotifications(req.authUser!.sub) });
  });

  app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
    db.markNotificationRead(String(req.params.id));
    res.json({ ok: true });
  });

  app.get('/api/analytics', (_req, res) => {
    res.json({ analytics: db.getAnalytics() });
  });

  // Server-Side Google Gemini API Routes
  app.post('/api/ai/discover', async (req, res) => {
    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!query) {
      res.status(400).json({ error: 'Please describe what you need for your experiment.' });
      return;
    }
    try {
      const result = await discoverEquipmentWithAI(query, db.getEquipment());
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Gemini AI discovery request failed.',
      });
    }
  });

  app.post('/api/ai/project-match', requireAuth, async (req, res) => {
    const { title, department, description, deadline } = req.body ?? {};
    if (!title || !description) {
      res.status(400).json({ error: 'Project title and description are required for AI analysis.' });
      return;
    }
    try {
      const result = await analyzeProjectWithAI(
        {
          title: String(title),
          department: String(department || 'Bioengineering'),
          description: String(description),
          deadline: String(deadline || 'Flexible'),
        },
        db.getEquipment(),
      );
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Gemini AI project analysis failed.',
      });
    }
  });

  app.post('/api/ai/fairslot/:id/analyze', requireAuth, async (req, res) => {
    const conflict = db.getConflicts().find((c) => c.id === String(req.params.id));
    if (!conflict) {
      res.status(404).json({ error: 'FairSlot conflict case not found.' });
      return;
    }
    try {
      const result = await evaluateFairSlotWithAI(conflict);
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Gemini AI FairSlot analysis failed.',
      });
    }
  });

  app.post('/api/ai/assistant', async (req, res) => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
      res.status(400).json({ error: 'Please enter a question for LabBot.' });
      return;
    }
    const authUser = await resolveAuthFromRequest(req);
    const user = authUser ? db.findUserById(authUser.sub) : undefined;
    try {
      const result = await askLabAssistantWithAI(prompt, db.getEquipment(), {
        name: user?.name || 'Campus Researcher',
        role: user?.role || 'student',
        department: user?.department || 'Bioengineering',
        certifications: user?.certifications || ['General Lab Safety'],
      });
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Gemini AI assistant request failed.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LabLink server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
