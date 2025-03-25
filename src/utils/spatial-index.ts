export class SpatialIndex {
  private grid: Map<string, Set<string>> = new Map();
  private cellSize: number = 0.01; // roughly 1km at equator

  private getCellKey(lng: number, lat: number): string {
    const x = Math.floor(lng / this.cellSize);
    const y = Math.floor(lat / this.cellSize);
    return `${x}:${y}`;
  }

  insert(id: string, lng: number, lat: number) {
    const key = this.getCellKey(lng, lat);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key)!.add(id);
  }

  query(minLng: number, minLat: number, maxLng: number, maxLat: number): Set<string> {
    const result = new Set<string>();
    const minX = Math.floor(minLng / this.cellSize);
    const maxX = Math.floor(maxLng / this.cellSize);
    const minY = Math.floor(minLat / this.cellSize);
    const maxY = Math.floor(maxLat / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x}:${y}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(id => result.add(id));
        }
      }
    }
    return result;
  }
}
