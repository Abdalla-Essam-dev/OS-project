import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Gauge } from 'lucide-react';

export default function PlaybackControls({
  isPlaying, onTogglePlay, onStep, onStepBack, onReset,
  speed, onSpeedChange, currentFrame, totalFrames
}) {
  const speeds = [0.5, 1, 2, 4];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-4 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          disabled={totalFrames === 0}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
            ${isPlaying
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
              : 'bg-accent-500/15 border border-accent-500/30 text-accent-400 hover:bg-accent-500/25'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Step Back */}
        <button
          onClick={onStepBack}
          disabled={totalFrames === 0 || currentFrame <= 0}
          className="w-10 h-10 rounded-xl flex items-center justify-center
            bg-surface-800/60 border border-surface-700/40 text-surface-300
            hover:bg-surface-700/60 hover:text-surface-100
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Step Backward (←)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        {/* Step Forward */}
        <button
          onClick={onStep}
          disabled={totalFrames === 0 || currentFrame >= totalFrames - 1}
          className="w-10 h-10 rounded-xl flex items-center justify-center
            bg-surface-800/60 border border-surface-700/40 text-surface-300
            hover:bg-surface-700/60 hover:text-surface-100
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Step Forward (→)"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={totalFrames === 0}
          className="w-10 h-10 rounded-xl flex items-center justify-center
            bg-surface-800/60 border border-surface-700/40 text-surface-300
            hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30
            disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          title="Reset (Esc)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-surface-700/50" />

        {/* Speed */}
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-surface-400" />
          <div className="flex gap-1">
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                  speed === s
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                    : 'bg-surface-800/40 text-surface-500 border border-surface-700/30 hover:text-surface-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Frame counter */}
        <div className="ml-auto text-[10px] text-surface-500 font-mono">
          {totalFrames > 0 ? (
            <>
              Frame <span className="text-surface-300 font-semibold">{currentFrame + 1}</span>
              <span className="text-surface-600"> / </span>
              <span>{totalFrames}</span>
            </>
          ) : (
            <span>No simulation loaded</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 bg-surface-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent-500 rounded-full"
          animate={{ width: totalFrames > 0 ? `${((currentFrame + 1) / totalFrames) * 100}%` : '0%' }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </motion.div>
  );
}
