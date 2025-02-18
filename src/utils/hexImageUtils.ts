export interface HexPuzzlePiece {
  id: number;
  currentPosition: { q: number; r: number };
  correctPosition: { q: number; r: number };
  sourceX: number;
  sourceY: number;
  width: number;
  height: number;
  isSolved: boolean;
}

export const createHexPuzzle = (
  image: HTMLImageElement,
  hexSize: number
): HexPuzzlePiece[] => {
  // Scale image to our target size (440x485)
  const targetWidth = 440;
  const targetHeight = 485;
  
  // Create temp canvas for scaled image
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = targetWidth;
  tempCanvas.height = targetHeight;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(image, 0, 0, targetWidth, targetHeight);

  // Calculate grid dimensions to fit the image
  const gridWidth = targetWidth;
  const gridHeight = targetHeight;
  
  // Calculate hex spacing to fit the entire image
  const hexSpacingX = gridWidth / (6 * 1.5); // Divide by max width in hex coordinates
  const hexSpacingY = gridHeight / (7 * Math.sqrt(3)); // Divide by max height in hex coordinates
  const effectiveHexSize = Math.min(hexSpacingX, hexSpacingY);

  const pieces: HexPuzzlePiece[] = [];
  const validPositions = [
    // Center
    [0, 0],
    // Inner ring (6)
    [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1],
    // Middle ring (12)
    [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], 
    [-2, 1], [-2, 0], [0, -2], [1, -2], [-2, 2], [-1, -1],
    // Outer ring (18)
    [3, -3], [3, -2], [3, -1], [2, 1], [1, 2], [0, 3], 
    [-3, 2], [-3, 1], [-3, 0], [-1, -2], [-1, 3], [-2, -1],
    [0, -3], [1, -3], [3, 0], [-2, 3], [-3, 3], [2, -3]
  ];
  
  validPositions.forEach(([q, r], index) => {
    // Calculate position using the effective hex size
    const x = gridWidth/2 + (q * effectiveHexSize * 1.5);
    const y = gridHeight/2 + (r * effectiveHexSize * Math.sqrt(3) + q * effectiveHexSize * Math.sqrt(3)/2);
    
    pieces.push({
      id: index,
      correctPosition: { q, r },
      currentPosition: { q, r },
      sourceX: x - effectiveHexSize,
      sourceY: y - effectiveHexSize,
      width: effectiveHexSize * 2,
      height: effectiveHexSize * 2,
      isSolved: true
    });
  });

  return pieces;
};

export const drawHexImageTile = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  tile: HexPuzzlePiece,
  x: number,
  y: number,
  size: number,
  debug = false
) => {
  ctx.save();

  // Create hex clip path
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const pointX = x + size * Math.cos(angle);
    const pointY = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  }
  ctx.closePath();

  // Apply clip path
  ctx.clip();

  // Draw the image section
  const scale = 1.05; // Add slight overlap to prevent gaps
  const scaledSize = size * 2 * scale;
  ctx.drawImage(
    image,
    tile.sourceX,
    tile.sourceY,
    tile.width,
    tile.height,
    x - scaledSize/2,
    y - scaledSize/2,
    scaledSize,
    scaledSize
  );

  ctx.restore();
}; 