import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export default function ExecutionLog({ frame }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [frame?.log?.length]);

  const logs = frame?.log || [];
  const recentLogs = logs.slice(-30);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
          Execution Log
        </h3>
        <span className="ml-auto text-[10px] text-surface-500 font-mono">
          {logs.length} entries
        </span>
      </div>

      <div
        ref={scrollRef}
        className="h-48 overflow-y-auto rounded-xl bg-surface-950/80 border border-surface-800/60 p-3 font-mono text-[11px] leading-relaxed"
      >
        {recentLogs.length === 0 ? (
          <div className="text-surface-600 text-center py-6">Waiting for simulation...</div>
        ) : (
          recentLogs.map((entry, i) => (
            <div key={i} className="flex gap-2 py-0.5 hover:bg-surface-800/30 rounded">
              <span className="text-surface-500 shrink-0">{entry.time}</span>
              <span className={`${
                entry.srcType === 'producer' ? 'text-emerald-400' :
                entry.srcType === 'consumer' ? 'text-amber-400' :
                entry.srcType === 'reader' ? 'text-blue-400' :
                entry.srcType === 'writer' ? 'text-orange-400' :
                entry.srcType === 'philosopher' ? 'text-purple-400' :
                'text-surface-300'
              }`}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
