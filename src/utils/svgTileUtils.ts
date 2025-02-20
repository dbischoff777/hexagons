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
  
  // Create a new SVG
  const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  newSvg.setAttribute('width', svgElement.getAttribute('width') || '');
  newSvg.setAttribute('height', svgElement.getAttribute('height') || '');
  newSvg.setAttribute('viewBox', svgElement.getAttribute('viewBox') || '');
  
  // Create defs section for clip paths
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  // Create tiles
  tiles.forEach((tile, index) => {
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', `hex-clip-${index}`);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', tile.clipPath);
    clipPath.appendChild(path);
    defs.appendChild(clipPath);
    
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('clip-path', `url(#hex-clip-${index})`);
    
    // Clone and normalize content
    const content = svgElement.cloneNode(true) as SVGElement;
    content.removeAttribute('width');
    content.removeAttribute('height');
    
    // Force black color on all elements
    const elements = content.getElementsByTagName('*');
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      element.removeAttribute('style');
      element.setAttribute('fill', '#000000');
      element.setAttribute('fill-opacity', '1');
      element.setAttribute('stroke', 'none');
    }
    
    group.appendChild(content);
    newSvg.appendChild(group);
  });
  
  newSvg.insertBefore(defs, newSvg.firstChild);
  return new XMLSerializer().serializeToString(newSvg);
};

export const generateValidPositions = (rings: number): [number, number][] => {
  const positions: [number, number][] = [
    // Center
    [0, 0]
  ];

  // Generate positions for each ring
  for (let ring = 1; ring <= rings; ring++) {
    // Top right to top left
    for (let i = 0; i < ring; i++) {
      positions.push([ring - i, i]);
    }
    // Top left to middle left
    for (let i = 0; i < ring; i++) {
      positions.push([-i, ring]);
    }
    // Middle left to bottom left
    for (let i = 0; i < ring; i++) {
      positions.push([-ring, ring - i]);
    }
    // Bottom left to bottom right
    for (let i = 0; i < ring; i++) {
      positions.push([-(ring - i), -i]);
    }
    // Bottom right to middle right
    for (let i = 0; i < ring; i++) {
      positions.push([i, -ring]);
    }
    // Middle right to top right
    for (let i = 0; i < ring; i++) {
      positions.push([ring, -(ring - i)]);
    }
  }

  return positions;
};

export const generateGameGridTiles = (
  gridRadius: number,
  hexSize: number,
  padding: number = 2
): HexTileData[] => {
  const tiles: HexTileData[] = [];
  
  // Calculate dimensions to fit all rings
  const horizontalSpacing = hexSize * Math.sqrt(3);
  const verticalSpacing = hexSize * 1.5;
  
  // Calculate required dimensions based on grid radius
  const width = horizontalSpacing * (gridRadius * 2 + 1);
  const height = verticalSpacing * (gridRadius * 2 + 1);
  
  // Calculate center offset
  const centerX = width / 2;
  const centerY = height / 2;

  // Use the shared generateValidPositions function
  const validPositions = generateValidPositions(gridRadius);

  // Generate tiles using valid positions
  validPositions.forEach(([q, r]) => {
    const x = centerX + hexSize * (3/2 * q);
    const y = centerY + hexSize * (Math.sqrt(3) * (r + q/2));
    
    tiles.push({
      clipPath: createHexagonClipPath(x, y, hexSize - padding),
      x: x - hexSize,
      y: y - hexSize,
      width: hexSize * 2,
      height: hexSize * 2
    });
  });
  
  return tiles;
};

const normalizeAndCleanSvg = (svgText: string): string => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  // Function to process elements
  const processElement = (element: Element) => {
    // Remove style attributes
    element.removeAttribute('style');

    // Get fill color
    const fill = element.getAttribute('fill');
    const fillOpacity = element.getAttribute('fill-opacity');
    const stroke = element.getAttribute('stroke');

    // Check if element is effectively white or transparent
    const isWhiteOrTransparent = 
      (fill === '#FFFFFF' || fill === '#FFF' || fill === 'white' || fill === 'none') &&
      (!stroke || stroke === 'none') &&
      (!fillOpacity || parseFloat(fillOpacity) < 0.1);

    if (isWhiteOrTransparent) {
      // Remove white/transparent elements
      element.remove();
    } else {
      // Normalize non-white elements to solid black
      element.setAttribute('fill', '#000000');
      element.setAttribute('fill-opacity', '1');
      element.setAttribute('stroke', 'none');
    }
  };

  // Process all elements including the root
  processElement(svgElement);
  const elements = svgElement.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    processElement(elements[i]);
  }

  return new XMLSerializer().serializeToString(svgDoc);
};

export const loadAndTileSvg = async (
  svgUrl: string, 
  hexSize: number, 
  gridRadius: number = 4  // Use 4 rings for optimal coverage
): Promise<string> => {
  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    
    // Normalize and clean the SVG before processing
    const cleanedSvg = normalizeAndCleanSvg(svgText);
    
    const tiles = generateGameGridTiles(gridRadius, hexSize);
    return createTiledSvg(cleanedSvg, tiles);
  } catch (error) {
    console.error('Error loading or processing SVG:', error);
    throw error;
  }
}; 