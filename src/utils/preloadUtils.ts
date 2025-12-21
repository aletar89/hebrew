type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

const imageCache = new Set<string>();
const audioCache = new Set<string>();
const idleQueue: Array<() => void> = [];
let idleHandle: number | null = null;

const requestIdle = (callback: (deadline: IdleDeadlineLike) => void) => {
  if (typeof globalThis.requestIdleCallback === 'function') {
    return globalThis.requestIdleCallback(callback);
  }

  return window.setTimeout(() => {
    callback({ didTimeout: true, timeRemaining: () => 0 });
  }, 50);
};

export function preloadImage(src: string): void {
  if (imageCache.has(src)) return;
  const img = new Image();
  img.src = src;
  imageCache.add(src);
}

export function preloadAudio(src: string): void {
  if (audioCache.has(src)) return;
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.load();
  audioCache.add(src);
}

function runIdleQueue(deadline: IdleDeadlineLike) {
  while (idleQueue.length > 0 && (deadline.timeRemaining() > 5 || deadline.didTimeout)) {
    const task = idleQueue.shift();
    task?.();
  }

  if (idleQueue.length > 0) {
    idleHandle = requestIdle(runIdleQueue);
  } else {
    idleHandle = null;
  }
}

export function enqueueIdleTasks(tasks: Array<() => void>): void {
  idleQueue.push(...tasks);
  if (idleHandle === null) {
    idleHandle = requestIdle(runIdleQueue);
  }
}
