/**
 * Bounded Buffer (Producer-Consumer) Problem
 * Uses Monitors with Condition Variables: full, empty
 * Monitor provides mutual exclusion via lock + condition variables for synchronization.
 */

function cloneArray(a) { return a.map(x => (typeof x === 'object' && x !== null ? { ...x } : x)); }

module.exports = function boundedBufferSim(cfg) {
  const { bufferSize, numProducers, numConsumers, delay } = cfg;
  const frames = [];
  let tick = 0;
  let log = [];

  // Monitor state
  const monitor = {
    lock: false,           // true = locked by a process
    lockHolder: null,      // who holds the monitor lock
    count: 0,              // items currently in buffer
    in_ptr: 0,             // circular buffer write pointer
    out_ptr: 0,            // circular buffer read pointer
    conditionVars: {
      full: { waitQueue: [], signalQueue: [] },
      empty: { waitQueue: [], signalQueue: [] },
    },
  };

  const buffer = []; // circular array representation
  for (let i = 0; i < bufferSize; i++) buffer.push(null);

  // Processes
  const producers = [];
  for (let i = 0; i < numProducers; i++) {
    producers.push({
      id: i, state: 'IDLE', phase: 0, itemsProduced: 0,
      waitReason: null, holding: [], itemId: null,
    });
  }
  const consumers = [];
  for (let i = 0; i < numConsumers; i++) {
    consumers.push({
      id: i, state: 'IDLE', phase: 0, itemsConsumed: 0,
      waitReason: null, holding: [], consumedItemId: null,
    });
  }

  let itemIdCounter = 0;

  // Phases for producer:
  // 0: check if buffer full -> wait on empty condition OR proceed
  // 1: acquire monitor lock
  // 2: produce item into buffer
  // 3: signal empty condition, release lock
  // Phases for consumer:
  // 0: check if buffer empty -> wait on full condition OR proceed
  // 1: acquire monitor lock
  // 2: consume item from buffer
  // 3: signal full condition, release lock

  function snap(msg, srcId, srcType) {
    frames.push({
      tick: tick++,
      buffer: buffer.map(x => x),
      bufferSize,
      count: monitor.count,
      producers: producers.map(p => ({ ...p, holding: [...p.holding] })),
      consumers: consumers.map(c => ({ ...c, holding: [...c.holding] })),
      semaphores: { count: monitor.count, in_ptr: monitor.in_ptr, out_ptr: monitor.out_ptr },
      monitor: {
        lock: monitor.lock,
        lockHolder: monitor.lockHolder,
        count: monitor.count,
        conditionVars: {
          full: { waitQueue: [...monitor.conditionVars.full.waitQueue] },
          empty: { waitQueue: [...monitor.conditionVars.empty.waitQueue] },
        },
      },
      waitQueues: {
        full: [...monitor.conditionVars.full.waitQueue],
        empty: [...monitor.conditionVars.empty.waitQueue],
        lock: monitor.lock && monitor.lockHolder ? [] : [],
      },
      log: [...log],
      highlight: srcType ? { id: srcId, type: srcType } : null,
    });
  }

  function pushLog(msg, srcId, srcType) {
    const ts = String(tick).padStart(4, '0');
    log.push({ time: `[${ts}]`, message: msg, srcId, srcType });
  }

  function acquireLock(who, whoType) {
    if (!monitor.lock) {
      monitor.lock = true;
      monitor.lockHolder = whoType + who.id;
      who.holding = [...who.holding, 'monitor_lock'];
      return true;
    }
    return false;
  }

  function releaseLock(who, whoType) {
    monitor.lock = false;
    monitor.lockHolder = null;
    who.holding = who.holding.filter(h => h !== 'monitor_lock');
  }

  function waitCondition(condName, who, whoType) {
    const cv = monitor.conditionVars[condName];
    const key = whoType + who.id;
    cv.waitQueue.push(key);
    who.waitReason = `waiting on condition ${condName}`;
    who.state = 'WAITING';
    return key;
  }

  function signalCondition(condName, who, whoType) {
    const cv = monitor.conditionVars[condName];
    if (cv.waitQueue.length > 0) {
      const waiterKey = cv.waitQueue.shift();
      cv.signalQueue.push(waiterKey);
      return waiterKey;
    }
    return null;
  }

  function wakeFromCondition(condName) {
    const cv = monitor.conditionVars[condName];
    if (cv.signalQueue.length > 0) {
      const waiterKey = cv.signalQueue.shift();
      const isP = waiterKey.startsWith('P');
      const pool = isP ? producers : consumers;
      const proc = pool.find(p => p.id === parseInt(waiterKey.slice(1)));
      if (proc) {
        proc.waitReason = null;
        proc.state = 'ACTIVE';
        return proc;
      }
    }
    return null;
  }

  const MAX_TICKS = 300;
  const totalNeeded = numProducers * 3;

  // Round-robin scheduling: try each producer, then each consumer
  while (tick < MAX_TICKS) {
    const allDoneP = producers.every(p => p.itemsProduced >= 3);
    const perConsumer = Math.ceil(totalNeeded / numConsumers);
    const allDoneC = consumers.every(c => c.itemsConsumed >= perConsumer);
    if (allDoneP && allDoneC) break;

    // Try each producer
    for (let pi = 0; pi < producers.length && tick < MAX_TICKS; pi++) {
      const p = producers[pi];
      if (p.itemsProduced >= 3) { p.state = 'DONE'; continue; }

      p.state = 'ACTIVE';

      switch (p.phase) {
        case 0: {
          // Try to wake any signaled empty waiters first
          wakeFromCondition('empty');

          if (monitor.count >= bufferSize) {
            // Buffer full - wait on empty condition
            const key = waitCondition('empty', p, 'P');
            pushLog(`Producer ${p.id} WAITING: buffer full [${monitor.count}/${bufferSize}], blocked on condition 'empty'`, p.id, 'producer');
            snap(null, p.id, 'producer');
            continue;
          }
          p.phase = 1;
          break;
        }
        case 1: {
          if (acquireLock(p, 'P')) {
            pushLog(`Producer ${p.id} acquired monitor lock`, p.id, 'producer');
            p.phase = 2;
          } else {
            p.state = 'WAITING';
            p.waitReason = 'waiting for monitor lock';
            snap(null, p.id, 'producer');
            continue;
          }
          break;
        }
        case 2: {
          const item = ++itemIdCounter;
          buffer[monitor.in_ptr] = { id: item, producerId: p.id, tick };
          monitor.in_ptr = (monitor.in_ptr + 1) % bufferSize;
          monitor.count++;
          p.itemsProduced++;
          p.itemId = item;
          pushLog(`Producer ${p.id} PRODUCED item #${item} -> buffer slot [${(monitor.in_ptr - 1 + bufferSize) % bufferSize}], count=${monitor.count}/${bufferSize}`, p.id, 'producer');
          p.phase = 3;
          break;
        }
        case 3: {
          // Signal empty condition (wake a waiting consumer if any)
          const woken = signalCondition('empty', p, 'P');
          if (woken) {
            pushLog(`Producer ${p.id} SIGNAL 'empty' -> woke ${woken}`, p.id, 'producer');
          }
          // Release monitor lock
          releaseLock(p, 'P');
          pushLog(`Producer ${p.id} released monitor lock`, p.id, 'producer');
          p.phase = 0;
          p.itemId = null;
          break;
        }
      }
      snap(null, p.id, 'producer');
    }

    // Try each consumer
    for (let ci = 0; ci < consumers.length && tick < MAX_TICKS; ci++) {
      const c = consumers[ci];
      const perConsumer = Math.ceil(totalNeeded / numConsumers);
      if (c.itemsConsumed >= perConsumer) { c.state = 'DONE'; continue; }

      c.state = 'ACTIVE';

      switch (c.phase) {
        case 0: {
          // Try to wake any signaled full waiters first
          wakeFromCondition('full');

          if (monitor.count <= 0) {
            // Buffer empty - wait on full condition
            const key = waitCondition('full', c, 'C');
            pushLog(`Consumer ${c.id} WAITING: buffer empty, blocked on condition 'full'`, c.id, 'consumer');
            snap(null, c.id, 'consumer');
            continue;
          }
          c.phase = 1;
          break;
        }
        case 1: {
          if (acquireLock(c, 'C')) {
            pushLog(`Consumer ${c.id} acquired monitor lock`, c.id, 'consumer');
            c.phase = 2;
          } else {
            c.state = 'WAITING';
            c.waitReason = 'waiting for monitor lock';
            snap(null, c.id, 'consumer');
            continue;
          }
          break;
        }
        case 2: {
          const item = buffer[monitor.out_ptr];
          buffer[monitor.out_ptr] = null;
          monitor.out_ptr = (monitor.out_ptr + 1) % bufferSize;
          monitor.count--;
          c.itemsConsumed++;
          c.consumedItemId = item ? item.id : null;
          pushLog(`Consumer ${c.id} CONSUMED item #${item ? item.id : '?'} from buffer, count=${monitor.count}/${bufferSize}`, c.id, 'consumer');
          c.phase = 3;
          break;
        }
        case 3: {
          // Signal full condition (wake a waiting producer if any)
          const woken = signalCondition('full', c, 'C');
          if (woken) {
            pushLog(`Consumer ${c.id} SIGNAL 'full' -> woke ${woken}`, c.id, 'consumer');
          }
          // Release monitor lock
          releaseLock(c, 'C');
          pushLog(`Consumer ${c.id} released monitor lock`, c.id, 'consumer');
          c.phase = 0;
          c.consumedItemId = null;
          break;
        }
      }
      snap(null, c.id, 'consumer');
    }

    tick++;
  }

  snap('Simulation complete', null, null);
  return { frames, problem: 'bounded-buffer' };
};
