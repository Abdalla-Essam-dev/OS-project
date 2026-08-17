import { motion, AnimatePresence } from 'framer-motion';
import { PROCESS_COLORS, STATE_COLORS } from '../utils/validation';

export default function ProcessTooltip({ tooltip, frame, problem }) {
  if (!tooltip || !frame) return null;

  const { type, id, x, y } = tooltip;
  let data = null;
  let title = '';
  let details = [];

  if (problem === 'bounded-buffer') {
    if (type === 'producer') {
      data = frame.producers?.find(p => p.id === id);
      title = `Producer ${id}`;
      if (data) {
        details = [
          { label: 'State', value: data.state, color: STATE_COLORS[data.state] || '#64748b' },
          { label: 'Phase', value: `${data.phase}/3` },
          { label: 'Produced', value: `${data.itemsProduced}/3` },
          { label: 'Holding', value: data.holding?.length ? data.holding.join(', ') : 'none' },
          ...(data.waitReason ? [{ label: 'Waiting', value: data.waitReason, color: '#ef4444' }] : []),
        ];
      }
    } else if (type === 'consumer') {
      data = frame.consumers?.find(c => c.id === id);
      title = `Consumer ${id}`;
      if (data) {
        details = [
          { label: 'State', value: data.state, color: STATE_COLORS[data.state] || '#64748b' },
          { label: 'Phase', value: `${data.phase}/3` },
          { label: 'Consumed', value: `${data.itemsConsumed}` },
          { label: 'Holding', value: data.holding?.length ? data.holding.join(', ') : 'none' },
          ...(data.waitReason ? [{ label: 'Waiting', value: data.waitReason, color: '#ef4444' }] : []),
        ];
      }
    } else if (type === 'buffer_slot') {
      const slot = frame.buffer?.[id];
      title = `Buffer Slot ${id}`;
      details = [
        { label: 'Content', value: slot ? `Item #${slot.id}` : 'Empty', color: slot ? '#22c55e' : '#64748b' },
        ...(slot ? [{ label: 'Producer', value: `P${slot.producerId}` }] : []),
      ];
    }
  }

  if (problem === 'readers-writers') {
    if (type === 'reader') {
      data = frame.readers?.find(r => r.id === id);
      title = `Reader ${id}`;
      if (data) {
        details = [
          { label: 'State', value: data.state, color: STATE_COLORS[data.state] || '#64748b' },
          { label: 'Phase', value: `${data.phase}` },
          { label: 'Reads Done', value: `${data.readsDone}/${data.totalReads}` },
          { label: 'Holding', value: data.holding?.length ? data.holding.join(', ') : 'none' },
          ...(data.waitReason ? [{ label: 'Waiting', value: data.waitReason, color: '#ef4444' }] : []),
        ];
      }
    } else if (type === 'writer') {
      data = frame.writers?.find(w => w.id === id);
      title = `Writer ${id}`;
      if (data) {
        details = [
          { label: 'State', value: data.state, color: STATE_COLORS[data.state] || '#64748b' },
          { label: 'Phase', value: `${data.phase}` },
          { label: 'Writes Done', value: `${data.writesDone}/${data.totalWrites}` },
          { label: 'Holding', value: data.holding?.length ? data.holding.join(', ') : 'none' },
          ...(data.waitReason ? [{ label: 'Waiting', value: data.waitReason, color: '#ef4444' }] : []),
        ];
      }
    } else if (type === 'resource') {
      const lock = frame.resourceLock;
      title = 'Shared Resource';
      details = [
        { label: 'Status', value: lock?.locked ? 'LOCKED' : 'FREE', color: lock?.locked ? '#ef4444' : '#22c55e' },
        ...(lock?.locked ? [
          { label: 'Holder', value: lock.holder },
          { label: 'Type', value: lock.type },
        ] : []),
        { label: 'Active Readers', value: `${frame.rc || 0}` },
      ];
    }
  }

  if (problem === 'dining-philosophers') {
    if (type === 'philosopher') {
      data = frame.philosophers?.find(p => p.id === id);
      title = `Philosopher ${id}`;
      if (data) {
        details = [
          { label: 'State', value: data.state, color: STATE_COLORS[data.state] || '#64748b' },
          { label: 'Meals Eaten', value: `${data.mealsEaten}/3` },
          { label: 'Left Chopstick', value: `C${data.leftChopstick}` },
          { label: 'Right Chopstick', value: `C${data.rightChopstick}` },
          { label: 'Holding', value: data.holding?.length ? data.holding.map(c => `C${c}`).join(', ') : 'none' },
          ...(data.waitReason ? [{ label: 'Blocked', value: data.waitReason, color: '#ef4444' }] : []),
        ];
      }
    } else if (type === 'chopstick') {
      data = frame.chopsticks?.find(c => c.id === id);
      title = `Chopstick ${id}`;
      if (data) {
        details = [
          { label: 'Semaphore', value: data.semaphore === 1 ? '1 (FREE)' : '0 (HELD)', color: data.semaphore === 1 ? '#22c55e' : '#ef4444' },
          ...(data.heldBy !== null ? [{ label: 'Held By', value: `P${data.heldBy}`, color: PROCESS_COLORS[data.heldBy % PROCESS_COLORS.length] }] : []),
        ];
      }
    }
  }

  if (!data && type !== 'buffer_slot' && type !== 'resource') return null;

  const tooltipX = Math.min(Math.max(x + 12, 8), window.innerWidth - 260);
  const tooltipY = Math.min(Math.max(y - 8, 8), window.innerHeight - 200);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="fixed z-[100] pointer-events-none"
        style={{ left: tooltipX, top: tooltipY }}
      >
        <div className="bg-surface-900/95 border border-surface-600/60 rounded-xl px-3.5 py-2.5 shadow-xl backdrop-blur-md min-w-[180px] max-w-[240px]">
          <div className="text-[11px] font-bold text-surface-100 mb-1.5 pb-1.5 border-b border-surface-700/50">
            {title}
          </div>
          <div className="space-y-1">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-[10px]">
                <span className="text-surface-400 shrink-0">{d.label}</span>
                <span
                  className="font-semibold text-right truncate"
                  style={{ color: d.color || '#e2e8f0' }}
                >
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
