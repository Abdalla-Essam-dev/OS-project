/**
 * Dining Philosophers Problem
 * Uses Binary Semaphores for Chopsticks.
 * Each chopstick is a binary semaphore (0 or 1).
 *
 * States: THINKING -> HUNGRY -> EATING -> THINKING
 *
 * Deadlock Strategies:
 * - asymmetric: Even philosophers pick left first, odd pick right first
 * - limit_seats: At most N-1 philosophers can attempt to eat
 * - both_at_once: Acquire both chopsticks atomically or release all
 */

module.exports = function diningPhilosophersSim(cfg) {
  const { numPhilosophers, eatDuration, thinkDuration, strategy } = cfg;
  const frames = [];
  let tick = 0;
  let log = [];

  const maxMeals = 3;
  const n = numPhilosophers;

  // Chopstick semaphores (binary: 0=held, 1=free)
  const chopsticks = [];
  for (let i = 0; i < n; i++) {
    chopsticks.push({ id: i, semaphore: 1, heldBy: null });
  }

  // Semaphores object for display
  const semDisplay = {};
  for (let i = 0; i < n; i++) {
    semDisplay[`chopstick_${i}`] = 1;
  }

  const philosophers = [];
  for (let i = 0; i < n; i++) {
    philosophers.push({
      id: i,
      state: 'THINKING',
      phase: 0,
      mealsEaten: 0,
      waitReason: null,
      leftChopstick: i,
      rightChopstick: (i + 1) % n,
      holding: [],
      thinkTicks: 0,
      eatTicks: 0,
      waitingFor: null, // which chopstick they're waiting for
    });
  }

  const allDone = () => philosophers.every(p => p.mealsEaten >= maxMeals);

  function snap(msg, srcId) {
    frames.push({
      tick: tick++,
      philosophers: philosophers.map(p => ({
        id: p.id, state: p.state, phase: p.phase,
        mealsEaten: p.mealsEaten, waitReason: p.waitReason,
        leftChopstick: p.leftChopstick, rightChopstick: p.rightChopstick,
        holding: [...p.holding],
        waitingFor: p.waitingFor,
      })),
      chopsticks: chopsticks.map(c => ({
        id: c.id, semaphore: c.semaphore, heldBy: c.heldBy,
      })),
      semaphores: { ...semDisplay },
      log: [...log],
      highlight: srcId !== null && srcId !== undefined ? { id: srcId } : null,
    });
  }

  function pushLog(msg, srcId) {
    const ts = String(tick).padStart(4, '0');
    log.push({ time: `[${ts}]`, message: msg, srcId, srcType: 'philosopher' });
  }

  function tryPickChopstick(chopId, philId) {
    if (chopsticks[chopId].semaphore === 1) {
      chopsticks[chopId].semaphore = 0;
      chopsticks[chopId].heldBy = philId;
      semDisplay[`chopstick_${chopId}`] = 0;
      return true;
    }
    return false;
  }

  function releaseChopsticks(philId) {
    chopsticks.forEach(c => {
      if (c.heldBy === philId) {
        c.semaphore = 1;
        c.heldBy = null;
        semDisplay[`chopstick_${c.id}`] = 1;
      }
    });
  }

  function getActiveEatersCount() {
    return philosophers.filter(p => p.state === 'EATING' || p.holding.length > 0).length;
  }

  while (tick < 250 && !allDone()) {
    for (let pi = 0; pi < n; pi++) {
      const p = philosophers[pi];
      if (p.mealsEaten >= maxMeals) { p.state = 'DONE'; continue; }

      switch (p.phase) {
        case 0: { // THINKING
          p.state = 'THINKING';
          p.thinkTicks++;
          if (p.thinkTicks >= thinkDuration) {
            p.thinkTicks = 0;
            p.state = 'HUNGRY';
            p.phase = 1;
            p.waitingFor = null;
            pushLog(`Philosopher ${p.id} is HUNGRY (thought for ${thinkDuration} ticks)`, p.id);
          }
          break;
        }

        case 1: { // HUNGRY - trying to pick up chopsticks
          p.state = 'HUNGRY';
          const leftId = p.leftChopstick;
          const rightId = p.rightChopstick;

          if (strategy === 'asymmetric') {
            const pickFirst = p.id % 2 === 0 ? leftId : rightId;
            const pickSecond = p.id % 2 === 0 ? rightId : leftId;

            if (p.holding.length === 0) {
              if (tryPickChopstick(pickFirst, p.id)) {
                p.holding.push(pickFirst);
                pushLog(`Philosopher ${p.id} acquired chopstick ${pickFirst} (semaphore: 0)`, p.id);
              } else {
                p.state = 'WAITING';
                p.waitReason = `chopstick ${pickFirst} held by P${chopsticks[pickFirst].heldBy}`;
                p.waitingFor = pickFirst;
              }
            } else if (p.holding.length === 1) {
              if (tryPickChopstick(pickSecond, p.id)) {
                p.holding.push(pickSecond);
                p.phase = 2;
                p.eatTicks = 0;
                p.state = 'EATING';
                pushLog(`Philosopher ${p.id} acquired chopstick ${pickSecond} -> EATING (both chopsticks acquired)`, p.id);
              } else {
                p.state = 'WAITING';
                p.waitReason = `chopstick ${pickSecond} held by P${chopsticks[pickSecond].heldBy}`;
                p.waitingFor = pickSecond;
              }
            }
          } else if (strategy === 'limit_seats') {
            const active = getActiveEatersCount();
            if (active >= n - 1 && p.holding.length === 0) {
              p.state = 'WAITING';
              p.waitReason = `max diners reached (${active}/${n - 1} limit)`;
              break;
            }

            if (p.holding.length === 0) {
              if (tryPickChopstick(leftId, p.id)) {
                p.holding.push(leftId);
                pushLog(`Philosopher ${p.id} acquired chopstick ${leftId} (semaphore: 0)`, p.id);
              } else {
                p.state = 'WAITING';
                p.waitReason = `chopstick ${leftId} held by P${chopsticks[leftId].heldBy}`;
                p.waitingFor = leftId;
              }
            } else if (p.holding.length === 1) {
              if (tryPickChopstick(rightId, p.id)) {
                p.holding.push(rightId);
                p.phase = 2;
                p.eatTicks = 0;
                p.state = 'EATING';
                pushLog(`Philosopher ${p.id} acquired chopstick ${rightId} -> EATING`, p.id);
              } else {
                p.state = 'WAITING';
                p.waitReason = `chopstick ${rightId} held by P${chopsticks[rightId].heldBy}`;
                p.waitingFor = rightId;
              }
            }
          } else if (strategy === 'both_at_once') {
            if (tryPickChopstick(leftId, p.id)) {
              if (tryPickChopstick(rightId, p.id)) {
                p.holding = [leftId, rightId];
                p.phase = 2;
                p.eatTicks = 0;
                p.state = 'EATING';
                pushLog(`Philosopher ${p.id} acquired BOTH chopsticks -> EATING (atomic pick)`, p.id);
              } else {
                releaseChopsticks(p.id);
                p.holding = [];
                p.state = 'WAITING';
                p.waitReason = `chopstick ${rightId} not available (atomic rollback)`;
                p.waitingFor = rightId;
              }
            } else {
              releaseChopsticks(p.id);
              p.holding = [];
              p.state = 'WAITING';
              p.waitReason = `chopstick ${leftId} not available (atomic rollback)`;
              p.waitingFor = leftId;
            }
          }
          break;
        }

        case 2: { // EATING
          p.state = 'EATING';
          p.eatTicks++;
          if (p.eatTicks >= eatDuration) {
            p.mealsEaten++;
            releaseChopsticks(p.id);
            p.holding = [];
            p.phase = 0;
            p.state = 'THINKING';
            p.thinkTicks = 0;
            p.waitingFor = null;
            pushLog(`Philosopher ${p.id} FINISHED meal #${p.mealsEaten}, releasing chopsticks (semaphores freed), now THINKING`, p.id);
          }
          break;
        }
      }
      snap(null, p.id);
    }
  }

  snap('Simulation complete', null);
  return { frames, problem: 'dining-philosophers' };
};
