import { Location } from '../components/dark-map/types';
import { PERFORMANCE_CONFIG } from '../utils/performance-config';

let workerIndex = 0;
const workers: Worker[] = [];

// Create worker pool
for (let i = 0; i < PERFORMANCE_CONFIG.WORKER_COUNT; i++) {
  workers.push(new Worker(new URL('./marker.worker.ts', import.meta.url)));
}

self.onmessage = (e) => {
  // Round-robin worker distribution
  workers[workerIndex].postMessage(e.data);
  workerIndex = (workerIndex + 1) % workers.length;
};

export {};
