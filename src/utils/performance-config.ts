export const PERFORMANCE_CONFIG = {
  BATCH_SIZE: 100, // Number of markers to process per frame
  MEMORY_LIMIT: 200_000_000, // 200MB heap limit
  RENDER_DISTANCE: 5000, // meters
  WORKER_COUNT: navigator.hardwareConcurrency || 4,
  TILE_SIZE: 512,
  MAX_ZOOM: 17,
  CLUSTER_RADIUS: 50,
  PRELOAD_ZOOM_LEVELS: [13, 14, 15],
  CACHE_SIZE: 1000,
  THROTTLE_MS: 16, // ~60fps
};

// Add SharedArrayBuffer pool
export class BufferPool {
  private static pool: SharedArrayBuffer[] = [];
  
  static acquire(): SharedArrayBuffer {
    return this.pool.pop() || new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT * 2);
  }
  
  static release(buffer: SharedArrayBuffer) {
    if (this.pool.length < 100) {
      this.pool.push(buffer);
    }
  }
}
