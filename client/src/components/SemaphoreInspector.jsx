import { motion } from 'framer-motion';
import { Lock, Unlock, Eye } from 'lucide-react';

export default function SemaphoreInspector({ frame, problem }) {
  if (!frame) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-accent-400" />
        <h3 className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
          {problem === 'bounded-buffer' ? 'Monitor Inspector' : 'Semaphore Inspector'}
        </h3>
      </div>

      <div className="space-y-2">
        {/* Monitor-specific: Bounded Buffer */}
        {problem === 'bounded-buffer' && frame.monitor && (
          <>
            {/* Monitor Lock */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
              <div className="flex items-center gap-2">
                {frame.monitor.lock ? (
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="text-xs font-medium text-surface-200">monitor_lock</span>
              </div>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                frame.monitor.lock
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {frame.monitor.lock ? `Held by ${frame.monitor.lockHolder}` : 'FREE'}
              </div>
            </div>

            {/* Buffer Count */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
              <span className="text-xs font-medium text-surface-200">buffer_count</span>
              <span className={`text-sm font-bold font-mono ${
                frame.monitor.count > 0 ? 'text-amber-400' : 'text-surface-400'
              }`}>{frame.monitor.count}</span>
            </div>

            {/* Condition Variable: full */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-surface-200">cv.full (buffer full)</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  frame.monitor.conditionVars?.full?.waitQueue?.length > 0
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-surface-700 text-surface-500'
                }`}>
                  {frame.monitor.conditionVars?.full?.waitQueue?.length || 0} waiting
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(frame.monitor.conditionVars?.full?.waitQueue || []).length === 0 ? (
                  <span className="text-[10px] text-surface-600">empty</span>
                ) : (
                  frame.monitor.conditionVars.full.waitQueue.map((w, i) => (
                    <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                      {w}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Condition Variable: empty */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-surface-200">cv.empty (buffer empty)</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  frame.monitor.conditionVars?.empty?.waitQueue?.length > 0
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-surface-700 text-surface-500'
                }`}>
                  {frame.monitor.conditionVars?.empty?.waitQueue?.length || 0} waiting
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(frame.monitor.conditionVars?.empty?.waitQueue || []).length === 0 ? (
                  <span className="text-[10px] text-surface-600">empty</span>
                ) : (
                  frame.monitor.conditionVars.empty.waitQueue.map((w, i) => (
                    <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                      {w}
                    </span>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Semaphore-based: Readers-Writers and Dining Philosophers */}
        {frame.semaphores && problem !== 'bounded-buffer' && Object.entries(frame.semaphores).map(([name, val]) => (
          <div key={name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
            <div className="flex items-center gap-2">
              {val > 0 ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-red-400" />
              )}
              <span className="text-xs font-medium text-surface-200">{name}</span>
            </div>
            <div className={`text-sm font-bold font-mono ${
              val > 0 ? 'text-emerald-400' : val === 0 ? 'text-red-400' : 'text-amber-400'
            }`}>{val}</div>
          </div>
        ))}

        {/* Reader Count for readers-writers */}
        {problem === 'readers-writers' && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 flex items-center justify-center text-blue-400 text-[10px] font-bold">#</span>
              <span className="text-xs font-medium text-surface-200">reader_count (rc)</span>
            </div>
            <div className={`text-sm font-bold font-mono ${frame.rc > 0 ? 'text-blue-400' : 'text-surface-400'}`}>
              {frame.rc}
            </div>
          </div>
        )}

        {/* Resource Lock for readers-writers */}
        {frame.resourceLock && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
            <span className="text-xs font-medium text-surface-200">Resource Lock</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              frame.resourceLock.locked
                ? frame.resourceLock.type === 'reader' ? 'bg-blue-500/15 text-blue-400' : 'bg-orange-500/15 text-orange-400'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {frame.resourceLock.locked ? `${frame.resourceLock.holder} (${frame.resourceLock.type})` : 'FREE'}
            </span>
          </div>
        )}

        {/* Wait Queues */}
        {frame.waitQueues && Object.entries(frame.waitQueues).map(([name, queue]) => (
          <div key={name} className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
            <div className="text-[10px] text-surface-400 uppercase tracking-wider mb-1">
              {problem === 'bounded-buffer' ? `cv.${name} wait queue` : `${name} wait queue`}
            </div>
            <div className="flex flex-wrap gap-1">
              {queue.length === 0 ? (
                <span className="text-[10px] text-surface-600">empty</span>
              ) : (
                queue.map((w, i) => (
                  <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                    {w}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Priority mode for readers-writers */}
        {frame.priorityMode && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/30">
            <span className="text-xs font-medium text-surface-200">Priority Mode</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              frame.priorityMode === 'reader-preference'
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-orange-500/15 text-orange-400'
            }`}>
              {frame.priorityMode}
            </span>
          </div>
        )}

        {/* Waiting Writers count for writer preference */}
        {frame.waitingWriters !== undefined && frame.waitingWriters > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <span className="text-xs font-medium text-orange-300">Waiting Writers</span>
            <span className="text-sm font-bold text-orange-400">{frame.waitingWriters}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
