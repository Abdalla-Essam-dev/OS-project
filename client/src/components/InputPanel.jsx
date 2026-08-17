import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, AlertTriangle, ChevronDown, Play } from 'lucide-react';
import { PROBLEMS, STRATEGIES, sanitizeInput, validateConfig } from '../utils/validation';

const DEFAULT_CONFIGS = {
  'bounded-buffer': { bufferSize: '5', numProducers: '2', numConsumers: '2' },
  'readers-writers': { numReaders: '3', numWriters: '2', readTime: '2', writeTime: '3', priorityMode: 'reader-preference' },
  'dining-philosophers': { numPhilosophers: '5', eatDuration: '3', thinkDuration: '2', strategy: 'asymmetric' },
};

export default function InputPanel({ onSimulate, isRunning }) {
  const [problem, setProblem] = useState('bounded-buffer');
  const [config, setConfig] = useState(DEFAULT_CONFIGS['bounded-buffer']);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setConfig(DEFAULT_CONFIGS[problem]);
    setErrors({});
  }, [problem]);

  useEffect(() => {
    const { errors: errs } = validateConfig(problem, config);
    setErrors(errs);
  }, [problem, config]);

  const canSimulate = validateConfig(problem, config).valid && !isRunning;

  const updateField = (field, raw) => {
    if (field === 'priorityMode' || field === 'strategy') {
      setConfig(prev => ({ ...prev, [field]: raw }));
    } else {
      setConfig(prev => ({ ...prev, [field]: sanitizeInput(raw) }));
    }
  };

  const handleSubmit = () => {
    if (!canSimulate) return;
    const parsed = {};
    for (const [k, v] of Object.entries(config)) {
      parsed[k] = ['priorityMode', 'strategy'].includes(k) ? v : parseInt(v, 10);
    }
    onSimulate(problem, parsed);
  };

  const inputCls = (field) => {
    const base = 'w-full bg-surface-800/60 border rounded-lg px-3 py-2 text-sm text-surface-100 ' +
      'placeholder:text-surface-500 transition-all duration-200 ' +
      'focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30';
    return errors[field]
      ? `${base} border-red-500/60 bg-red-500/5`
      : `${base} border-surface-600/40 hover:border-surface-500/60`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-900/50 border border-surface-700/50 rounded-2xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <Settings className="w-5 h-5 text-accent-400" />
        <h2 className="text-lg font-semibold text-surface-100">Configuration</h2>
      </div>

      {/* Problem selector */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-surface-400 mb-1.5">Problem</label>
        <div className="grid grid-cols-3 gap-2">
          {PROBLEMS.map(p => (
            <button
              key={p.id}
              onClick={() => setProblem(p.id)}
              className={`px-3 py-2.5 rounded-xl text-left transition-all duration-200 border ${
                problem === p.id
                  ? 'bg-accent-500/15 border-accent-500/40 text-accent-400'
                  : 'bg-surface-800/40 border-surface-700/40 text-surface-400 hover:border-surface-600 hover:text-surface-200'
              }`}
            >
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-[10px] opacity-60 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic config fields */}
      <AnimatePresence mode="wait">
        <motion.div
          key={problem}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5"
        >
          {problem === 'bounded-buffer' && (
            <>
              <FieldInput label="Buffer Size (N)" field="bufferSize" value={config.bufferSize} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <FieldInput label="Producers" field="numProducers" value={config.numProducers} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <FieldInput label="Consumers" field="numConsumers" value={config.numConsumers} onChange={updateField} cls={inputCls} errors={errors} min={1} />
            </>
          )}
          {problem === 'readers-writers' && (
            <>
              <FieldInput label="Readers" field="numReaders" value={config.numReaders} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <FieldInput label="Writers" field="numWriters" value={config.numWriters} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <FieldInput label="Read Time" field="readTime" value={config.readTime} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <FieldInput label="Write Time" field="writeTime" value={config.writeTime} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-surface-400 mb-1">Priority Mode</label>
                <div className="relative">
                  <select
                    value={config.priorityMode}
                    onChange={e => updateField('priorityMode', e.target.value)}
                    className="w-full appearance-none bg-surface-800/60 border border-surface-600/40
                      rounded-lg px-3 py-2 text-sm text-surface-100 cursor-pointer
                      hover:border-surface-500/60 transition-all
                      focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
                  >
                    {STRATEGIES['readers-writers'].map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}
          {problem === 'dining-philosophers' && (
            <>
              <FieldInput label="Philosophers (N≥3)" field="numPhilosophers" value={config.numPhilosophers} onChange={updateField} cls={inputCls} errors={errors} min={3} />
              <FieldInput label="Eat Duration" field="eatDuration" value={config.eatDuration} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <FieldInput label="Think Duration" field="thinkDuration" value={config.thinkDuration} onChange={updateField} cls={inputCls} errors={errors} min={1} />
              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-medium text-surface-400 mb-1">Deadlock Strategy</label>
                <div className="grid grid-cols-3 gap-2">
                  {STRATEGIES['dining-philosophers'].map(s => (
                    <button
                      key={s.id}
                      onClick={() => updateField('strategy', s.id)}
                      className={`px-3 py-2 rounded-lg text-left text-xs transition-all border ${
                        config.strategy === s.id
                          ? 'bg-accent-500/15 border-accent-500/40 text-accent-400'
                          : 'bg-surface-800/40 border-surface-700/40 text-surface-400 hover:border-surface-600'
                      }`}
                    >
                      <div className="font-semibold">{s.label}</div>
                      <div className="opacity-60 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Validation summary + run button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSimulate}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm
            bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/20
            disabled:bg-surface-700 disabled:text-surface-500 disabled:shadow-none disabled:cursor-not-allowed
            transition-all duration-200"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running...' : 'Start Simulation'}
        </button>
        {Object.keys(errors).length > 0 && (
          <span className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Fix validation errors
          </span>
        )}
      </div>
    </motion.div>
  );
}

function FieldInput({ label, field, value, onChange, cls, errors, min }) {
  return (
    <div className="relative">
      <label className="block text-xs font-medium text-surface-400 mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(field, e.target.value)}
        placeholder={String(min)}
        className={cls(field)}
      />
      {errors[field] && (
        <div className="error-badge" title={errors[field]}><span>!</span></div>
      )}
    </div>
  );
}
