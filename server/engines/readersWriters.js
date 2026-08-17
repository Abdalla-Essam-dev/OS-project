/**
 * Readers-Writers Problem
 * Uses Semaphores: mutex (protects rc), wrt_mutex (write lock)
 * Reader Count (rc) tracks active readers.
 *
 * Priority Modes:
 * - reader-preference: readers are preferred. Once a reader starts reading,
 *   other readers can join. Writers must wait for all readers to finish.
 *   New readers can preempt waiting writers.
 * - writer-preference: writers are preferred. Once a writer signals intent,
 *   new readers must wait until the writer completes.
 */

module.exports = function readersWritersSim(cfg) {
  const { numReaders, numWriters, readTime, writeTime, priorityMode } = cfg;
  const frames = [];
  let tick = 0;
  let log = [];

  // Semaphores
  const sem = { mutex: 1, wrt: 1 };
  let rc = 0; // reader count

  // Writer preference tracking
  let waitingWriters = 0;
  let readTry = 1; // semaphore to control reader entry in writer-preference mode

  const waitQueues = { mutex: [], wrt: [], readTry: [] };

  const readers = [];
  for (let i = 0; i < numReaders; i++) {
    readers.push({
      id: i, state: 'IDLE', phase: 0, readsDone: 0, totalReads: 2,
      waitReason: null, holding: [],
    });
  }
  const writers = [];
  for (let i = 0; i < numWriters; i++) {
    writers.push({
      id: i, state: 'IDLE', phase: 0, writesDone: 0, totalWrites: 2,
      waitReason: null, holding: [],
    });
  }

  const resourceLock = { locked: false, holder: null, type: null };

  function snap(msg, srcId, srcType) {
    frames.push({
      tick: tick++,
      readers: readers.map(r => ({ ...r, holding: [...r.holding] })),
      writers: writers.map(w => ({ ...w, holding: [...w.holding] })),
      rc,
      semaphores: { ...sem, readTry },
      priorityMode,
      waitingWriters,
      resourceLock: { ...resourceLock },
      waitQueues: {
        mutex: [...waitQueues.mutex],
        wrt: [...waitQueues.wrt],
        ...(priorityMode === 'writer-preference' ? { readTry: [...waitQueues.readTry] } : {}),
      },
      log: [...log],
      highlight: srcType ? { id: srcId, type: srcType } : null,
    });
  }

  function pushLog(msg, srcId, srcType) {
    const ts = String(tick).padStart(4, '0');
    log.push({ time: `[${ts}]`, message: msg, srcId, srcType });
  }

  function tryAcquire(semName, who, whoType) {
    if (sem[semName] > 0) {
      sem[semName]--;
      who.holding = [...who.holding, semName];
      return true;
    } else {
      const key = whoType + who.id;
      if (!waitQueues[semName].includes(key)) {
        waitQueues[semName].push(key);
      }
      who.waitReason = `waiting on semaphore ${semName}`;
      return false;
    }
  }

  function release(semName, who, whoType) {
    sem[semName]++;
    who.holding = who.holding.filter(h => h !== semName);
    const key = whoType + who.id;
    const idx = waitQueues[semName].indexOf(key);
    if (idx !== -1) waitQueues[semName].splice(idx, 1);
  }

  const MAX_TICKS = 250;
  const allDone = () =>
    readers.every(r => r.readsDone >= r.totalReads) &&
    writers.every(w => w.writesDone >= w.totalWrites);

  // ---- Reader Preference Mode ----
  function stepReaderPreference(ri) {
    const r = readers[ri];
    if (r.readsDone >= r.totalReads) { r.state = 'DONE'; return; }
    r.state = 'ACTIVE';

    switch (r.phase) {
      case 0: // Acquire mutex to update rc
        if (tryAcquire('mutex', r, 'R')) {
          pushLog(`Reader ${r.id} acquired mutex`, r.id, 'reader');
          r.phase = 1;
        } else {
          r.state = 'WAITING';
        }
        break;
      case 1: { // Increment rc, release mutex
        rc++;
        pushLog(`Reader ${r.id} incremented rc=${rc}`, r.id, 'reader');
        release('mutex', r, 'R');
        if (rc === 1) {
          // First reader locks wrt
          if (tryAcquire('wrt', r, 'R')) {
            pushLog(`Reader ${r.id} acquired wrt (first reader locks resource)`, r.id, 'reader');
            resourceLock.locked = true;
            resourceLock.holder = `R${r.id}`;
            resourceLock.type = 'reader';
            r.phase = 2;
          } else {
            r.state = 'WAITING';
            r.waitReason = 'waiting on wrt (writer active)';
          }
        } else {
          // Already locked by readers
          r.phase = 2;
        }
        break;
      }
      case 2: // Reading
        pushLog(`Reader ${r.id} is READING the resource (${rc} readers active)`, r.id, 'reader');
        r.phase = 3;
        break;
      case 3: { // Done reading, acquire mutex to decrement rc
        if (tryAcquire('mutex', r, 'R')) {
          rc--;
          pushLog(`Reader ${r.id} decremented rc=${rc}`, r.id, 'reader');
          release('mutex', r, 'R');
          if (rc === 0) {
            release('wrt', r, 'R');
            resourceLock.locked = false;
            resourceLock.holder = null;
            resourceLock.type = null;
            pushLog(`Reader ${r.id} released wrt (last reader unlocks)`, r.id, 'reader');
          }
          r.readsDone++;
          r.phase = 0;
          r.state = 'DONE';
          pushLog(`Reader ${r.id} finished read #${r.readsDone}/${r.totalReads}`, r.id, 'reader');
        } else {
          r.state = 'WAITING';
          r.waitReason = 'waiting on mutex';
        }
        break;
      }
    }
  }

  function stepWriterPreference(wi) {
    const w = writers[wi];
    if (w.writesDone >= w.totalWrites) { w.state = 'DONE'; return; }
    w.state = 'ACTIVE';

    switch (w.phase) {
      case 0: // Signal intent: increment waitingWriters
        waitingWriters++;
        pushLog(`Writer ${w.id} registered intent (waitingWriters=${waitingWriters})`, w.id, 'writer');
        w.phase = 1;
        break;
      case 1: { // Try to acquire wrt (wait for all readers to finish)
        if (tryAcquire('wrt', w, 'W')) {
          waitingWriters--;
          pushLog(`Writer ${w.id} acquired wrt (exclusive lock)`, w.id, 'writer');
          w.phase = 2;
        } else {
          w.state = 'WAITING';
          w.waitReason = 'waiting on wrt (readers active)';
        }
        break;
      }
      case 2: // Writing
        resourceLock.locked = true;
        resourceLock.holder = `W${w.id}`;
        resourceLock.type = 'writer';
        pushLog(`Writer ${w.id} is WRITING to the resource (exclusive)`, w.id, 'writer');
        w.phase = 3;
        break;
      case 3: // Release wrt
        release('wrt', w, 'W');
        resourceLock.locked = false;
        resourceLock.holder = null;
        resourceLock.type = null;
        w.writesDone++;
        w.phase = 0;
        w.state = 'DONE';
        pushLog(`Writer ${w.id} finished write #${w.writesDone}/${w.totalWrites} and released wrt`, w.id, 'writer');
        break;
    }
  }

  function stepReaderWriterPreference_Writer(ri) {
    const r = readers[ri];
    if (r.readsDone >= r.totalReads) { r.state = 'DONE'; return; }
    r.state = 'ACTIVE';

    switch (r.phase) {
      case 0: // In writer-preference, reader must first check readTry
        if (tryAcquire('readTry', r, 'R')) {
          if (waitingWriters > 0) {
            // Writer is waiting - block new readers
            release('readTry', r, 'R');
            r.state = 'WAITING';
            r.waitReason = `blocked: ${waitingWriters} writer(s) waiting (writer preference)`;
            r.phase = 0;
          } else {
            pushLog(`Reader ${r.id} passed readTry gate (${waitingWriters} writers waiting)`, r.id, 'reader');
            r.phase = 1;
          }
        } else {
          r.state = 'WAITING';
          r.waitReason = 'waiting on readTry semaphore';
        }
        break;
      case 1: // Acquire mutex to update rc
        if (tryAcquire('mutex', r, 'R')) {
          pushLog(`Reader ${r.id} acquired mutex`, r.id, 'reader');
          r.phase = 2;
        } else {
          r.state = 'WAITING';
          r.waitReason = 'waiting on mutex';
        }
        break;
      case 2: { // Increment rc, release mutex
        rc++;
        pushLog(`Reader ${r.id} incremented rc=${rc}`, r.id, 'reader');
        release('mutex', r, 'R');
        release('readTry', r, 'R');
        if (rc === 1) {
          if (tryAcquire('wrt', r, 'R')) {
            pushLog(`Reader ${r.id} acquired wrt (first reader locks resource)`, r.id, 'reader');
            resourceLock.locked = true;
            resourceLock.holder = `R${r.id}`;
            resourceLock.type = 'reader';
            r.phase = 3;
          } else {
            r.state = 'WAITING';
            r.waitReason = 'waiting on wrt';
          }
        } else {
          r.phase = 3;
        }
        break;
      }
      case 3: // Reading
        pushLog(`Reader ${r.id} is READING the resource (${rc} readers active)`, r.id, 'reader');
        r.phase = 4;
        break;
      case 4: { // Done reading, acquire mutex to decrement rc
        if (tryAcquire('mutex', r, 'R')) {
          rc--;
          pushLog(`Reader ${r.id} decremented rc=${rc}`, r.id, 'reader');
          release('mutex', r, 'R');
          if (rc === 0) {
            release('wrt', r, 'R');
            resourceLock.locked = false;
            resourceLock.holder = null;
            resourceLock.type = null;
            pushLog(`Reader ${r.id} released wrt (last reader unlocks)`, r.id, 'reader');
          }
          r.readsDone++;
          r.phase = 0;
          r.state = 'DONE';
          pushLog(`Reader ${r.id} finished read #${r.readsDone}/${r.totalReads}`, r.id, 'reader');
        } else {
          r.state = 'WAITING';
          r.waitReason = 'waiting on mutex';
        }
        break;
      }
    }
  }

  function stepWriterReaderPreference(wi) {
    const w = writers[wi];
    if (w.writesDone >= w.totalWrites) { w.state = 'DONE'; return; }
    w.state = 'ACTIVE';

    switch (w.phase) {
      case 0:
        if (tryAcquire('wrt', w, 'W')) {
          pushLog(`Writer ${w.id} acquired wrt (exclusive)`, w.id, 'writer');
          w.phase = 1;
        } else {
          w.state = 'WAITING';
          w.waitReason = 'waiting on wrt (readers active)';
        }
        break;
      case 1:
        resourceLock.locked = true;
        resourceLock.holder = `W${w.id}`;
        resourceLock.type = 'writer';
        pushLog(`Writer ${w.id} is WRITING to the resource (exclusive)`, w.id, 'writer');
        w.phase = 2;
        break;
      case 2:
        release('wrt', w, 'W');
        resourceLock.locked = false;
        resourceLock.holder = null;
        resourceLock.type = null;
        w.writesDone++;
        w.phase = 0;
        w.state = 'DONE';
        pushLog(`Writer ${w.id} finished write #${w.writesDone}/${w.totalWrites} and released wrt`, w.id, 'writer');
        break;
    }
  }

  // Main simulation loop
  while (tick < MAX_TICKS && !allDone()) {
    for (let ri = 0; ri < readers.length; ri++) {
      if (allDone()) break;
      if (priorityMode === 'reader-preference') {
        stepReaderPreference(ri);
      } else {
        stepReaderWriterPreference_Writer(ri);
      }
      snap(null, readers[ri].id, 'reader');
    }

    for (let wi = 0; wi < writers.length; wi++) {
      if (allDone()) break;
      if (priorityMode === 'reader-preference') {
        stepWriterReaderPreference(wi);
      } else {
        stepWriterPreference(wi);
      }
      snap(null, writers[wi].id, 'writer');
    }
  }

  snap('Simulation complete', null, null);
  return { frames, problem: 'readers-writers' };
};
