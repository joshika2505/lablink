import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Equipment, EquipmentCategory } from '../../types/lablink';
import { api } from '../../lib/api';
import { ClayEquipmentArtwork } from '../clay/ClayEquipmentArtwork';
import { ClayTiltCard, SPRING_TACTILE, TactileButton } from '../motion/MotionPrimitives';

interface DiscoverViewProps {
  equipment: Equipment[];
  onSelectEquipment: (equipmentId: string) => void;
}

const CATEGORIES: Array<{
  label: 'All' | EquipmentCategory;
  icon: string;
  chipBg: string;
  iconColor: string;
}> = [
  { label: 'All', icon: 'apps', chipBg: 'bg-[#ffffff]', iconColor: 'text-[#29695a]' },
  {
    label: 'Robotics',
    icon: 'precision_manufacturing',
    chipBg: 'bg-[#b0e4fd]',
    iconColor: 'text-[#32677c]',
  },
  {
    label: 'Electronics',
    icon: 'memory',
    chipBg: 'bg-[#ffcfd9]',
    iconColor: 'text-[#84515e]',
  },
  {
    label: 'Manufacturing',
    icon: 'build',
    chipBg: 'bg-[#afefdc]',
    iconColor: 'text-[#075043]',
  },
  {
    label: 'Research',
    icon: 'biotech',
    chipBg: 'bg-[#bce9ff]',
    iconColor: 'text-[#114d61]',
  },
  {
    label: 'Computing',
    icon: 'developer_board',
    chipBg: 'bg-[#ffd9e0]',
    iconColor: 'text-[#673946]',
  },
  {
    label: 'Fabrication',
    icon: 'layers',
    chipBg: 'bg-[#a8e8d5]',
    iconColor: 'text-[#2b6a5b]',
  },
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({ equipment, onSelectEquipment }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | EquipmentCategory>('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Gemini AI Match state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<
    Record<string, { score: number; reason: string; slotHint: string }>
  >({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = equipment.filter((item) => {
      const catOk = activeCategory === 'All' || item.category === activeCategory;
      const availOk = !onlyAvailable || item.status === 'available';
      const queryOk =
        !q ||
        Boolean(aiScores[item.id]) ||
        `${item.name} ${item.departmentName} ${item.specsPreview} ${item.category} ${item.locationLabel}`
          .toLowerCase()
          .includes(q);
      return catOk && availOk && queryOk;
    });

    if (Object.keys(aiScores).length > 0) {
      return [...list].sort((a, b) => (aiScores[b.id]?.score || 0) - (aiScores[a.id]?.score || 0));
    }
    return list;
  }, [activeCategory, aiScores, equipment, onlyAvailable, search]);

  const handleAiMatch = async () => {
    const query = search.trim();
    if (!query) {
      setAiError('Type what you need for your experiment (e.g., "live-cell fluorescence imaging").');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.aiDiscover(query);
      setAiSummary(res.summary);
      const map: Record<string, { score: number; reason: string; slotHint: string }> = {};
      for (const m of res.matches) {
        map[m.equipmentId] = {
          score: m.matchScore,
          reason: m.reason,
          slotHint: m.recommendedSlotHint,
        };
      }
      setAiScores(map);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI equipment matching failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiAndSearch = () => {
    setSearch('');
    setAiScores({});
    setAiSummary(null);
    setAiError(null);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Header & Search Bar */}
      <section className="pt-4 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#29695a]">
              01. Campus Marketplace
            </span>
            <h1 className="text-3xl font-bold text-[#1d1c15] mt-1">Equipment Discovery</h1>
          </div>

          <TactileButton
            variant={onlyAvailable ? 'primary' : 'soft'}
            onClick={() => setOnlyAvailable((prev) => !prev)}
            className="px-4 py-2 text-xs self-start md:self-auto"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                onlyAvailable ? 'bg-[#29695a]' : 'bg-[#707975]'
              }`}
            />
            <span>Available Now Only</span>
          </TactileButton>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAiMatch();
          }}
          className="relative w-full bg-[#ffffff] rounded-full p-2 clay-card flex items-center gap-2"
        >
          <div className="w-11 h-11 rounded-full bg-[#a8e8d5] flex items-center justify-center shrink-0 text-[#2b6a5b]">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value.trim()) {
                setAiScores({});
                setAiSummary(null);
              }
            }}
            placeholder="What do you need for your next project? (e.g., thin-film XRD or 6-axis robot)"
            className="w-full bg-transparent text-sm md:text-base text-[#1d1c15] placeholder:text-[#707975] focus:outline-none px-2 min-w-0"
          />
          {search && (
            <button
              type="button"
              onClick={clearAiAndSearch}
              aria-label="Clear search"
              className="w-9 h-9 rounded-full bg-[#f8f3e8] text-[#3f4945] flex items-center justify-center hover:bg-[#ede8dd] shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <TactileButton
            type="submit"
            variant="primary"
            loading={aiLoading}
            className="px-5 py-2.5 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>AI Match</span>
          </TactileButton>
        </form>

        {aiError && (
          <div className="mt-3 rounded-2xl bg-[#ffdad6] text-[#93000a] px-4 py-2.5 text-xs font-medium">
            {aiError}
          </div>
        )}

        {aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-2xl bg-[#b0e4fd]/60 text-[#001f29] px-4 py-3 text-xs font-medium flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#2f6579]">
                auto_awesome
              </span>
              <span>{aiSummary}</span>
            </div>
            <button
              type="button"
              onClick={clearAiAndSearch}
              className="underline font-semibold shrink-0 cursor-pointer"
            >
              Reset AI Match
            </button>
          </motion.div>
        )}
      </section>

      {/* Category Filter Pills */}
      <section className="pb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.label;
            return (
              <motion.button
                key={cat.label}
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_TACTILE}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#a8e8d5] text-[#2b6a5b] clay-button'
                    : 'bg-[#ffffff] text-[#1d1c15] clay-card hover:bg-[#f8f3e8]'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center ${cat.chipBg}`}>
                  <span className={`material-symbols-outlined text-[16px] ${cat.iconColor}`}>
                    {cat.icon}
                  </span>
                </span>
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Results Grid with Staggered Animations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-[#3f4945] tabular-nums">
            Showing {filtered.length} instrument{filtered.length === 1 ? '' : 's'}
          </p>
          <span className="text-xs text-[#707975]">Updated live</span>
        </div>

        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => {
                const aiMatch = aiScores[item.id];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ ...SPRING_TACTILE, delay: Math.min(idx * 0.04, 0.24) }}
                  >
                    <ClayTiltCard
                      onClick={() => onSelectEquipment(item.id)}
                      className="bg-[#ffffff] rounded-[2rem] p-6 clay-card flex flex-col justify-between gap-4 h-full cursor-pointer"
                    >
                      <div>
                        <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4">
                          <ClayEquipmentArtwork theme={item.clayTheme} />
                          <span
                            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[11px] font-semibold shadow-sm flex items-center gap-1.5 ${
                              item.status === 'available'
                                ? 'bg-[#a8e8d5] text-[#2b6a5b]'
                                : item.status === 'maintenance'
                                  ? 'bg-[#f8de91] text-[#4a3800]'
                                  : 'bg-[#ffd9e0] text-[#673946]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.status === 'available'
                                  ? 'bg-[#29695a]'
                                  : item.status === 'maintenance'
                                    ? 'bg-[#4a3800]'
                                    : 'bg-[#82505d]'
                              }`}
                            />
                            {item.status === 'available'
                              ? 'Available Now'
                              : item.status === 'maintenance'
                                ? 'Maintenance'
                                : 'In Use'}
                          </span>
                          {aiMatch && (
                            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#ffffff]/95 text-[#29695a] text-[11px] font-bold shadow-sm tabular-nums">
                              {aiMatch.score}% AI Match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                          <span className="font-semibold text-[#29695a]">{item.category}</span>
                          <span className="text-[#3f4945] truncate">{item.departmentName}</span>
                        </div>

                        <h3 className="text-lg font-semibold text-[#1d1c15] mb-1">{item.name}</h3>

                        <div className="flex items-center gap-1 text-xs text-[#3f4945] mb-3">
                          <span className="material-symbols-outlined text-[16px] text-[#29695a]">
                            location_on
                          </span>
                          <span className="truncate">{item.locationLabel}</span>
                        </div>

                        <div className="bg-[#f8f3e8] rounded-2xl p-3 clay-well">
                          <p className="text-[11px] font-semibold text-[#3f4945] mb-0.5">
                            {aiMatch ? 'AI Match Rationale' : 'Specifications Preview'}
                          </p>
                          <p className="text-xs text-[#1d1c15]">
                            {aiMatch ? aiMatch.reason : item.specsPreview}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <span className="block text-[11px] text-[#707975]">Next Slot</span>
                          <span className="text-xs font-semibold text-[#1d1c15]">
                            {aiMatch ? aiMatch.slotHint : item.nextSlotLabel}
                          </span>
                        </div>
                        <TactileButton
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEquipment(item.id);
                          }}
                          className="px-5 py-2 text-xs"
                        >
                          View Details
                        </TactileButton>
                      </div>
                    </ClayTiltCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center bg-[#f8f3e8] rounded-[2rem] clay-well">
            <div className="w-16 h-16 rounded-full bg-[#a8e8d5] flex items-center justify-center mb-4 text-[#2b6a5b]">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1d1c15] mb-1">
              No matching equipment found
            </h3>
            <p className="text-sm text-[#3f4945] mb-4 max-w-md">
              Try adjusting your search terms or clearing the active category filter.
            </p>
            <TactileButton
              variant="primary"
              onClick={() => {
                clearAiAndSearch();
                setActiveCategory('All');
                setOnlyAvailable(false);
              }}
              className="px-6 py-2.5 text-sm"
            >
              Reset Filters
            </TactileButton>
          </div>
        )}
      </section>
    </div>
  );
};
