export class TileCache {
  private static instance: TileCache;
  private cache = new Map<string, ImageBitmap>();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new TileCache();
    }
    return this.instance;
  }
  
  async getTile(url: string): Promise<ImageBitmap> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }
    
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    if (this.cache.size > PERFORMANCE_CONFIG.CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(url, bitmap);
    return bitmap;
  }
}
