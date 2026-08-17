import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PROCESS_COLORS, STATE_COLORS } from '../utils/validation';

export default function DiningPhilosophersViz({ frame, onHover, onLeave }) {
  if (!frame) return null;
  const { philosophers, chopsticks, semaphores } = frame;
  const n = philosophers.length;

  const layout = useMemo(() => {
    const cx = 200, cy = 190, radius = 140;
    return philosophers.map((p, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return {
        ...p,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle,
        color: PROCESS_COLORS[i % PROCESS_COLORS.length],
      };
    });
  }, [philosophers, n]);

  const chopstickPositions = useMemo(() => {
    const radius = 140;
    return chopsticks.map((c, i) => {
      const p1Angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const p2Angle = (2 * Math.PI * ((i + 1) % n)) / n - Math.PI / 2;
      let midAngle = (p1Angle + p2Angle) / 2;
      if (Math.abs(p2Angle - p1Angle) > Math.PI) {
        midAngle = midAngle + Math.PI;
      }
      const radius2 = 110;
      return {
        ...c,
        x: 200 + radius2 * Math.cos(midAngle),
        y: 190 + radius2 * Math.sin(midAngle),
        heldBy: c.heldBy,
        semaphore: c.semaphore,
      };
    });
  }, [chopsticks, n]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-6 backdrop-blur-sm"
    >
      <h3 className="text-sm font-semibold text-surface-300 mb-4 uppercase tracking-wider">
        Dining Philosophers Visualization
      </h3>

      {/* Circular Table SVG */}
      <div className="flex justify-center mb-6">
        <svg width="400" height="380" viewBox="0 0 400 380" className="max-w-full">
          {/* Table */}
          <circle cx="200" cy="190" r="155" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx="200" cy="190" r="155" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />

          {/* Center plate icon */}
          <text x="200" y="185" textAnchor="middle" fontSize="28" className="select-none pointer-events-none">{"\uD83C\uDF7D\uFE0F"}</text>
          <text x="200" y="205" textAnchor="middle" fontSize="9" fill="#64748b" className="select-none pointer-events-none">Shared Table</text>

          {/* Chopsticks */}
          {chopstickPositions.map((c, i) => (
            <g key={`chop-${i}`}
              className="cursor-pointer"
              onMouseEnter={(e) => onHover?.('chopstick', c.id, e.clientX, e.clientY)}
              onMouseLeave={() => onLeave?.()}
            >
              {/* Chopstick background */}
              <line
                x1={c.x - 12} y1={c.y - 12}
                x2={c.x + 12} y2={c.y + 12}
                stroke={c.heldBy !== null ? PROCESS_COLORS[c.heldBy % PROCESS_COLORS.length] : '#475569'}
                strokeWidth={c.heldBy !== null ? 4.5 : 2.5}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {/* Glow effect when held */}
              {c.heldBy !== null && (
                <line
                  x1={c.x - 12} y1={c.y - 12}
                  x2={c.x + 12} y2={c.y + 12}
                  stroke={PROCESS_COLORS[c.heldBy % PROCESS_COLORS.length]}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={0.25}
                />
              )}
              {/* Semaphore indicator circle */}
              <circle cx={c.x} cy={c.y} r={6}
                fill={c.semaphore === 1 ? '#22c55e' : '#ef4444'}
                opacity={0.9}
              />
              <text x={c.x} y={c.y + 3} textAnchor="middle" fontSize="7"
                fill="white" fontWeight="bold" className="select-none pointer-events-none">
                {c.semaphore}
              </text>
              {/* Chopstick ID */}
              <text x={c.x + 14} y={c.y + 14} fontSize="7" fill="#94a3b8" className="select-none pointer-events-none">C{c.id}</text>
            </g>
          ))}

          {/* Philosophers */}
          {layout.map((p) => {
            const stateColor = STATE_COLORS[p.state] || '#64748b';
            const isEating = p.state === 'EATING';
            const isWaiting = p.state === 'WAITING';
            const isHungry = p.state === 'HUNGRY';
            return (
              <g
                key={`phil-${p.id}`}
                className="cursor-pointer"
                onMouseEnter={(e) => onHover?.('philosopher', p.id, e.clientX, e.clientY)}
                onMouseLeave={() => onLeave?.()}
              >
                {/* Glow ring for eating */}
                {isEating && (
                  <motion.circle
                    cx={p.x} cy={p.y} r={34}
                    fill="none" stroke={stateColor} strokeWidth={2.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
                {/* Dashed ring for waiting */}
                {isWaiting && (
                  <motion.circle
                    cx={p.x} cy={p.y} r={34}
                    fill="none" stroke={stateColor} strokeWidth={2}
                    strokeDasharray="4 4"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 0.15, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
                {/* Pulse ring for hungry */}
                {isHungry && (
                  <motion.circle
                    cx={p.x} cy={p.y} r={34}
                    fill="none" stroke={stateColor} strokeWidth={1.5}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}

                {/* Philosopher circle */}
                <circle cx={p.x} cy={p.y} r={28} fill="#0f172a" stroke={stateColor}
                  strokeWidth={2.5} className="transition-all duration-300" />
                <circle cx={p.x} cy={p.y} r={24}
                  fill={stateColor} opacity={0.15} className="transition-all duration-300" />

                {/* State icon */}
                <text x={p.x} y={p.y - 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize="20" className="select-none pointer-events-none">
                  {p.state === 'EATING' ? '\uD83C\uDF7D\uFE0F' :
                   p.state === 'HUNGRY' ? '\uD83D\uDE0B' :
                   p.state === 'THINKING' ? '\uD83D\uDCAD' : '\u23F3'}
                </text>

                {/* Label */}
                <text x={p.x} y={p.y + 18} textAnchor="middle" fontSize="9"
                  fill="#e2e8f0" fontWeight="bold" className="select-none pointer-events-none">P{p.id}</text>

                {/* State badge */}
                <rect
                  x={p.x - 24} y={p.y + 22}
                  width={48} height={14} rx={4}
                  fill={stateColor} opacity={0.9}
                />
                <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize="7"
                  fill="white" fontWeight="bold" className="select-none pointer-events-none">
                  {p.state}
                </text>

                {/* Meals counter */}
                <text x={p.x} y={p.y - 36} textAnchor="middle" fontSize="9"
                  fill="#94a3b8" className="select-none pointer-events-none">
                  {p.mealsEaten}/3 {'\uD83C\uDF7D\uFE0F'}
                </text>

                {/* Holding indicators */}
                {p.holding.length > 0 && p.holding.map((chopId, hi) => (
                  <text key={hi} x={p.x + (hi * 14) - 7} y={p.y - 42} textAnchor="middle" fontSize="7"
                    fill={PROCESS_COLORS[p.id % PROCESS_COLORS.length]} className="select-none pointer-events-none">
                    C{chopId}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chopstick Semaphore States */}
      <div className="mb-4">
        <div className="text-xs text-surface-400 font-medium mb-2">Binary Semaphore States (Chopsticks)</div>
        <div className="flex flex-wrap gap-2">
          {chopsticks?.map(c => (
            <div key={c.id} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all ${
              c.heldBy !== null
                ? 'border-surface-600 bg-surface-800/60'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className="text-surface-400">C{c.id}:</span>
                {c.heldBy !== null ? (
                  <span style={{ color: PROCESS_COLORS[c.heldBy % PROCESS_COLORS.length] }}>
                    HELD by P{c.heldBy} (sem=0)
                  </span>
                ) : (
                  <span>FREE (sem=1)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Philosopher list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {philosophers?.map(p => (
          <div key={p.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/30 cursor-pointer hover:bg-surface-800/60 transition-all"
            onMouseEnter={(e) => onHover?.('philosopher', p.id, e.clientX, e.clientY)}
            onMouseLeave={() => onLeave?.()}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATE_COLORS[p.state] }} />
            <span className="text-xs font-medium text-surface-200">P{p.id}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              p.state === 'EATING' ? 'bg-emerald-500/15 text-emerald-400' :
              p.state === 'HUNGRY' ? 'bg-amber-500/15 text-amber-400' :
              p.state === 'WAITING' ? 'bg-red-500/15 text-red-400' :
              'bg-surface-700 text-surface-400'
            }`}>{p.state}</span>
            <span className="text-[10px] text-surface-500 ml-auto font-mono">{p.mealsEaten}/3</span>
            {p.waitReason && (
              <span className="text-[9px] text-red-400/60 truncate" title={p.waitReason}>
                {p.waitReason.length > 12 ? p.waitReason.slice(0, 12) + '...' : p.waitReason}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
