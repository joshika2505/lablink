import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Department, Equipment } from '../../types/lablink';
import { api } from '../../lib/api';
import {
  ClayTiltCard,
  MagneticElement,
  ScrollReveal,
  SPRING_TACTILE,
  TactileButton,
} from '../motion/MotionPrimitives';
import { ParallaxHeroStage } from '../motion/ParallaxHeroStage';
import { LabBotMascot } from '../motion/LabBotMascot';

interface LandingPageProps {
  equipment: Equipment[];
  departments: Department[];
  onEnterWorkspace: (targetRoute?: string, equipmentId?: string) => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  equipment,
  departments,
  onEnterWorkspace,
  onOpenAuth,
}) => {
  const [filter, setFilter] = useState<'all' | 'imaging' | 'fabrication' | 'wet-lab'>('all');
  const [aiQuery, setAiQuery] = useState('Need sub-micron 3D printing or live-cell fluorescence...');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiMatchName, setAiMatchName] = useState<string>('Zeiss LSM 980 Confocal Microscope');
  const [aiMatchScore, setAiMatchScore] = useState<number>(98);
  const [aiError, setAiError] = useState<string | null>(null);

  // Floating LabBot assistant drawer
  const [botOpen, setBotOpen] = useState(false);
  const [botInput, setBotInput] = useState('');
  const [botThinking, setBotThinking] = useState(false);
  const [botMessages, setBotMessages] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([
    {
      role: 'bot',
      text: 'Hi! I can check live calibration, safety prerequisites, or match your protocol with campus instruments.',
    },
  ]);

  const previewCards = equipment.slice(0, 6).filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'imaging') return item.category === 'Research';
    if (filter === 'fabrication')
      return item.category === 'Robotics' || item.category === 'Fabrication' || item.category === 'Manufacturing';
    return item.category === 'Electronics' || item.category === 'Computing';
  });

  const handleRunAiMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.aiDiscover(aiQuery);
      setAiSummary(res.summary);
      if (res.matches?.[0]) {
        const matched = equipment.find((eq) => eq.id === res.matches[0].equipmentId);
        if (matched) setAiMatchName(matched.name);
        setAiMatchScore(res.matches[0].matchScore);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI matching unavailable right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskBot = async (promptText?: string) => {
    const q = (promptText ?? botInput).trim();
    if (!q || botThinking) return;
    setBotInput('');
    setBotMessages((prev) => [...prev, { role: 'user', text: q }]);
    setBotThinking(true);
    try {
      const res = await api.aiAssistant(q);
      setBotMessages((prev) => [
        ...prev,
        { role: 'bot', text: `${res.answer}${res.safetyNote ? ` (${res.safetyNote})` : ''}` },
      ]);
    } catch (err) {
      setBotMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: err instanceof Error ? err.message : 'Unable to reach LabBot AI right now.',
        },
      ]);
    } finally {
      setBotThinking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fef9ee] text-[#1d1c15] overflow-x-hidden">
      {/* Floating Claymorphic Navigation Bar */}
      <header className="w-full max-w-[1360px] mx-auto px-4 md:px-8 py-4 sticky top-0 z-40">
        <nav className="bg-[#ffffff]/90 backdrop-blur-md rounded-full px-5 md:px-6 py-3 clay-card flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#a8e8d5] flex items-center justify-center text-[#29695a] shadow-inner group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-[#1d1c15]">LabLink</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 bg-[#f8f3e8]/80 p-1 rounded-full">
            {[
              { href: '#equipment', label: 'Equipment' },
              { href: '#departments', label: 'Departments' },
              { href: '#how-it-works', label: 'How It Works' },
              { href: '#ai-matching', label: 'AI Matching' },
            ].map((item) => (
              <MagneticElement key={item.href} strength={0.14}>
                <a
                  href={item.href}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-[#3f4945] hover:bg-[#ffffff] hover:text-[#1d1c15] hover:shadow-sm transition-all whitespace-nowrap block"
                >
                  {item.label}
                </a>
              </MagneticElement>
            ))}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <TactileButton
              variant="ghost"
              onClick={onOpenAuth}
              className="hidden sm:inline-flex px-5 py-2 text-sm"
            >
              Sign In
            </TactileButton>
            <TactileButton
              variant="primary"
              onClick={() => onEnterWorkspace('dashboard')}
              className="px-5 py-2 text-sm"
            >
              Get Started
            </TactileButton>
          </div>
        </nav>
      </header>

      {/* Hero Section with Cursor-Reactive Parallax & Interactive LabBot */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-8 pt-6 pb-16 lg:pt-10 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col items-start gap-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#b0e4fd] text-[#32677c] text-xs font-semibold clay-button-soft">
              <span className="material-symbols-outlined text-base">science</span>
              <span>Campus-Wide Research Network</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.12] tracking-tight text-[#1d1c15]">
              Big ideas start in the right lab.
            </h1>

            <p className="text-base sm:text-lg text-[#3f4945] max-w-xl leading-relaxed">
              Discover specialised equipment, access laboratories across campus and bring your next
              project to life.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <MagneticElement>
                <TactileButton
                  variant="primary"
                  onClick={() => onEnterWorkspace('discover')}
                  className="px-7 py-3.5 text-sm"
                >
                  <span>Explore Equipment</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </TactileButton>
              </MagneticElement>
              <MagneticElement>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#ffffff] text-[#1d1c15] text-sm font-semibold clay-button-soft hover:-translate-y-0.5 transition-transform"
                >
                  <span className="material-symbols-outlined text-lg text-[#29695a]">play_circle</span>
                  <span>How LabLink Works</span>
                </a>
              </MagneticElement>
            </div>

            {/* Quick Trust Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-3 w-full max-w-md">
              {[
                { val: '140+', label: 'Shared Instruments', color: 'text-[#29695a]' },
                { val: '18', label: 'Campus Labs', color: 'text-[#2f6579]' },
                { val: '24/7', label: 'Smart Booking', color: 'text-[#82505d]' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -3 }}
                  transition={SPRING_TACTILE}
                  className="bg-[#ffffff] rounded-[1.5rem] p-4 clay-card"
                >
                  <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.val}</div>
                  <div className="text-xs text-[#3f4945] mt-0.5">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <ParallaxHeroStage onInteract={() => onEnterWorkspace('ai-assistant')} />
          </motion.div>
        </div>
      </section>

      {/* Equipment Discovery Preview Cards */}
      <section id="equipment" className="w-full max-w-[1360px] mx-auto px-4 md:px-8 py-12 lg:py-16">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#29695a]">
                01. Equipment Discovery
              </span>
              <h2 className="text-3xl font-bold text-[#1d1c15]">Ready-to-book instruments</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: 'All Labs' },
                  { id: 'imaging', label: 'Imaging' },
                  { id: 'fabrication', label: 'Fabrication' },
                  { id: 'wet-lab', label: 'Electronics & Compute' },
                ] as const
              ).map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'text-[#2b6a5b]'
                        : 'bg-[#ffffff] text-[#1d1c15] clay-button-soft hover:bg-[#f8f3e8]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="landing-filter-pill"
                        transition={SPRING_TACTILE}
                        className="absolute inset-0 rounded-full bg-[#a8e8d5] clay-button-soft -z-0"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {previewCards.slice(0, 3).map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ ...SPRING_TACTILE, delay: idx * 0.05 }}
              >
                <ClayTiltCard
                  onClick={() => onEnterWorkspace('equipment-detail', item.id)}
                  className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-5 h-full cursor-pointer"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="px-3 py-1 rounded-full bg-[#b0e4fd] text-[#32677c]">
                        {item.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          item.status === 'available' ? 'text-[#29695a]' : 'text-[#82505d]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === 'available' ? 'bg-[#29695a]' : 'bg-[#82505d]'
                          }`}
                        />
                        {item.status === 'available' ? 'Available Today' : 'In Use'}
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#f8f3e8] clay-well flex items-center justify-center shrink-0 text-[#29695a]">
                        <span className="material-symbols-outlined text-2xl">
                          {item.category === 'Robotics'
                            ? 'precision_manufacturing'
                            : item.category === 'Electronics'
                              ? 'waves'
                              : 'biotech'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-[#1d1c15] truncate">{item.name}</h3>
                        <p className="text-xs text-[#3f4945] truncate">{item.locationLabel}</p>
                      </div>
                    </div>

                    <p className="text-sm text-[#3f4945] line-clamp-2">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-[#3f4945] tabular-nums">
                      Next slot: {item.nextSlotLabel}
                    </span>
                    <TactileButton
                      variant={item.status === 'available' ? 'primary' : 'soft'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEnterWorkspace('equipment-detail', item.id);
                      }}
                      className="px-4 py-2 text-xs"
                    >
                      {item.status === 'available' ? 'Reserve' : 'Check Slots'}
                    </TactileButton>
                  </div>
                </ClayTiltCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Connected Laboratory Departments */}
      <section id="departments" className="w-full max-w-[1360px] mx-auto px-4 md:px-8 py-12 lg:py-16">
        <ScrollReveal>
          <div className="bg-[#f8f3e8] rounded-[3rem] p-8 md:p-12 clay-card">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#2f6579]">
                  02. Campus Network
                </span>
                <h2 className="text-3xl font-bold text-[#1d1c15]">
                  Connected laboratory departments
                </h2>
              </div>
              <p className="text-sm text-[#3f4945] max-w-md">
                Cross-disciplinary access across engineering, life sciences, and physical chemistry.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {departments.map((dept) => {
                const badgeBg =
                  dept.accentColor === 'mint'
                    ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                    : dept.accentColor === 'blue'
                      ? 'bg-[#b0e4fd] text-[#32677c]'
                      : dept.accentColor === 'pink'
                        ? 'bg-[#ffcfd9] text-[#84515e]'
                        : 'bg-[#f8de91] text-[#4a3800]';
                return (
                  <ClayTiltCard
                    key={dept.id}
                    tiltMax={5}
                    onClick={() => onEnterWorkspace('discover')}
                    className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col gap-3 cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${badgeBg}`}>
                      <span className="material-symbols-outlined">{dept.icon}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#1d1c15]">{dept.name}</h3>
                    <p className="text-xs text-[#3f4945] tabular-nums">
                      {dept.instrumentCount} instruments · {dept.uptimePercent}% uptime
                    </p>
                  </ClayTiltCard>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="w-full max-w-[1360px] mx-auto px-4 md:px-8 py-12 lg:py-16">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#29695a]">
              03. Workflow
            </span>
            <h2 className="text-3xl font-bold text-[#1d1c15]">From idea to bench in three steps</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: 1,
              title: 'Describe your experiment',
              desc: 'Search by instrument name or let LabLink AI recommend compatible equipment based on your protocol.',
              badge: 'bg-[#a8e8d5] text-[#2b6a5b]',
            },
            {
              step: 2,
              title: 'Pick a smart time slot',
              desc: 'View live calibration status, safety prerequisites, and open windows across all campus buildings.',
              badge: 'bg-[#b0e4fd] text-[#32677c]',
            },
            {
              step: 3,
              title: 'Tap in & start building',
              desc: 'Receive instant digital badge access and automated usage logs synced with your research group.',
              badge: 'bg-[#ffcfd9] text-[#84515e]',
            },
          ].map((item, idx) => (
            <ScrollReveal key={item.step} delay={idx * 0.08}>
              <ClayTiltCard
                tiltMax={4}
                className="bg-[#ffffff] rounded-[2rem] p-8 clay-card flex flex-col gap-4 h-full"
              >
                <div
                  className={`w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center shadow-sm ${item.badge}`}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-[#1d1c15]">{item.title}</h3>
                <p className="text-sm text-[#3f4945] leading-relaxed">{item.desc}</p>
              </ClayTiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* AI-Powered Matching & Smart Scheduling */}
      <section id="ai-matching" className="w-full max-w-[1360px] mx-auto px-4 md:px-8 py-12 lg:py-16">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 bg-[#ffffff] rounded-[2.5rem] p-8 md:p-10 clay-card flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#a8e8d5] text-[#2b6a5b] text-xs font-semibold w-fit">
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  <span>AI-Powered Matching</span>
                </div>
                <h2 className="text-2xl font-bold text-[#1d1c15]">
                  Not sure which instrument fits your sample?
                </h2>
                <p className="text-sm text-[#3f4945]">
                  Describe your assay or fabrication requirements. Gemini AI matches resolution,
                  throughput, and safety clearances against live campus inventory.
                </p>
              </div>

              <form
                onSubmit={handleRunAiMatch}
                className="bg-[#f8f3e8] rounded-[2rem] p-5 clay-well flex flex-col gap-4"
              >
                <div className="flex items-center gap-2 bg-[#ffffff] rounded-full px-4 py-2 clay-well">
                  <span className="material-symbols-outlined text-[#29695a] text-[20px]">search</span>
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Describe your experiment..."
                    className="flex-1 bg-transparent text-sm text-[#1d1c15] focus:outline-none min-w-0"
                  />
                  <TactileButton
                    type="submit"
                    variant="primary"
                    loading={aiLoading}
                    className="px-4 py-1.5 text-xs"
                  >
                    Match
                  </TactileButton>
                </div>

                {aiError && <p className="text-xs text-[#93000a] font-medium px-2">{aiError}</p>}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#b0e4fd] text-[#32677c] text-xs font-semibold tabular-nums">
                      {aiMatchScore}% Match
                    </span>
                    <span className="text-sm font-semibold text-[#1d1c15]">{aiMatchName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterWorkspace('discover')}
                    className="text-xs text-[#29695a] font-semibold hover:underline cursor-pointer"
                  >
                    Open in Discover →
                  </button>
                </div>

                {aiSummary && <p className="text-xs text-[#3f4945] leading-relaxed">{aiSummary}</p>}
              </form>
            </div>

            <div className="lg:col-span-5 bg-[#a8e8d5] rounded-[2.5rem] p-8 md:p-10 clay-card flex flex-col justify-between gap-6 text-[#2b6a5b]">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffffff] text-[#1d1c15] text-xs font-semibold w-fit shadow-sm">
                  <span className="material-symbols-outlined text-base text-[#29695a]">
                    calendar_month
                  </span>
                  <span>Smart Scheduling</span>
                </div>
                <h2 className="text-2xl font-bold">Zero-conflict lab calendars</h2>
                <p className="text-sm opacity-90">
                  Automatic buffer times for calibration, sterilization, and FairSlot conflict
                  arbitration.
                </p>
              </div>

              <div className="bg-[#ffffff] rounded-[2rem] p-5 shadow-md text-[#1d1c15]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold">November 2026</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#b0e4fd] text-[#32677c] text-xs font-semibold">
                    3 Slots Open
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-[#3f4945] mb-2">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                  <span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold tabular-nums">
                  <span className="py-1.5 rounded-full text-[#707975]">23</span>
                  <span className="py-1.5 rounded-full bg-[#a8e8d5] text-[#2b6a5b] shadow-sm">24</span>
                  <span className="py-1.5 rounded-full bg-[#b0e4fd] text-[#32677c]">25</span>
                  <span className="py-1.5 rounded-full bg-[#b0e4fd] text-[#32677c]">26</span>
                  <span className="py-1.5 rounded-full hover:bg-[#f8f3e8] cursor-pointer">27</span>
                  <span className="py-1.5 rounded-full text-[#707975]">28</span>
                  <span className="py-1.5 rounded-full text-[#707975]">29</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Final CTA Banner */}
      <section className="w-full max-w-[1360px] mx-auto px-4 md:px-8 pt-4 pb-24">
        <ScrollReveal>
          <div className="bg-[#b0e4fd] rounded-[3rem] p-10 md:p-14 clay-card text-center flex flex-col items-center gap-5">
            <h2 className="text-3xl font-bold text-[#001f29] max-w-2xl">
              Ready to unlock every lab on campus?
            </h2>
            <p className="text-base text-[#114d61] max-w-xl">
              Sign in with your university credentials to browse live equipment availability and
              book your first session.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <TactileButton
                variant="primary"
                onClick={() => onEnterWorkspace('dashboard')}
                className="px-8 py-3.5 text-sm"
              >
                Enter Student Workspace
              </TactileButton>
              <TactileButton
                variant="soft"
                onClick={() => onEnterWorkspace('approvals')}
                className="px-8 py-3.5 text-sm"
              >
                Faculty & Admin Console
              </TactileButton>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Floating Interactive LabBot Widget */}
      <aside className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        <AnimatePresence>
          {botOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={SPRING_TACTILE}
              className="mb-3 w-80 sm:w-96 bg-[#ffffff]/95 backdrop-blur-md rounded-[2rem] p-5 clay-card"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#e7e2d7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#a8e8d5] flex items-center justify-center text-[#29695a]">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1d1c15]">LabBot AI</h4>
                    <p className="text-[11px] text-[#29695a] font-medium">
                      {botThinking ? 'Thinking...' : 'Campus Equipment Advisor'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBotOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-[#f8f3e8] flex items-center justify-center text-[#3f4945] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="py-3 flex flex-col gap-2.5 max-h-56 overflow-y-auto">
                {botMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'bot'
                        ? 'bg-[#f8f3e8] text-[#1d1c15] rounded-tl-sm'
                        : 'bg-[#a8e8d5] text-[#2b6a5b] self-end rounded-tr-sm font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 pb-2">
                {[
                  'Which microscope is free today?',
                  'Confocal safety requirements?',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAskBot(chip)}
                    className="text-[11px] px-3 py-1 rounded-full bg-[#f8f3e8] hover:bg-[#b0e4fd] text-[#1d1c15] transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskBot();
                }}
                className="pt-2 border-t border-[#e7e2d7] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder="Ask LabBot..."
                  className="flex-1 bg-[#f8f3e8] rounded-full px-3.5 py-2 text-xs text-[#1d1c15] focus:outline-none"
                />
                <TactileButton
                  type="submit"
                  variant="primary"
                  loading={botThinking}
                  className="px-3.5 py-2 text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </TactileButton>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <LabBotMascot
            size="sm"
            thinking={botThinking}
            showSpeechBubble={false}
            onMascotClick={() => setBotOpen((prev) => !prev)}
          />
          <TactileButton
            variant="soft"
            onClick={() => setBotOpen((prev) => !prev)}
            className="px-4 py-2.5 text-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-[#29695a]">chat</span>
            <span>Ask LabBot</span>
          </TactileButton>
        </div>
      </aside>
    </div>
  );
};
