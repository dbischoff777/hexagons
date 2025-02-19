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
): Promise<{ pieces: HexPuzzlePiece[], scaledImage: HTMLImageElement }> => {
  return new Promise((resolve) => {
    // Calculate the size needed for our hex grid
    const gridDiameter = 9; // -4 to 4
    const gridWidth = gridDiameter * hexSize * 1.5; // Width needed for flat-topped hexes
    const gridHeight = gridDiameter * hexSize * Math.sqrt(3); // Height for hex grid
    
    // Create a temporary canvas with the grid size
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gridWidth;
    tempCanvas.height = gridHeight;
    const ctx = tempCanvas.getContext('2d')!;
    
    // Calculate scale to fit the image
    const scaleWidth = gridWidth / image.width;
    const scaleHeight = gridHeight / image.height;
    const scale = Math.max(scaleWidth, scaleHeight);
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    // Center the scaled image
    const x = (gridWidth - scaledWidth) / 2;
    const y = (gridHeight - scaledHeight) / 2;
    
    // Set image rendering properties
    ctx.filter = 'brightness(0.4) contrast(0.4)'; // Reduce brightness and contrast
    ctx.globalAlpha = 0.85; // Add slight transparency
    
    // Draw the scaled and centered image
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    
    // Reset context properties
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    
    // Create a new image with the processed version
    const scaledImage = new Image();
    scaledImage.onload = () => {
      const pieces: HexPuzzlePiece[] = [];
      
      // Calculate the center of our hex grid
      const centerX = gridWidth / 2;
      const centerY = gridHeight / 2;
      
      const validPositions = [
        // Center
        [0, 0],
        // First ring
        [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
        // Second ring
        [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 2], [-2, 1],
        [-2, 0], [-1, -1], [0, -2], [1, -2], [2, -2], [2, -1],
        // Third ring
        [3, 0], [2, 1], [1, 2], [0, 3], [-1, 3], [-2, 3],
        [-3, 3], [-3, 2], [-3, 1], [-3, 0], [-2, -1], [-1, -2],
        [0, -3], [1, -3], [2, -3], [3, -3], [3, -2], [3, -1],
        // Fourth ring (complete)
        [4, 0], [3, 1], [2, 2], [1, 3], [0, 4], [-1, 4],
        [-2, 4], [-3, 4], [-4, 4], [-4, 3], [-4, 2], [-4, 1],
        [-4, 0], [-3, -1], [-2, -2], [-1, -3], [0, -4], [1, -4],
        [2, -4], [3, -4], [4, -4], [4, -3], [4, -2], [4, -1]
      ];
      
      validPositions.forEach(([q, r], index) => {
        // Convert axial coordinates to pixel coordinates for flat-topped hexagons
        const pixelX = centerX + hexSize * (3/2 * q);
        const pixelY = centerY + hexSize * (Math.sqrt(3) * (r + q/2));
        
        pieces.push({
          id: index,
          correctPosition: { q, r },
          currentPosition: { q: -10, r: -10 }, // Start pieces off-grid
          sourceX: pixelX - hexSize,
          sourceY: pixelY - hexSize,
          width: hexSize * 2,
          height: hexSize * 2,
          isSolved: false // Start pieces as unsolved
        });
      });

      resolve({ pieces, scaledImage });
    };
    
    scaledImage.src = tempCanvas.toDataURL();
  });
};

export const drawHexImageTile = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  tile: HexPuzzlePiece,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();

  // Create hex clip path - update angle to match grid
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3; // Remove the - Math.PI / 6 to match grid orientation
    const pointX = x + size * Math.cos(angle);
    const pointY = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  }
  ctx.closePath();

  // Apply clip path
  ctx.clip();

  // Draw the image section
  ctx.drawImage(
    image,
    tile.sourceX,
    tile.sourceY,
    tile.width,
    tile.height,
    x - size,
    y - size,
    size * 2,
    size * 2
  );

  ctx.restore();
}; 