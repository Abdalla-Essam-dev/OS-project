import { motion } from 'framer-motion';
import { PROCESS_COLORS, STATE_COLORS } from '../utils/validation';

export default function BoundedBufferViz({ frame, onHover, onLeave }) {
  if (!frame) return null;
  const { buffer, bufferSize, producers, consumers, monitor, waitQueues } = frame;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Bounded Buffer (Monitor) Visualization
        </h3>
        {monitor && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${monitor.lock ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className="text-[10px] text-surface-400 font-mono">
              Monitor Lock: {monitor.lock ? `Held by ${monitor.lockHolder}` : 'FREE'}
            </span>
          </div>
        )}
      </div>

      {/* Monitor Lock Status */}
      {monitor && (
        <div className={`mb-4 px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
          monitor.lock
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <span className="font-medium">
            {monitor.lock ? `Monitor Lock: HELD by ${monitor.lockHolder}` : 'Monitor Lock: AVAILABLE'}
          </span>
          <span className="font-mono">
            Items: {monitor.count}/{bufferSize}
          </span>
        </div>
      )}

      {/* Buffer Grid */}
      <div className="mb-6">
        <div className="text-xs text-surface-400 mb-2 font-medium">
          Circular Buffer [{buffer?.length || 0}/{bufferSize}] &mdash; in={monitor?.in_ptr || 0}, out={monitor?.out_ptr || 0}
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: bufferSize }, (_, i) => {
            const item = buffer?.[i];
            const isFilled = !!item;
            const isInPtr = monitor?.in_ptr === i;
            const isOutPtr = monitor?.out_ptr === i;
            return (
              <motion.div
                key={i}
                layout
                className={`relative w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center
                  transition-all duration-300 cursor-pointer ${
                  isFilled
                    ? 'border-emerald-500/60 bg-emerald-500/15 glow-green'
                    : 'border-surface-600/40 bg-surface-800/40 hover:border-surface-500/60'
                }`}
                onMouseEnter={(e) => onHover?.('buffer_slot', i, e.clientX, e.clientY)}
                onMouseLeave={() => onLeave?.()}
              >
                {isFilled && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: PROCESS_COLORS[item.producerId % PROCESS_COLORS.length] }}
                    >
                      #{item.id}
                    </div>
                  </motion.div>
                )}
                {/* Index label */}
                <span className="absolute bottom-0.5 text-[9px] text-surface-500 font-mono">{i}</span>
                {/* Pointer indicators */}
                {isInPtr && !isFilled && (
                  <span className="absolute -top-1 -right-1 text-[8px] bg-accent-500 text-white rounded px-0.5 font-bold">IN</span>
                )}
                {isOutPtr && !isFilled && (
                  <span className="absolute -top-1 -left-1 text-[8px] bg-amber-500 text-white rounded px-0.5 font-bold">OUT</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Condition Variables */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-3">
          <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">Condition Variable &apos;full&apos;</div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold font-mono ${monitor?.count > 0 ? 'text-amber-400' : 'text-surface-500'}`}>
              wait_queue: {waitQueues?.full?.length || 0}
            </span>
            {waitQueues?.full?.length > 0 && (
              <span className="text-[10px] text-red-400">
                {waitQueues.full.join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-3">
          <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">Condition Variable &apos;empty&apos;</div>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold font-mono ${monitor?.count < bufferSize ? 'text-amber-400' : 'text-surface-500'}`}>
              wait_queue: {waitQueues?.empty?.length || 0}
            </span>
            {waitQueues?.empty?.length > 0 && (
              <span className="text-[10px] text-red-400">
                {waitQueues.empty.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Wait Queues */}
      <div className="mb-5">
        <div className="text-xs text-surface-400 font-medium mb-2">Condition Wait Queues</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(waitQueues || {}).map(([name, queue]) => (
            <div key={name} className="bg-surface-800/40 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-surface-500">{name}:</span>{' '}
              {queue.length === 0 ? (
                <span className="text-surface-600">empty</span>
              ) : (
                queue.map((w, i) => (
                  <span key={i}>
                    <span className="text-amber-400 font-medium">{w}</span>
                    {i < queue.length - 1 && <span className="text-surface-600">, </span>}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Processes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-surface-400 font-medium mb-2">Producers</div>
          <div className="space-y-1.5">
            {producers?.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/30 cursor-pointer hover:bg-surface-800/60 transition-all"
                onMouseEnter={(e) => onHover?.('producer', p.id, e.clientX, e.clientY)}
                onMouseLeave={() => onLeave?.()}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROCESS_COLORS[p.id % PROCESS_COLORS.length] }} />
                <span className="text-xs font-medium text-surface-200">P{p.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  p.state === 'DONE' ? 'bg-surface-700 text-surface-400' :
                  p.state === 'WAITING' ? 'bg-red-500/15 text-red-400' :
                  p.state === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' :
                  'bg-surface-700 text-surface-400'
                }`}>{p.state}</span>
                <span className="text-[10px] text-surface-500 ml-auto font-mono">{p.itemsProduced}/3</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-surface-400 font-medium mb-2">Consumers</div>
          <div className="space-y-1.5">
            {consumers?.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/30 cursor-pointer hover:bg-surface-800/60 transition-all"
                onMouseEnter={(e) => onHover?.('consumer', c.id, e.clientX, e.clientY)}
                onMouseLeave={() => onLeave?.()}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROCESS_COLORS[(c.id + 5) % PROCESS_COLORS.length] }} />
                <span className="text-xs font-medium text-surface-200">C{c.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  c.state === 'DONE' ? 'bg-surface-700 text-surface-400' :
                  c.state === 'WAITING' ? 'bg-red-500/15 text-red-400' :
                  c.state === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' :
                  'bg-surface-700 text-surface-400'
                }`}>{c.state}</span>
                <span className="text-[10px] text-surface-500 ml-auto font-mono">{c.itemsConsumed}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
