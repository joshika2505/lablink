import fs from 'node:fs';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
} from '../src/types/lablink.js';
import { hashPassword } from './auth.js';

export interface StoredUser extends UserProfile {
  passwordHash: string;
}

export interface LabLinkDatabase {
  users: StoredUser[];
  departments: Department[];
  laboratories: Laboratory[];
  equipment: Equipment[];
  projects: ResearchProject[];
  bookings: Booking[];
  conflicts: FairSlotConflictCase[];
  maintenance: MaintenanceLog[];
  notifications: AppNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'lablink-db.json');

export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getTodayDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function createInitialSeed(): LabLinkDatabase {
  const defaultPassHash = hashPassword('lablink2026');
  const today = getTodayDateString(0);
  const tomorrow = getTodayDateString(1);
  const inTwoDays = getTodayDateString(2);

  const users: StoredUser[] = [
    {
      id: 'usr-alex',
      email: 'alex.rivera@lablink.edu',
      name: 'Alex Rivera',
      role: 'student',
      department: 'Bioengineering',
      title: 'Graduate Researcher • Bioengineering',
      weeklyQuotaHours: 6,
      usedHoursThisWeek: 2.5,
      certifications: ['General Lab Safety', 'Level 2 Confocal', 'Biosafety Level 1'],
      passwordHash: defaultPassHash,
    },
    {
      id: 'usr-maya',
      email: 'maya.lin@lablink.edu',
      name: 'Maya Lin',
      role: 'student',
      department: 'Materials Science',
      title: 'PhD Candidate • Materials Science',
      weeklyQuotaHours: 6,
      usedHoursThisWeek: 2.0,
      certifications: ['General Lab Safety', 'Level 2 Confocal', 'XRD Radiation Safety'],
      passwordHash: defaultPassHash,
    },
    {
      id: 'usr-liam',
      email: 'liam.vance@lablink.edu',
      name: 'Liam Vance',
      role: 'student',
      department: 'Chemical Engineering',
      title: 'M.S. Researcher • Chemical Eng.',
      weeklyQuotaHours: 6,
      usedHoursThisWeek: 4.5,
      certifications: ['General Lab Safety', 'NMR Cryogen Safety', 'XRD Radiation Safety'],
      passwordHash: defaultPassHash,
    },
    {
      id: 'usr-elena',
      email: 'elena.rostova@lablink.edu',
      name: 'Dr. Elena Rostova',
      role: 'faculty',
      department: 'Bioengineering',
      title: 'Lead Imaging Specialist & Faculty PI',
      weeklyQuotaHours: 20,
      usedHoursThisWeek: 4.0,
      certifications: ['General Lab Safety', 'Level 2 Confocal', 'Cryo-EM Level 3', 'Faculty Approver'],
      passwordHash: defaultPassHash,
    },
    {
      id: 'usr-admin',
      email: 'marcus.chen@lablink.edu',
      name: 'Marcus Chen',
      role: 'admin',
      department: 'Campus Lab Operations',
      title: 'Director of Laboratory Operations',
      weeklyQuotaHours: 40,
      usedHoursThisWeek: 1.0,
      certifications: ['System Administrator', 'Safety Officer', 'Calibration Lead'],
      passwordHash: defaultPassHash,
    },
  ];

  const departments: Department[] = [
    {
      id: 'dept-bio',
      name: 'Bioengineering',
      code: 'BIOE',
      headName: 'Dr. Elena Rostova',
      instrumentCount: 34,
      uptimePercent: 98.2,
      accentColor: 'mint',
      icon: 'genetics',
    },
    {
      id: 'dept-rob',
      name: 'Robotics & ECE',
      code: 'ROBO',
      headName: 'Prof. Arjun Patel',
      instrumentCount: 42,
      uptimePercent: 98.9,
      accentColor: 'blue',
      icon: 'memory',
    },
    {
      id: 'dept-mat',
      name: 'Materials & Chem',
      code: 'MATS',
      headName: 'Dr. Sarah Jenkins',
      instrumentCount: 29,
      uptimePercent: 95.4,
      accentColor: 'pink',
      icon: 'experiment',
    },
    {
      id: 'dept-fab',
      name: 'Rapid Prototyping',
      code: 'FABR',
      headName: 'Prof. Lucas Meyer',
      instrumentCount: 35,
      uptimePercent: 99.1,
      accentColor: 'butter',
      icon: 'view_in_ar',
    },
  ];

  const laboratories: Laboratory[] = [
    {
      id: 'lab-imaging',
      name: 'Bio-Imaging Core Suite',
      departmentId: 'dept-bio',
      departmentName: 'Bioengineering',
      building: 'Stata Center, Bldg 32',
      room: '32-241B',
      accessLevel: 'Keycard Access • 24/7 Certified',
      capacity: 8,
      occupied: 6,
      status: 'open',
      managerName: 'Dr. Elena Rostova',
      managerTitle: 'Lead Imaging Specialist • Training Required',
      coordinates: { lat: 42.3616, lng: -71.0906, xPercent: 28, yPercent: 34 },
    },
    {
      id: 'lab-robotics',
      name: 'Robotics Studio B',
      departmentId: 'dept-rob',
      departmentName: 'Robotics & ECE',
      building: 'Mechatronics Hall',
      room: 'Rm 204',
      accessLevel: 'Badge Access • Safety Briefing',
      capacity: 10,
      occupied: 5,
      status: 'open',
      managerName: 'Prof. Arjun Patel',
      managerTitle: 'Mechatronics Lab Director',
      coordinates: { lat: 42.3602, lng: -71.0921, xPercent: 54, yPercent: 26 },
    },
    {
      id: 'lab-circuits',
      name: 'Circuits & Signal Lab',
      departmentId: 'dept-rob',
      departmentName: 'Robotics & ECE',
      building: 'EE Pavilion',
      room: 'Rm 112',
      accessLevel: 'Open Lab Access',
      capacity: 14,
      occupied: 8,
      status: 'open',
      managerName: 'Dr. Kevin Wu',
      managerTitle: 'Signal Integrity Lead',
      coordinates: { lat: 42.3595, lng: -71.089, xPercent: 72, yPercent: 45 },
    },
    {
      id: 'lab-proto',
      name: 'Rapid Prototyping Hub',
      departmentId: 'dept-fab',
      departmentName: 'Rapid Prototyping',
      building: 'Design Foundry',
      room: 'Rm 08',
      accessLevel: 'Keycard Access • Resin Ventilation',
      capacity: 12,
      occupied: 10,
      status: 'high_load',
      managerName: 'Prof. Lucas Meyer',
      managerTitle: 'Fabrication Lead',
      coordinates: { lat: 42.3588, lng: -71.0935, xPercent: 40, yPercent: 68 },
    },
    {
      id: 'lab-xrd',
      name: 'Materials Diffraction Bay',
      departmentId: 'dept-mat',
      departmentName: 'Materials & Chem',
      building: 'NanoTech Annex',
      room: 'Bay 04',
      accessLevel: 'Level 2 Radiation Safety',
      capacity: 6,
      occupied: 4,
      status: 'open',
      managerName: 'Dr. Sarah Jenkins',
      managerTitle: 'X-Ray Crystallography Lead',
      coordinates: { lat: 42.3621, lng: -71.0875, xPercent: 66, yPercent: 74 },
    },
    {
      id: 'lab-cryo',
      name: 'Cryo-EM Facility C08',
      departmentId: 'dept-mat',
      departmentName: 'Materials & Chem',
      building: 'NanoTech Annex',
      room: 'C08',
      accessLevel: 'Restricted Level 3 Access',
      capacity: 4,
      occupied: 1,
      status: 'calibrating',
      managerName: 'Dr. Elena Rostova',
      managerTitle: 'Cryo-EM Operations',
      coordinates: { lat: 42.3629, lng: -71.0882, xPercent: 20, yPercent: 72 },
    },
  ];

  const equipment: Equipment[] = [
    {
      id: 'eq-zeiss-lsm980',
      code: 'EQ-4092-OPT',
      name: 'Zeiss LSM 980 Confocal Microscope',
      category: 'Research',
      departmentId: 'dept-bio',
      departmentName: 'Bioengineering',
      laboratoryId: 'lab-imaging',
      locationLabel: 'Bio-Imaging Core, Room 32-241B',
      status: 'available',
      hourlyRate: 45,
      requiresFacultyApproval: true,
      certificationRequired: 'Level 2 Confocal',
      biosafetyLevel: 'Biosafety Level 1',
      nextSlotLabel: 'Today, 2:00 PM',
      lastCalibrated: 'Oct 12',
      totalBookings: 482,
      description:
        'High-sensitivity spectral confocal imaging system equipped with Airyscan 2 for multiplexed, super-resolution live-cell and fixed-tissue 3D imaging.',
      specsPreview: '405–639 nm Lasers • 120 nm Airyscan 2 • 37°C CO₂ Stage',
      imageUrl: '',
      clayTheme: 'microscope',
      specs: [
        { label: 'Laser Lines', value: '405, 488, 561, 639 nm', icon: 'flare', tone: 'mint' },
        { label: 'Resolution', value: '120 nm (Airyscan 2)', icon: 'center_focus_strong', tone: 'blue' },
        { label: 'Detectors', value: '34-Ch GaAsP Spectral', icon: 'camera', tone: 'pink' },
        { label: 'Objectives', value: '10x, 20x, 40x, 63x Oil', icon: 'zoom_in', tone: 'neutral' },
        { label: 'Incubation', value: '37°C + 5% CO₂ Stage', icon: 'thermostat', tone: 'mint' },
        { label: 'Workstation', value: 'ZEN Blue 3.8 + 128GB', icon: 'memory', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'Level 2 Certification',
          detail: 'First-time users must complete a 90-minute hands-on orientation with Dr. Rostova.',
          icon: 'school',
        },
        {
          title: 'Objective Cleaning',
          detail: 'Always wipe immersion oil from 63x objectives using lens paper and Sparkle cleaner.',
          icon: 'cleaning_services',
        },
        {
          title: 'Laser Warm-up',
          detail: 'Allow 15 minutes for Argon/Diode lasers to stabilize before quantitative imaging.',
          icon: 'power_settings_new',
        },
        {
          title: 'Data Offloading',
          detail: 'Transfer .czi files to LabLink Cloud or external SSD immediately; local drive purges weekly.',
          icon: 'cloud_upload',
        },
      ],
    },
    {
      id: 'eq-ur5e-arm',
      code: 'EQ-1084-ROB',
      name: 'UR5e Collaborative Robot Arm',
      category: 'Robotics',
      departmentId: 'dept-rob',
      departmentName: 'Mechanical Engineering',
      laboratoryId: 'lab-robotics',
      locationLabel: 'Robotics Studio B, Room 204',
      status: 'available',
      hourlyRate: 30,
      requiresFacultyApproval: false,
      certificationRequired: 'General Lab Safety',
      biosafetyLevel: 'ISO/TS 15066 Cobot',
      nextSlotLabel: 'Today, 2:00 PM',
      lastCalibrated: 'Oct 18',
      totalBookings: 319,
      description:
        'Six-axis collaborative robotic arm with integrated force-torque sensing, ROS 2 real-time control interface, and adaptive parallel gripper.',
      specsPreview: '6-Axis • 5kg Payload • ±0.03mm Repeatability',
      imageUrl: '',
      clayTheme: 'robot',
      specs: [
        { label: 'Axes & Reach', value: '6-Axis • 850 mm Reach', icon: 'precision_manufacturing', tone: 'blue' },
        { label: 'Payload', value: '5.0 kg Rated', icon: 'fitness_center', tone: 'mint' },
        { label: 'Repeatability', value: '±0.03 mm Precision', icon: 'straighten', tone: 'pink' },
        { label: 'SDK Control', value: 'ROS 2 Humble / Python', icon: 'terminal', tone: 'neutral' },
        { label: 'Force Sensor', value: '6-DOF Wrist F/T', icon: 'sensors', tone: 'mint' },
        { label: 'Safety Zone', value: 'LiDAR Perimeter Guard', icon: 'shield', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'E-Stop Reach Check',
          detail: 'Verify physical emergency stop pendant sits within arm reach before powering joints.',
          icon: 'verified_user',
        },
        {
          title: 'Torque Limits',
          detail: 'Keep collaborative speed below 250 mm/s during unguarded benchtop testing.',
          icon: 'speed',
        },
      ],
    },
    {
      id: 'eq-keysight-scope',
      code: 'EQ-2219-ELC',
      name: 'Keysight MSOX3024T Oscilloscope',
      category: 'Electronics',
      departmentId: 'dept-rob',
      departmentName: 'Electrical Engineering',
      laboratoryId: 'lab-circuits',
      locationLabel: 'Circuits & Signal Lab, Room 112',
      status: 'available',
      hourlyRate: 15,
      requiresFacultyApproval: false,
      certificationRequired: 'General Lab Safety',
      biosafetyLevel: 'ESD Safe Bench',
      nextSlotLabel: 'Today, 1:30 PM',
      lastCalibrated: 'Oct 08',
      totalBookings: 614,
      description:
        'Mixed-signal benchtop oscilloscope with capacitive touch screen, built-in 20 MHz function generator, and protocol decoding for I2C, SPI, CAN.',
      specsPreview: '200 MHz • 4 Analog + 16 Digital • 5 GSa/s',
      imageUrl: '',
      clayTheme: 'oscilloscope',
      specs: [
        { label: 'Bandwidth', value: '200 MHz', icon: 'waves', tone: 'pink' },
        { label: 'Channels', value: '4 Analog + 16 Digital', icon: 'cable', tone: 'blue' },
        { label: 'Sample Rate', value: '5 GSa/s Real-Time', icon: 'bolt', tone: 'mint' },
        { label: 'Memory Depth', value: '4 Mpts', icon: 'memory', tone: 'neutral' },
        { label: 'WaveGen', value: '20 MHz Built-in', icon: 'graphic_eq', tone: 'mint' },
        { label: 'Probes', value: '4x 500MHz Passive', icon: 'settings_input_component', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'ESD Grounding',
          detail: 'Use wrist strap on anti-static mat when probing bare CMOS boards.',
          icon: 'electric_bolt',
        },
        {
          title: 'Probe Compensation',
          detail: 'Verify 1kHz square wave calibration before differential high-speed measurements.',
          icon: 'tune',
        },
      ],
    },
    {
      id: 'eq-formlabs-3l',
      code: 'EQ-3305-FAB',
      name: 'Formlabs Form 3L SLA Printer',
      category: 'Fabrication',
      departmentId: 'dept-fab',
      departmentName: 'Industrial Design',
      laboratoryId: 'lab-proto',
      locationLabel: 'Rapid Prototyping Hub, Room 08',
      status: 'in_use',
      hourlyRate: 25,
      requiresFacultyApproval: false,
      certificationRequired: 'General Lab Safety',
      biosafetyLevel: 'Resin PPE Required',
      nextSlotLabel: 'Tomorrow, 9:00 AM',
      lastCalibrated: 'Oct 15',
      totalBookings: 274,
      description:
        'Large-format Low Force Stereolithography resin printer powered by twin Light Processing Units for smooth micro-featured prototypes.',
      specsPreview: '33.5 × 20 × 30 cm • 25μm Layer • Dual Laser',
      imageUrl: '',
      clayTheme: 'printer',
      specs: [
        { label: 'Build Volume', value: '33.5 × 20 × 30 cm', icon: 'view_in_ar', tone: 'mint' },
        { label: 'Layer Resolution', value: '25–100 μm Z-Axis', icon: 'layers', tone: 'blue' },
        { label: 'Optics', value: 'Dual 250mW LPU', icon: 'flare', tone: 'pink' },
        { label: 'Materials', value: 'BioMed, Tough 2000, Clear', icon: 'science', tone: 'neutral' },
        { label: 'Post-Cure', value: 'Form Wash L + Cure L', icon: 'wb_sunny', tone: 'mint' },
        { label: 'File Format', value: '.STL / .OBJ via PreForm', icon: 'folder_open', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'Nitrile Gloves',
          detail: 'Wear double nitrile gloves when transferring uncured parts into IPA wash station.',
          icon: 'pan_tool',
        },
        {
          title: 'Resin Tank Check',
          detail: 'Inspect PDMS tank film for cured debris with soft silicone spatula before printing.',
          icon: 'visibility',
        },
      ],
    },
    {
      id: 'eq-dgx-a100',
      code: 'EQ-5501-CMP',
      name: 'NVIDIA DGX A100 AI Node',
      category: 'Computing',
      departmentId: 'dept-rob',
      departmentName: 'Computer Science',
      laboratoryId: 'lab-circuits',
      locationLabel: 'AI Compute Cluster, Room 402',
      status: 'available',
      hourlyRate: 40,
      requiresFacultyApproval: true,
      certificationRequired: 'Cluster SSH Key',
      biosafetyLevel: 'Remote SSH / Slurm',
      nextSlotLabel: 'Now (Remote SSH)',
      lastCalibrated: 'Oct 20',
      totalBookings: 842,
      description:
        'Dedicated 8-GPU Tensor Core node for molecular dynamics, foundation model fine-tuning, and real-time 3D tomography reconstruction.',
      specsPreview: '8× A100 80GB • 640GB VRAM • 5 PFLOPS AI',
      imageUrl: '',
      clayTheme: 'compute',
      specs: [
        { label: 'GPUs', value: '8× NVIDIA A100 80GB', icon: 'developer_board', tone: 'pink' },
        { label: 'Total VRAM', value: '640 GB HBM2e', icon: 'memory', tone: 'blue' },
        { label: 'AI Compute', value: '5 PFLOPS FP16', icon: 'speed', tone: 'mint' },
        { label: 'Interconnect', value: 'NVSwitch 600 GB/s', icon: 'hub', tone: 'neutral' },
        { label: 'Storage', value: '30 TB NVMe Scratch', icon: 'storage', tone: 'mint' },
        { label: 'Scheduler', value: 'Slurm + JupyterHub', icon: 'terminal', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'Checkpoint Policy',
          detail: 'Save model weights every 30 minutes to shared NFS; scratch storage purges after 14 days.',
          icon: 'save',
        },
      ],
    },
    {
      id: 'eq-haas-cnc',
      code: 'EQ-7704-MFG',
      name: 'Haas Mini Mill 2 CNC',
      category: 'Manufacturing',
      departmentId: 'dept-fab',
      departmentName: 'Materials & Mfg',
      laboratoryId: 'lab-proto',
      locationLabel: 'Precision Machine Shop, Bay 3',
      status: 'in_use',
      hourlyRate: 50,
      requiresFacultyApproval: true,
      certificationRequired: 'Machine Shop Green Tag',
      biosafetyLevel: 'ANSI Z87 Eye Protection',
      nextSlotLabel: 'Thu, 10:30 AM',
      lastCalibrated: 'Oct 10',
      totalBookings: 198,
      description:
        'Compact 3-axis vertical CNC machining center with 10-pocket automatic tool changer for aluminum housings, microfluidic molds, and fixtures.',
      specsPreview: '16 × 12 × 10 in • 6000 RPM • 10-Tool ATC',
      imageUrl: '',
      clayTheme: 'cnc',
      specs: [
        { label: 'XYZ Travel', value: '16 × 12 × 10 in', icon: 'open_with', tone: 'mint' },
        { label: 'Spindle', value: '6000 RPM • 7.5 HP', icon: 'cyclone', tone: 'blue' },
        { label: 'Tool Changer', value: '10-Tool Carousel ATC', icon: 'build', tone: 'pink' },
        { label: 'Probing', value: 'Renishaw Wireless', icon: 'gps_fixed', tone: 'neutral' },
        { label: 'CAM Post', value: 'Fusion 360 Haas NGC', icon: 'code', tone: 'mint' },
        { label: 'Coolant', value: 'Flood + Air Blast', icon: 'water_drop', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'Dry Run Mandatory',
          detail: 'Simulate toolpaths in Graphics Mode and verify Z-zero height before spindle engage.',
          icon: 'fact_check',
        },
      ],
    },
    {
      id: 'eq-rigaku-xrd',
      code: 'EQ-6102-MAT',
      name: 'Rigaku SmartLab XRD',
      category: 'Research',
      departmentId: 'dept-mat',
      departmentName: 'Materials & Chem',
      laboratoryId: 'lab-xrd',
      locationLabel: 'Materials Diffraction Bay, Bay 04',
      status: 'available',
      hourlyRate: 55,
      requiresFacultyApproval: true,
      certificationRequired: 'XRD Radiation Safety',
      biosafetyLevel: 'Cabinet X-Ray Interlock',
      nextSlotLabel: 'Today, 12:00 PM',
      lastCalibrated: 'Oct 21',
      totalBookings: 365,
      description:
        'High-resolution multipurpose X-ray diffractometer for thin-film GI-XRD, reciprocal space mapping, and battery/catalyst phase identification.',
      specsPreview: '9 kW Rotating Anode • HyPix-3000 • Thin-Film Stage',
      imageUrl: '',
      clayTheme: 'xrd',
      specs: [
        { label: 'X-Ray Source', value: 'Cu Kα • 9 kW Anode', icon: 'flare', tone: 'pink' },
        { label: 'Detector', value: 'HyPix-3000 2D Hybrid', icon: 'camera', tone: 'blue' },
        { label: 'Optics', value: 'CBO Auto-Switch', icon: 'tune', tone: 'mint' },
        { label: 'Angular Res.', value: '0.0001° Step', icon: 'straighten', tone: 'neutral' },
        { label: 'Sample Stage', value: 'Eulerian Cradle + Z', icon: 'layers', tone: 'mint' },
        { label: 'Software', value: 'SmartLab Studio II', icon: 'analytics', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'Dosimeter Badge',
          detail: 'Wear personal TLD ring/badge when loading specimens into the goniometer chamber.',
          icon: 'badge',
        },
      ],
    },
    {
      id: 'eq-bruker-d8',
      code: 'EQ-6109-MAT',
      name: 'Bruker D8 Advance XRD',
      category: 'Research',
      departmentId: 'dept-mat',
      departmentName: 'Materials & Chem',
      laboratoryId: 'lab-xrd',
      locationLabel: 'Materials Diffraction Bay, Bay 02',
      status: 'available',
      hourlyRate: 48,
      requiresFacultyApproval: true,
      certificationRequired: 'XRD Radiation Safety',
      biosafetyLevel: 'Cabinet X-Ray Interlock',
      nextSlotLabel: 'Today, 2:00 PM',
      lastCalibrated: 'Oct 19',
      totalBookings: 290,
      description:
        'Automated powder & polycrystalline X-ray diffractometer featuring a 9-position sample changer and LynxEye XE-T energy-dispersive detector.',
      specsPreview: 'Cu Kα1 • 9-Sample Changer • LynxEye XE-T',
      imageUrl: '',
      clayTheme: 'xrd',
      specs: [
        { label: 'Source', value: '2.2 kW Cu Sealed Tube', icon: 'flare', tone: 'blue' },
        { label: 'Detector', value: 'LynxEye XE-T', icon: 'camera', tone: 'mint' },
        { label: 'Autoloader', value: '9-Position Carousel', icon: 'autorenew', tone: 'pink' },
        { label: 'Temp Stage', value: 'Ambient to 900°C', icon: 'thermostat', tone: 'neutral' },
        { label: 'Geometry', value: 'Bragg-Brentano θ/θ', icon: 'architecture', tone: 'mint' },
        { label: 'Database', value: 'ICDD PDF-5+ Linked', icon: 'database', tone: 'blue' },
      ],
      guidelines: [
        {
          title: 'Powder Containment',
          detail: 'Press fine nanoparticle powders flush into zero-background silicon holders.',
          icon: 'science',
        },
      ],
    },
  ];

  const projects: ResearchProject[] = [
    {
      id: 'proj-crispr',
      ownerId: 'usr-alex',
      ownerName: 'Alex Rivera',
      title: 'CRISPR Assay Kit',
      grantCode: 'NIH-R01',
      department: 'Bioengineering',
      category: 'Wet Lab',
      description: 'Cas9 guide RNA validation & high-sensitivity fluorescence plate readout for neural organoids.',
      deadline: inTwoDays,
      progress: 78,
      tone: 'mint',
      icon: 'biotech',
      recommendedEquipmentIds: ['eq-zeiss-lsm980', 'eq-dgx-a100'],
      aiAnalysisSummary: 'Requires spectral confocal imaging (Airyscan 2) + GPU image deconvolution.',
      status: 'active',
    },
    {
      id: 'proj-microfluidic',
      ownerId: 'usr-alex',
      ownerName: 'Alex Rivera',
      title: 'Microfluidic Chip v2',
      grantCode: 'NSF-22',
      department: 'Bioengineering',
      category: 'Cleanroom',
      description: 'Sub-100μm PDMS channel bonding, resin master mold fabrication, and droplet flow calibration.',
      deadline: getTodayDateString(5),
      progress: 45,
      tone: 'blue',
      icon: 'memory',
      recommendedEquipmentIds: ['eq-formlabs-3l', 'eq-haas-cnc'],
      aiAnalysisSummary: 'High-resolution 25μm SLA master mold followed by CNC aluminum manifold fixture.',
      status: 'active',
    },
    {
      id: 'proj-spectroscopy',
      ownerId: 'usr-alex',
      ownerName: 'Alex Rivera',
      title: 'Spectroscopy Run',
      grantCode: 'PILOT-26',
      department: 'Materials & Chem',
      category: 'Imaging',
      description: 'Thin-film perovskite & nanoparticle baseline characterization across multiple diffraction angles.',
      deadline: getTodayDateString(7),
      progress: 92,
      tone: 'pink',
      icon: 'visibility',
      recommendedEquipmentIds: ['eq-rigaku-xrd', 'eq-bruker-d8'],
      aiAnalysisSummary: 'Thin-film stage on Rigaku SmartLab recommended for grazing-incidence scans.',
      status: 'active',
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bk-101',
      equipmentId: 'eq-zeiss-lsm980',
      equipmentName: 'Zeiss LSM 980 Confocal Microscope',
      userId: 'usr-alex',
      userName: 'Alex Rivera',
      userRoleTitle: 'Graduate Researcher • Bioengineering',
      projectId: 'proj-crispr',
      projectTitle: 'CRISPR Assay Kit (NIH-R01)',
      date: today,
      startHour: 14,
      durationHours: 2,
      status: 'confirmed',
      totalCost: 90,
      facultyReviewerName: 'Dr. Elena Rostova',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-102',
      equipmentId: 'eq-ur5e-arm',
      equipmentName: 'UR5e Collaborative Robot Arm',
      userId: 'usr-alex',
      userName: 'Alex Rivera',
      userRoleTitle: 'Graduate Researcher • Bioengineering',
      projectId: 'proj-microfluidic',
      projectTitle: 'Microfluidic Chip v2 (NSF-22)',
      date: tomorrow,
      startHour: 9,
      durationHours: 3,
      status: 'confirmed',
      totalCost: 90,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-201',
      equipmentId: 'eq-zeiss-lsm980',
      equipmentName: 'Zeiss LSM 980 Confocal Microscope',
      userId: 'usr-maya',
      userName: 'Maya Lin',
      userRoleTitle: 'PhD Candidate • Bioengineering',
      projectId: 'proj-crispr',
      projectTitle: 'Cellular Organelle Fluorescence Mapping',
      date: inTwoDays,
      startHour: 14,
      durationHours: 3,
      status: 'pending',
      totalCost: 135,
      urgencyTag: 'Urgent',
      aiNote: 'Zero conflicts detected. Adjacent wet-bench B204 is also free if sample prep is needed.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-202',
      equipmentId: 'eq-rigaku-xrd',
      equipmentName: 'Rigaku SmartLab XRD',
      userId: 'usr-liam',
      userName: 'Liam Vance',
      userRoleTitle: 'Senior Thesis • Organic Chem',
      projectId: 'proj-spectroscopy',
      projectTitle: 'Catalyst Ligand Purity Verification',
      date: inTwoDays,
      startHour: 9,
      durationHours: 2,
      status: 'pending',
      totalCost: 110,
      urgencyTag: 'Routine',
      aiNote: 'Liquid nitrogen refill scheduled 09:00–09:30. Recommend shifting slot to 10:00–12:00.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-203',
      equipmentId: 'eq-bruker-d8',
      equipmentName: 'Bruker D8 Advance XRD',
      userId: 'usr-elena',
      userName: 'Elena Rostova',
      userRoleTitle: 'Postdoc • Materials Science',
      projectId: 'proj-spectroscopy',
      projectTitle: 'Graphene Lattice Defect Imaging',
      date: getTodayDateString(3),
      startHour: 13,
      durationHours: 3,
      status: 'pending',
      totalCost: 144,
      urgencyTag: 'Certified',
      aiNote: 'Optimal power-grid window. Safety certification Level 3 verified on file.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-301',
      equipmentId: 'eq-rigaku-xrd',
      equipmentName: 'Rigaku SmartLab XRD',
      userId: 'usr-maya',
      userName: 'Maya Lin',
      userRoleTitle: 'PhD Candidate • Materials Science',
      projectId: 'proj-spectroscopy',
      projectTitle: 'Perovskite Thin-Film XRD',
      date: today,
      startHour: 8,
      durationHours: 2,
      status: 'confirmed',
      totalCost: 110,
      createdAt: new Date().toISOString(),
    },
  ];

  const conflicts: FairSlotConflictCase[] = [
    {
      id: 'fs-2048',
      caseCode: 'CASE #FS-2048',
      equipmentId: 'eq-rigaku-xrd',
      equipmentName: 'Rigaku SmartLab XRD',
      bayLabel: 'Bay 04',
      date: today,
      conflictStartHour: 14,
      conflictEndHour: 16,
      status: 'open',
      fairnessScore: 96,
      headlineRecommendation: 'Keep Maya Lin in 14:00–16:00 & move Liam Vance to 16:30–18:30',
      explanation:
        'Maya’s journal revision deadline is in 18 hours and she has only used 33% of her weekly XRD quota. Liam’s milestone is 5 days away, and shifting him by 2.5 hours preserves his exact Rigaku SmartLab calibration profile with zero sample degradation.',
      candidates: [
        {
          bookingId: 'bk-fs-maya',
          studentId: 'usr-maya',
          studentName: 'Maya Lin',
          studentInitials: 'ML',
          studentTitle: 'PhD Candidate • Materials Science',
          projectTitle: 'Perovskite Thin-Film XRD',
          deadlineDescription: 'Nature Energy revision submission due tomorrow, 08:00 AM.',
          hoursUntilDeadline: 18,
          priorityScore: 94,
          weeklyUsedHours: 2.0,
          weeklyQuotaHours: 6.0,
          requestedStartHour: 14,
          requestedDurationHours: 2,
          recommended: true,
        },
        {
          bookingId: 'bk-fs-liam',
          studentId: 'usr-liam',
          studentName: 'Liam Vance',
          studentInitials: 'LV',
          studentTitle: 'M.S. Researcher • Chemical Eng.',
          projectTitle: 'Catalyst Surface Characterization',
          deadlineDescription: 'Weekly lab group milestone due in 5 days, 17:00 PM.',
          hoursUntilDeadline: 120,
          priorityScore: 72,
          weeklyUsedHours: 4.5,
          weeklyQuotaHours: 6.0,
          requestedStartHour: 14,
          requestedDurationHours: 2,
          recommended: false,
        },
      ],
      factors: [
        {
          title: 'Deadline Urgency',
          icon: 'bolt',
          tone: 'mint',
          detail: '18h vs. 5d buffer weights Maya’s slot 3.2× higher.',
        },
        {
          title: 'Quota Equity',
          icon: 'balance',
          tone: 'blue',
          detail: 'Maya has 4.0h remaining; Liam has 1.5h remaining this week.',
        },
        {
          title: 'Zero Retuning',
          icon: 'tune',
          tone: 'pink',
          detail: '16:30 slot follows directly after Maya’s thin-film optics setup.',
        },
      ],
      alternatives: [
        {
          id: 'alt-1',
          badge: 'Best Match',
          score: 96,
          timeLabel: 'Today, 16:30 – 18:30',
          date: today,
          startHour: 16,
          durationHours: 2,
          equipmentId: 'eq-rigaku-xrd',
          equipmentName: 'Rigaku SmartLab XRD',
          bayLabel: 'Bay 04',
          rationale: 'Same-day completion with zero instrument recalibration needed.',
        },
        {
          id: 'alt-2',
          badge: 'Parallel Bay',
          score: 89,
          timeLabel: 'Today, 14:00 – 16:00',
          date: today,
          startHour: 14,
          durationHours: 2,
          equipmentId: 'eq-bruker-d8',
          equipmentName: 'Bruker D8 Advance',
          bayLabel: 'Bay 02',
          rationale: 'Keeps exact requested time; requires 15m sample holder swap.',
        },
        {
          id: 'alt-3',
          badge: 'Next Morning',
          score: 84,
          timeLabel: 'Tomorrow, 09:00 – 11:00',
          date: tomorrow,
          startHour: 9,
          durationHours: 2,
          equipmentId: 'eq-rigaku-xrd',
          equipmentName: 'Rigaku SmartLab XRD',
          bayLabel: 'Bay 04',
          rationale: 'Fresh morning queue with 4 days remaining before milestone.',
        },
      ],
      timelineBlocks: [
        { hourLabel: '08:00', startHour: 8, label: 'Dr. Patel', kind: 'booked' },
        { hourLabel: '10:00', startHour: 10, label: 'Maintenance', kind: 'booked' },
        { hourLabel: '12:00', startHour: 12, label: 'Open', kind: 'open' },
        { hourLabel: '14:00', startHour: 14, label: 'Conflict (2)', kind: 'conflict' },
        { hourLabel: '16:00', startHour: 16, label: 'Liam (AI)', kind: 'ai_suggested' },
        { hourLabel: '18:00', startHour: 18, label: 'Open', kind: 'open' },
      ],
      selectedAlternativeId: 'alt-1',
    },
  ];

  const maintenance: MaintenanceLog[] = [
    {
      id: 'mnt-1',
      equipmentId: 'eq-zeiss-lsm980',
      equipmentName: 'Zeiss LSM 980 Confocal',
      technician: 'Dr. Elena Rostova',
      taskTitle: 'Airyscan Detector Alignment',
      status: 'cleared',
      scheduledDate: today,
      notes: 'All 4 laser lines within 0.4% power tolerance.',
    },
    {
      id: 'mnt-2',
      equipmentId: 'eq-rigaku-xrd',
      equipmentName: 'Rigaku SmartLab XRD',
      technician: 'R. Gomez',
      taskTitle: 'Goniometer Zero-Angle Check',
      status: 'scheduled',
      scheduledDate: inTwoDays,
      notes: 'Routine 30-minute morning calibration window.',
    },
    {
      id: 'mnt-3',
      equipmentId: 'eq-haas-cnc',
      equipmentName: 'Haas Mini Mill 2 CNC',
      technician: 'M. Alvarez',
      taskTitle: 'Coolant Filter & Spindle Runout Check',
      status: 'in_progress',
      scheduledDate: today,
      notes: 'ETA 2 hours before afternoon bay reopens.',
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'ntf-1',
      userId: 'usr-alex',
      title: 'Confocal Microscope Confirmed',
      message: 'Approved by Dr. Rostova for Bio-Imaging Core • Today 2:00 PM – 4:00 PM.',
      type: 'confirmed',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'ntf-2',
      userId: 'usr-alex',
      title: 'Safety Certification Active',
      message: 'Level 2 Confocal & Biosafety Level 1 verified for Spring Semester.',
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'ntf-3',
      userId: 'usr-elena',
      title: 'FairSlot Case #FS-2048 Ready for Review',
      message: 'Rigaku SmartLab XRD overlap between Maya Lin & Liam Vance has an AI fairness plan.',
      type: 'ai',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ];

  return {
    users,
    departments,
    laboratories,
    equipment,
    projects,
    bookings,
    conflicts,
    maintenance,
    notifications,
  };
}

class LabLinkStore {
  private db: LabLinkDatabase;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.db = this.load();
  }

  private load(): LabLinkDatabase {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw) as LabLinkDatabase;
        if (parsed && Array.isArray(parsed.equipment) && Array.isArray(parsed.users)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to fresh seed if file corrupt
    }
    const seed = createInitialSeed();
    this.persistSync(seed);
    return seed;
  }

  private persistSync(data: LabLinkDatabase): void {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Ignore write failures in read-only serverless containers; in-memory state still operates
    }
  }

  private enqueuePersist(): void {
    const snapshot = this.db;
    this.writeQueue = this.writeQueue.then(async () => {
      this.persistSync(snapshot);
    });
  }

  public getPublicUsers(): UserProfile[] {
    return this.db.users.map(({ passwordHash: _pw, ...rest }) => rest);
  }

  public findUserByEmail(email: string): StoredUser | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public toPublicUser(user: StoredUser): UserProfile {
    const { passwordHash: _pw, ...rest } = user;
    return rest;
  }

  public createUser(input: {
    email: string;
    name: string;
    password: string;
    department: string;
    role?: UserRole;
  }): UserProfile {
    const existing = this.findUserByEmail(input.email);
    if (existing) {
      throw new Error('An account with that university email already exists.');
    }
    const newUser: StoredUser = {
      id: `usr-${Date.now()}`,
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      role: input.role || 'student',
      department: input.department.trim() || 'Bioengineering',
      title:
        input.role === 'faculty'
          ? `Faculty Investigator • ${input.department}`
          : `Researcher • ${input.department}`,
      weeklyQuotaHours: 6,
      usedHoursThisWeek: 0,
      certifications: ['General Lab Safety'],
      passwordHash: hashPassword(input.password),
    };
    this.db.users.push(newUser);
    this.enqueuePersist();
    return this.toPublicUser(newUser);
  }

  public updateUserRole(userId: string, role: UserRole): UserProfile {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');
    user.role = role;
    this.enqueuePersist();
    return this.toPublicUser(user);
  }

  public updateUserCertifications(userId: string, certifications: string[]): UserProfile {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found.');
    user.certifications = certifications;
    this.enqueuePersist();
    return this.toPublicUser(user);
  }

  public getDepartments(): Department[] {
    return this.db.departments;
  }

  public addDepartment(input: Omit<Department, 'id'>): Department {
    const created: Department = { id: `dept-${Date.now()}`, ...input };
    this.db.departments.push(created);
    this.enqueuePersist();
    return created;
  }

  public getLaboratories(): Laboratory[] {
    return this.db.laboratories;
  }

  public addLaboratory(input: Omit<Laboratory, 'id'>): Laboratory {
    const created: Laboratory = { id: `lab-${Date.now()}`, ...input };
    this.db.laboratories.push(created);
    this.enqueuePersist();
    return created;
  }

  public getEquipment(): Equipment[] {
    return this.db.equipment;
  }

  public getEquipmentById(id: string): Equipment | undefined {
    return this.db.equipment.find((e) => e.id === id);
  }

  public addEquipment(input: Omit<Equipment, 'id' | 'totalBookings'>): Equipment {
    const created: Equipment = {
      id: `eq-${Date.now()}`,
      totalBookings: 0,
      ...input,
    };
    this.db.equipment.unshift(created);
    const dept = this.db.departments.find((d) => d.id === created.departmentId);
    if (dept) dept.instrumentCount += 1;
    this.enqueuePersist();
    return created;
  }

  public updateEquipmentStatus(id: string, status: Equipment['status']): Equipment {
    const item = this.getEquipmentById(id);
    if (!item) throw new Error('Equipment not found.');
    item.status = status;
    this.enqueuePersist();
    return item;
  }

  public getProjects(userId?: string, role?: UserRole): ResearchProject[] {
    if (!userId || role === 'faculty' || role === 'admin') {
      return this.db.projects;
    }
    return this.db.projects.filter((p) => p.ownerId === userId || p.ownerId === 'usr-alex');
  }

  public createProject(input: Omit<ResearchProject, 'id'>): ResearchProject {
    const created: ResearchProject = {
      id: `proj-${Date.now()}`,
      ...input,
    };
    this.db.projects.unshift(created);
    this.enqueuePersist();
    return created;
  }

  public getBookings(): Booking[] {
    return this.db.bookings;
  }

  public findConflictingBookings(
    equipmentId: string,
    date: string,
    startHour: number,
    durationHours: number,
    excludeBookingId?: string,
  ): Booking[] {
    const reqEnd = startHour + durationHours;
    return this.db.bookings.filter((b) => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.equipmentId !== equipmentId || b.date !== date) return false;
      if (b.status !== 'confirmed' && b.status !== 'pending') return false;
      const bEnd = b.startHour + b.durationHours;
      return startHour < bEnd && b.startHour < reqEnd;
    });
  }

  public createBookingAtomic(input: {
    equipmentId: string;
    userId: string;
    projectId: string;
    date: string;
    startHour: number;
    durationHours: number;
    submitToFairSlotOnConflict?: boolean;
  }): { booking?: Booking; conflictCase?: FairSlotConflictCase; conflictError?: string } {
    const equipment = this.getEquipmentById(input.equipmentId);
    if (!equipment) {
      throw new Error('Selected equipment was not found.');
    }
    if (equipment.status === 'maintenance') {
      throw new Error(`${equipment.name} is currently under maintenance and cannot be booked.`);
    }

    const user = this.findUserById(input.userId);
    if (!user) {
      throw new Error('Authenticated user profile not found.');
    }

    const project = this.db.projects.find((p) => p.id === input.projectId);
    const projectTitle = project ? `${project.title} (${project.grantCode})` : 'General Lab Research';

    const conflicts = this.findConflictingBookings(
      input.equipmentId,
      input.date,
      input.startHour,
      input.durationHours,
    );

    if (conflicts.length > 0) {
      const existing = conflicts[0];
      if (!input.submitToFairSlotOnConflict) {
        return {
          conflictError: `Time slot ${input.startHour}:00–${input.startHour + input.durationHours}:00 on ${input.date} overlaps with an existing reservation (${existing.userName}). Submit to FairSlot AI arbitration or choose an open slot.`,
        };
      }

      // Create a FairSlot conflict case for Faculty review (AI does not auto-override!)
      const existingUser = this.findUserById(existing.userId);
      const caseId = `fs-${Date.now().toString().slice(-4)}`;
      const nextOpenHour = Math.min(18, existing.startHour + existing.durationHours);
      const conflictCase: FairSlotConflictCase = {
        id: caseId,
        caseCode: `CASE #${caseId.toUpperCase()}`,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        bayLabel: equipment.locationLabel,
        date: input.date,
        conflictStartHour: input.startHour,
        conflictEndHour: input.startHour + input.durationHours,
        status: 'open',
        fairnessScore: 91,
        headlineRecommendation: `Keep ${existing.userName} at ${existing.startHour}:00 & schedule ${user.name} at ${nextOpenHour}:00`,
        explanation: `${existing.userName} holds the earlier validated booking for ${existing.projectTitle}. Shifting ${user.name} to ${nextOpenHour}:00 preserves calibration continuity and avoids double-booking.`,
        candidates: [
          {
            bookingId: existing.id,
            studentId: existing.userId,
            studentName: existing.userName,
            studentInitials: existing.userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            studentTitle: existing.userRoleTitle,
            projectTitle: existing.projectTitle,
            deadlineDescription: 'Active scheduled experiment window.',
            hoursUntilDeadline: 24,
            priorityScore: 88,
            weeklyUsedHours: existingUser?.usedHoursThisWeek ?? 2,
            weeklyQuotaHours: existingUser?.weeklyQuotaHours ?? 6,
            requestedStartHour: existing.startHour,
            requestedDurationHours: existing.durationHours,
            recommended: true,
          },
          {
            bookingId: `bk-req-${Date.now()}`,
            studentId: user.id,
            studentName: user.name,
            studentInitials: user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            studentTitle: user.title,
            projectTitle,
            deadlineDescription: project ? `Project deadline: ${project.deadline}` : 'Flexible milestone.',
            hoursUntilDeadline: 72,
            priorityScore: 76,
            weeklyUsedHours: user.usedHoursThisWeek,
            weeklyQuotaHours: user.weeklyQuotaHours,
            requestedStartHour: input.startHour,
            requestedDurationHours: input.durationHours,
            recommended: false,
          },
        ],
        factors: [
          {
            title: 'Booking Precedence',
            icon: 'schedule',
            tone: 'mint',
            detail: `${existing.userName} reserved this window first with validated prerequisites.`,
          },
          {
            title: 'Quota Equity',
            icon: 'balance',
            tone: 'blue',
            detail: `${user.name} has ${(user.weeklyQuotaHours - user.usedHoursThisWeek).toFixed(1)}h remaining this week.`,
          },
          {
            title: 'Feasible Shift',
            icon: 'tune',
            tone: 'pink',
            detail: `${nextOpenHour}:00 slot on the same date has zero instrument conflicts.`,
          },
        ],
        alternatives: [
          {
            id: 'alt-next',
            badge: 'Best Match',
            score: 94,
            timeLabel: `${input.date}, ${String(nextOpenHour).padStart(2, '0')}:00 – ${String(nextOpenHour + input.durationHours).padStart(2, '0')}:00`,
            date: input.date,
            startHour: nextOpenHour,
            durationHours: input.durationHours,
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            bayLabel: equipment.locationLabel,
            rationale: 'Same-day consecutive slot with zero setup overhead.',
          },
          {
            id: 'alt-tomorrow',
            badge: 'Next Morning',
            score: 86,
            timeLabel: `${getTodayDateString(1)}, 09:00 – ${String(9 + input.durationHours).padStart(2, '0')}:00`,
            date: getTodayDateString(1),
            startHour: 9,
            durationHours: input.durationHours,
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            bayLabel: equipment.locationLabel,
            rationale: 'Clean morning calibration block.',
          },
        ],
        timelineBlocks: [
          { hourLabel: '08:00', startHour: 8, label: 'Open', kind: 'open' },
          { hourLabel: '10:00', startHour: 10, label: 'Open', kind: 'open' },
          { hourLabel: '12:00', startHour: 12, label: 'Open', kind: 'open' },
          {
            hourLabel: `${String(input.startHour).padStart(2, '0')}:00`,
            startHour: input.startHour,
            label: 'Conflict (2)',
            kind: 'conflict',
          },
          {
            hourLabel: `${String(nextOpenHour).padStart(2, '0')}:00`,
            startHour: nextOpenHour,
            label: `${user.name.split(' ')[0]} (AI)`,
            kind: 'ai_suggested',
          },
          { hourLabel: '18:00', startHour: 18, label: 'Open', kind: 'open' },
        ],
        selectedAlternativeId: 'alt-next',
      };

      this.db.conflicts.unshift(conflictCase);
      this.enqueuePersist();
      return { conflictCase };
    }

    const status = equipment.requiresFacultyApproval && user.role === 'student' ? 'pending' : 'confirmed';
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      userId: user.id,
      userName: user.name,
      userRoleTitle: user.title,
      projectId: input.projectId,
      projectTitle,
      date: input.date,
      startHour: input.startHour,
      durationHours: input.durationHours,
      status,
      totalCost: equipment.hourlyRate * input.durationHours,
      urgencyTag: status === 'pending' ? 'Routine' : undefined,
      aiNote:
        status === 'pending'
          ? 'Zero conflicts detected. Awaiting faculty certification sign-off.'
          : undefined,
      createdAt: new Date().toISOString(),
    };

    this.db.bookings.unshift(newBooking);
    equipment.totalBookings += 1;
    user.usedHoursThisWeek += input.durationHours;

    this.db.notifications.unshift({
      id: `ntf-${Date.now()}`,
      userId: user.id,
      title: status === 'confirmed' ? 'Reservation Confirmed' : 'Approval Request Submitted',
      message: `${equipment.name} • ${input.date} at ${String(input.startHour).padStart(2, '0')}:00 (${input.durationHours}h).`,
      type: status === 'confirmed' ? 'confirmed' : 'info',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.enqueuePersist();
    return { booking: newBooking };
  }

  public decideBooking(
    bookingId: string,
    decision: 'confirmed' | 'rejected' | 'alternative_suggested',
    reviewerName: string,
    alternative?: Booking['suggestedAlternative'],
  ): Booking {
    const booking = this.db.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking request not found.');

    if (decision === 'confirmed') {
      const conflicts = this.findConflictingBookings(
        booking.equipmentId,
        booking.date,
        booking.startHour,
        booking.durationHours,
        booking.id,
      );
      if (conflicts.length > 0) {
        throw new Error(
          `Cannot approve: overlaps with confirmed booking by ${conflicts[0].userName}. Use FairSlot or suggest an alternative slot.`,
        );
      }
    }

    booking.status = decision;
    booking.facultyReviewerName = reviewerName;
    if (alternative) {
      booking.suggestedAlternative = alternative;
    }

    this.db.notifications.unshift({
      id: `ntf-${Date.now()}`,
      userId: booking.userId,
      title:
        decision === 'confirmed'
          ? 'Faculty Approved Reservation'
          : decision === 'alternative_suggested'
            ? 'Alternative Slot Suggested'
            : 'Reservation Declined',
      message: `${booking.equipmentName} (${booking.date}) reviewed by ${reviewerName}.`,
      type: decision === 'confirmed' ? 'confirmed' : decision === 'rejected' ? 'warning' : 'ai',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.enqueuePersist();
    return booking;
  }

  public cancelBooking(bookingId: string, actorUserId: string, actorRole: UserRole): Booking {
    const booking = this.db.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.userId !== actorUserId && actorRole !== 'admin' && actorRole !== 'faculty') {
      throw new Error('You may only cancel your own reservations.');
    }
    booking.status = 'cancelled';
    this.enqueuePersist();
    return booking;
  }

  public getConflicts(): FairSlotConflictCase[] {
    return this.db.conflicts;
  }

  public resolveConflict(
    conflictId: string,
    mode: 'resolved_ai' | 'overridden_faculty',
    alternativeId: string | undefined,
    reviewerName: string,
  ): { conflict: FairSlotConflictCase; createdBooking?: Booking } {
    const conflict = this.db.conflicts.find((c) => c.id === conflictId);
    if (!conflict) throw new Error('FairSlot conflict case not found.');

    const chosenAlt =
      conflict.alternatives.find((a) => a.id === alternativeId) || conflict.alternatives[0];
    conflict.status = mode;
    conflict.resolvedBy = reviewerName;
    if (chosenAlt) {
      conflict.selectedAlternativeId = chosenAlt.id;
    }

    const displacedCandidate = conflict.candidates[1];
    let createdBooking: Booking | undefined;
    if (chosenAlt && displacedCandidate) {
      const overlaps = this.findConflictingBookings(
        chosenAlt.equipmentId,
        chosenAlt.date,
        chosenAlt.startHour,
        chosenAlt.durationHours,
      );
      if (overlaps.length === 0) {
        createdBooking = {
          id: `bk-fs-${Date.now()}`,
          equipmentId: chosenAlt.equipmentId,
          equipmentName: chosenAlt.equipmentName,
          userId: displacedCandidate.studentId,
          userName: displacedCandidate.studentName,
          userRoleTitle: displacedCandidate.studentTitle,
          projectId: 'proj-spectroscopy',
          projectTitle: displacedCandidate.projectTitle,
          date: chosenAlt.date,
          startHour: chosenAlt.startHour,
          durationHours: chosenAlt.durationHours,
          status: 'confirmed',
          totalCost: 96,
          facultyReviewerName: reviewerName,
          aiNote: `Resolved via FairSlot (${mode === 'resolved_ai' ? 'AI Plan Approved' : 'Faculty Override'}).`,
          createdAt: new Date().toISOString(),
        };
        this.db.bookings.unshift(createdBooking);
      }
    }

    this.enqueuePersist();
    return { conflict, createdBooking };
  }

  public getMaintenance(): MaintenanceLog[] {
    return this.db.maintenance;
  }

  public addMaintenance(input: Omit<MaintenanceLog, 'id'>): MaintenanceLog {
    const log: MaintenanceLog = { id: `mnt-${Date.now()}`, ...input };
    this.db.maintenance.unshift(log);
    if (input.status === 'in_progress') {
      const eq = this.getEquipmentById(input.equipmentId);
      if (eq) eq.status = 'maintenance';
    } else if (input.status === 'cleared') {
      const eq = this.getEquipmentById(input.equipmentId);
      if (eq) eq.status = 'available';
    }
    this.enqueuePersist();
    return log;
  }

  public getNotifications(userId: string): AppNotification[] {
    return this.db.notifications.filter((n) => n.userId === userId || n.userId === 'usr-alex');
  }

  public markNotificationRead(id: string): void {
    const n = this.db.notifications.find((item) => item.id === id);
    if (n) {
      n.read = true;
      this.enqueuePersist();
    }
  }

  public getAnalytics(): UtilizationAnalytics {
    const totalInstruments = this.db.equipment.length;
    const onlineInstruments = this.db.equipment.filter((e) => e.status !== 'maintenance').length;
    return {
      peakCapacityPercent: 84.2,
      deltaVsLastWeek: '+6.4% vs last wk',
      weeklyBars: [
        { day: 'Mon', percent: 62 },
        { day: 'Tue', percent: 77 },
        { day: 'Wed', percent: 85, isPeak: true },
        { day: 'Thu', percent: 72 },
        { day: 'Fri', percent: 67 },
        { day: 'Sat', percent: 38 },
        { day: 'Sun', percent: 28 },
      ],
      zoneSplit: [
        { zone: 'Imaging', percent: 45, color: '#a8e8d5' },
        { zone: 'Spectroscopy', percent: 32, color: '#b0e4fd' },
        { zone: 'Wet Labs', percent: 23, color: '#ffcfd9' },
      ],
      onlineInstruments,
      totalInstruments,
      uptimePercent: 98.4,
    };
  }
}

export const db = new LabLinkStore();
