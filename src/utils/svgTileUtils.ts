export interface HexTileData {
  clipPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const createHexagonClipPath = (centerX: number, centerY: number, size: number): string => {
  const angles = Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3);
  const points = angles.map(angle => ({
    x: centerX + size * Math.cos(angle),
    y: centerY + size * Math.sin(angle)
  }));
  
  return `M ${points[0].x},${points[0].y} ${points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')} Z`;
};

export const generateHexTileGrid = (
  svgWidth: number, 
  svgHeight: number, 
  hexSize: number,
  padding: number = 2
): HexTileData[] => {
  const tiles: HexTileData[] = [];
  const horizontalSpacing = hexSize * Math.sqrt(3);
  const verticalSpacing = hexSize * 1.5;
  
  for (let row = 0; row < Math.ceil(svgHeight / verticalSpacing) + 1; row++) {
    const offset = row % 2 ? horizontalSpacing / 2 : 0;
    for (let col = 0; col < Math.ceil(svgWidth / horizontalSpacing) + 1; col++) {
      const centerX = col * horizontalSpacing + offset;
      const centerY = row * verticalSpacing;
      
      // Skip tiles that would be completely outside the SVG
      if (centerX - hexSize > svgWidth || centerY - hexSize > svgHeight) {
        continue;
      }
      
      tiles.push({
        clipPath: createHexagonClipPath(centerX, centerY, hexSize - padding),
        x: centerX - hexSize,
        y: centerY - hexSize,
        width: hexSize * 2,
        height: hexSize * 2
      });
    }
  }
  
  return tiles;
};

export const createTiledSvg = (
  originalSvg: string,
  tiles: HexTileData[]
): string => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(originalSvg, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Create a new SVG with the same dimensions
  const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  newSvg.setAttribute('width', svgElement.getAttribute('width') || '');
  newSvg.setAttribute('height', svgElement.getAttribute('height') || '');
  newSvg.setAttribute('viewBox', svgElement.getAttribute('viewBox') || '');
  
  // Create defs section for clip paths
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  // Create tiles
  tiles.forEach((tile, index) => {
    // Create clip path
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `hex-clip-${index}`);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', tile.clipPath);
    clipPath.appendChild(path);
    defs.appendChild(clipPath);
    
    // Create tile group
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('clip-path', `url(#hex-clip-${index})`);
    
    // Clone original SVG content
    const content = svgElement.cloneNode(true) as SVGElement;
    content.removeAttribute('width');
    content.removeAttribute('height');
    
    group.appendChild(content);
    newSvg.appendChild(group);
  });
  
  newSvg.insertBefore(defs, newSvg.firstChild);
  
  return new XMLSerializer().serializeToString(newSvg);
};

export const generateGameGridTiles = (
  gridRadius: number,
  hexSize: number,
  padding: number = 2
): HexTileData[] => {
  const tiles: HexTileData[] = [];
  
  // Calculate center offset
  const centerX = gridRadius * hexSize * Math.sqrt(3);
  const centerY = gridRadius * hexSize * 1.5;
  
  // Generate tiles in a hexagonal pattern
  for (let q = -gridRadius; q <= gridRadius; q++) {
    const r1 = Math.max(-gridRadius, -q - gridRadius);
    const r2 = Math.min(gridRadius, -q + gridRadius);
    
    for (let r = r1; r <= r2; r++) {
      const x = centerX + hexSize * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
      const y = centerY + hexSize * (3./2 * r);
      
      tiles.push({
        clipPath: createHexagonClipPath(x, y, hexSize - padding),
        x: x - hexSize,
        y: y - hexSize,
        width: hexSize * 2,
        height: hexSize * 2
      });
    }
  }
  
  return tiles;
};

export const loadAndTileSvg = async (
  svgUrl: string, 
  hexSize: number, 
  gridRadius: number = 3
): Promise<string> => {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    const tiles = generateGameGridTiles(gridRadius, hexSize);
    return createTiledSvg(svgText, tiles);
  } catch (error) {
    console.error('Error loading or processing SVG:', error);
    throw error;
  }
}; 