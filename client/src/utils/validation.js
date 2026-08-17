export const PROBLEMS = [
  { id: 'bounded-buffer', label: 'Bounded Buffer', desc: 'Producer-Consumer with Monitors' },
  { id: 'readers-writers', label: 'Readers-Writers', desc: 'Shared Resource with Semaphores' },
  { id: 'dining-philosophers', label: 'Dining Philosophers', desc: 'Deadlock with Binary Semaphores' },
];

export const STRATEGIES = {
  'dining-philosophers': [
    { id: 'asymmetric', label: 'Asymmetric Pickup', desc: 'Even pick left first, odd pick right first' },
    { id: 'limit_seats', label: 'Limit to N-1', desc: 'At most N-1 philosophers try to eat' },
    { id: 'both_at_once', label: 'Both at Once', desc: 'Acquire both chopsticks atomically or none' },
  ],
  'readers-writers': [
    { id: 'reader-preference', label: 'Reader Preference', desc: 'Readers preferred over writers' },
    { id: 'writer-preference', label: 'Writer Preference', desc: 'Writers preferred over readers' },
  ],
};

export function sanitizeInput(value) {
  return String(value).replace(/[^0-9]/g, '');
}

export function validateField(value, min) {
  if (value === '' || value === undefined || value === null) {
    return { valid: false, error: 'Required' };
  }
  const str = String(value);
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'Only positive integers' };
  }
  const num = parseInt(str, 10);
  if (num < min) {
    return { valid: false, error: `Must be >= ${min}` };
  }
  return { valid: true, error: null };
}

export function validateConfig(problem, config) {
  const errors = {};
  if (problem === 'bounded-buffer') {
    const bs = validateField(config.bufferSize, 1);
    if (!bs.valid) errors.bufferSize = bs.error;
    const np = validateField(config.numProducers, 1);
    if (!np.valid) errors.numProducers = np.error;
    const nc = validateField(config.numConsumers, 1);
    if (!nc.valid) errors.numConsumers = nc.error;
  }
  if (problem === 'readers-writers') {
    const nr = validateField(config.numReaders, 1);
    if (!nr.valid) errors.numReaders = nr.error;
    const nw = validateField(config.numWriters, 1);
    if (!nw.valid) errors.numWriters = nw.error;
    const rt = validateField(config.readTime, 1);
    if (!rt.valid) errors.readTime = rt.error;
    const wt = validateField(config.writeTime, 1);
    if (!wt.valid) errors.writeTime = wt.error;
  }
  if (problem === 'dining-philosophers') {
    const np = validateField(config.numPhilosophers, 3);
    if (!np.valid) errors.numPhilosophers = np.error;
    const ed = validateField(config.eatDuration, 1);
    if (!ed.valid) errors.eatDuration = ed.error;
    const td = validateField(config.thinkDuration, 1);
    if (!td.valid) errors.thinkDuration = td.error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export const PROCESS_COLORS = [
  '#6366f1','#10b981','#f59e0b','#f43f5e','#06b6d4',
  '#a855f7','#f97316','#14b8a6','#ec4899','#84cc16',
];

export const STATE_COLORS = {
  THINKING: '#64748b',
  HUNGRY: '#eab308',
  EATING: '#22c55e',
  WAITING: '#ef4444',
  ACTIVE: '#6366f1',
  IDLE: '#334155',
  DONE: '#475569',
  READING: '#3b82f6',
  WRITING: '#f97316',
};
