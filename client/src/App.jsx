import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Keyboard, AlertTriangle } from 'lucide-react';
import InputPanel from './components/InputPanel';
import BoundedBufferViz from './components/BoundedBufferViz';
import ReadersWritersViz from './components/ReadersWritersViz';
import DiningPhilosophersViz from './components/DiningPhilosophersViz';
import SemaphoreInspector from './components/SemaphoreInspector';
import ExecutionLog from './components/ExecutionLog';
import PlaybackControls from './components/PlaybackControls';
import ProcessTooltip from './components/ProcessTooltip';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [problem, setProblem] = useState(null);
  const [frames, setFrames] = useState([]);
  const [totalFrames, setTotalFrames] = useState(0);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const timerRef = useRef(null);

  const currentFrame = frames[currentFrameIdx] || null;

  const getInterval = useCallback(() => {
    return Math.round(600 / speed);
  }, [speed]);

  // Playback loop
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentFrameIdx(prev => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, getInterval());
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, frames.length, speed, getInterval]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (frames.length > 0) {
          setIsPlaying(prev => !prev);
        }
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (currentFrameIdx < frames.length - 1) {
          setCurrentFrameIdx(prev => prev + 1);
        }
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (currentFrameIdx > 0) {
          setCurrentFrameIdx(prev => prev - 1);
        }
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [frames.length, currentFrameIdx]);

  const handleSimulate = async (problemType, config) => {
    setIsLoading(true);
    setError(null);
    setProblem(problemType);
    setIsPlaying(false);
    setCurrentFrameIdx(0);
    setTooltip(null);

    try {
      const res = await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem: problemType, config }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.slice(0, 300));
        throw new Error(`Server returned HTML instead of JSON. Is the backend running on port 5000?`);
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setFrames(data.frames);
      setTotalFrames(data.totalFrames);
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot reach server. Make sure the backend is running on port 5000.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
    setTooltip(null);
  };

  const handleFullReset = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
    setFrames([]);
    setTotalFrames(0);
    setProblem(null);
    setError(null);
    setTooltip(null);
  };

  const handleHover = useCallback((type, id, event) => {
    if (event) {
      const rect = event.currentTarget?.getBoundingClientRect?.();
      setTooltip({
        type, id,
        x: rect ? rect.left + rect.width / 2 : event.clientX || 0,
        y: rect ? rect.top : event.clientY || 0,
      });
    } else {
      setTooltip({ type, id, x: 0, y: 0 });
    }
  }, []);

  const handleHoverCoords = useCallback((type, id, x, y) => {
    setTooltip({ type, id, x, y });
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const renderVisualization = () => {
    if (!currentFrame || !problem) return null;
    switch (problem) {
      case 'bounded-buffer':
        return <BoundedBufferViz frame={currentFrame} onHover={handleHoverCoords} onLeave={handleLeave} />;
      case 'readers-writers':
        return <ReadersWritersViz frame={currentFrame} onHover={handleHoverCoords} onLeave={handleLeave} />;
      case 'dining-philosophers':
        return <DiningPhilosophersViz frame={currentFrame} onHover={handleHoverCoords} onLeave={handleLeave} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Tooltip */}
      <ProcessTooltip tooltip={tooltip} frame={currentFrame} problem={problem} />

      {/* Header */}
      <header className="border-b border-surface-800/60 bg-surface-900/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-500/15 border border-accent-500/20 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-accent-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-surface-100 tracking-tight">
                Process Synchronization Simulator
              </h1>
              <p className="text-[10px] text-surface-400">
                Monitors &middot; Semaphores &middot; Mutexes
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-surface-500">
            <Keyboard className="w-3 h-3" />
            <span>Space: Play/Pause</span>
            <span className="text-surface-600">|</span>
            <span>&larr;&rarr;: Step</span>
            <span className="text-surface-600">|</span>
            <span>Esc: Reset</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Input */}
        <InputPanel onSimulate={handleSimulate} isRunning={isLoading} />

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="flex items-center gap-3 text-surface-400">
                <motion.div
                  className="w-5 h-5 border-2 border-accent-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
                <span className="text-sm">Generating simulation frames...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-300">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300 text-xs">
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Controls */}
        {frames.length > 0 && (
          <PlaybackControls
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(prev => !prev)}
            onStep={() => {
              if (currentFrameIdx < frames.length - 1) {
                setCurrentFrameIdx(prev => prev + 1);
              }
            }}
            onStepBack={() => {
              if (currentFrameIdx > 0) {
                setCurrentFrameIdx(prev => prev - 1);
              }
            }}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={setSpeed}
            currentFrame={currentFrameIdx}
            totalFrames={totalFrames}
          />
        )}

        {/* Visualization + Side panels */}
        {currentFrame && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main viz */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={problem}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {renderVisualization()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Side panels */}
            <div className="space-y-5">
              <SemaphoreInspector frame={currentFrame} problem={problem} />
              <ExecutionLog frame={currentFrame} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!frames.length && !isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-5xl mb-4">&#128274;</div>
            <h3 className="text-lg font-semibold text-surface-300 mb-2">No Simulation Running</h3>
            <p className="text-sm text-surface-500 max-w-md mx-auto">
              Select a synchronization problem above, configure the parameters, and click
              <span className="text-accent-400 font-semibold"> Start Simulation </span>
              to see it in action.
            </p>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-surface-800/40 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center text-[10px] text-surface-500">
          Classical Process Synchronization Simulator
        </div>
      </footer>
    </div>
  );
}
