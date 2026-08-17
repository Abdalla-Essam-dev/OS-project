import { motion } from 'framer-motion';
import { PROCESS_COLORS, STATE_COLORS } from '../utils/validation';

export default function ReadersWritersViz({ frame, onHover, onLeave }) {
  if (!frame) return null;
  const { readers, writers, rc, semaphores, resourceLock, waitQueues, priorityMode, waitingWriters } = frame;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">
          Readers-Writers Visualization
        </h3>
        {priorityMode && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            priorityMode === 'reader-preference'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
          }`}>
            {priorityMode === 'reader-preference' ? 'Reader Preference' : 'Writer Preference'}
          </span>
        )}
      </div>

      {/* Central Resource */}
      <div className="flex justify-center mb-6">
        <div
          className={`relative w-48 h-32 rounded-2xl border-2 flex flex-col items-center justify-center
            transition-all duration-400 cursor-pointer ${
            resourceLock?.locked
              ? resourceLock.type === 'reader'
                ? 'border-blue-500/60 bg-blue-500/10 glow-blue'
                : 'border-orange-500/60 bg-orange-500/10 glow-yellow'
              : 'border-surface-600/40 bg-surface-800/40 hover:border-surface-500/60'
          }`}
          onMouseEnter={(e) => onHover?.('resource', 0, e.clientX, e.clientY)}
          onMouseLeave={() => onLeave?.()}
        >
          <div className="text-3xl mb-1">
            {resourceLock?.locked ? (resourceLock.type === 'reader' ? '\uD83D\uDCD6' : '\u270F\uFE0F') : '\uD83D\uDCC4'}
          </div>
          <div className="text-xs font-semibold text-surface-300">Shared Resource</div>
          {resourceLock?.locked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                bg-surface-800 border border-surface-600 text-surface-200"
            >
              {resourceLock.holder}
            </motion.div>
          )}
          <div className="absolute bottom-2 text-[10px] text-surface-400">
            {resourceLock?.locked
              ? resourceLock.type === 'reader' ? 'Read-locked' : 'Write-locked (exclusive)'
              : 'Unlocked'}
          </div>
        </div>
      </div>

      {/* Semaphores + RC */}
      <div className={`grid ${semaphores?.readTry !== undefined ? 'grid-cols-4' : 'grid-cols-3'} gap-3 mb-5`}>
        <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-3 text-center">
          <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">mutex</div>
          <div className={`text-2xl font-bold font-mono ${semaphores?.mutex > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {semaphores?.mutex ?? 0}
          </div>
        </div>
        <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-3 text-center">
          <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">wrt_mutex</div>
          <div className={`text-2xl font-bold font-mono ${semaphores?.wrt > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {semaphores?.wrt ?? 0}
          </div>
        </div>
        <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-3 text-center">
          <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">reader_count</div>
          <div className={`text-2xl font-bold font-mono ${rc > 0 ? 'text-blue-400' : 'text-surface-400'}`}>
            {rc}
          </div>
        </div>
        {semaphores?.readTry !== undefined && (
          <div className="bg-surface-800/60 border border-surface-700/40 rounded-xl p-3 text-center">
            <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">readTry</div>
            <div className={`text-2xl font-bold font-mono ${semaphores.readTry > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {semaphores.readTry}
            </div>
          </div>
        )}
      </div>

      {/* Writer preference indicator */}
      {priorityMode === 'writer-preference' && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center justify-between">
          <span>Writers Waiting: <strong>{waitingWriters || 0}</strong></span>
          <span className="text-[10px] text-orange-400/60">New readers blocked while writers wait</span>
        </div>
      )}

      {/* Wait Queues */}
      <div className="mb-5">
        <div className="text-xs text-surface-400 font-medium mb-2">Semaphore Wait Queues</div>
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

      {/* Readers + Writers lists */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-surface-400 font-medium mb-2">
            Readers <span className="text-surface-600">({readers?.filter(r => r.state === 'ACTIVE' || r.state === 'WAITING').length} active)</span>
          </div>
          <div className="space-y-1.5">
            {readers?.map(r => (
              <div
                key={r.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/30 cursor-pointer hover:bg-surface-800/60 transition-all"
                onMouseEnter={(e) => onHover?.('reader', r.id, e.clientX, e.clientY)}
                onMouseLeave={() => onLeave?.()}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROCESS_COLORS[r.id % PROCESS_COLORS.length] }} />
                <span className="text-xs font-medium text-surface-200">R{r.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  r.state === 'DONE' ? 'bg-surface-700 text-surface-400' :
                  r.state === 'WAITING' ? 'bg-red-500/15 text-red-400' :
                  r.state === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400' :
                  'bg-surface-700 text-surface-400'
                }`}>{r.state}</span>
                <span className="text-[10px] text-surface-500 ml-auto font-mono">reads:{r.readsDone}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-surface-400 font-medium mb-2">
            Writers <span className="text-surface-600">({writers?.filter(w => w.state === 'ACTIVE' || w.state === 'WAITING').length} active)</span>
          </div>
          <div className="space-y-1.5">
            {writers?.map(w => (
              <div
                key={w.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/30 cursor-pointer hover:bg-surface-800/60 transition-all"
                onMouseEnter={(e) => onHover?.('writer', w.id, e.clientX, e.clientY)}
                onMouseLeave={() => onLeave?.()}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PROCESS_COLORS[(w.id + 3) % PROCESS_COLORS.length] }} />
                <span className="text-xs font-medium text-surface-200">W{w.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  w.state === 'DONE' ? 'bg-surface-700 text-surface-400' :
                  w.state === 'WAITING' ? 'bg-red-500/15 text-red-400' :
                  w.state === 'ACTIVE' ? 'bg-orange-500/15 text-orange-400' :
                  'bg-surface-700 text-surface-400'
                }`}>{w.state}</span>
                <span className="text-[10px] text-surface-500 ml-auto font-mono">writes:{w.writesDone}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
