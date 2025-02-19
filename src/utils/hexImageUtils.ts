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

// Add type definition for position coordinates
type HexPosition = [number, number];

// Define valid positions array at the top level
const validPositions: HexPosition[] = [
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

export const createHexPuzzle = (
  image: HTMLImageElement,
  hexSize: number
): Promise<{ pieces: HexPuzzlePiece[], scaledImage: HTMLImageElement }> => {
  return new Promise((resolve) => {
    // Create two temporary canvases - one for display, one for analysis
    const displayCanvas = document.createElement('canvas');
    const analysisCanvas = document.createElement('canvas');
    const gridDiameter = 9;
    const gridWidth = gridDiameter * hexSize * 1.5;
    const gridHeight = gridDiameter * hexSize * Math.sqrt(3);
    
    displayCanvas.width = gridWidth;
    displayCanvas.height = gridHeight;
    analysisCanvas.width = gridWidth;
    analysisCanvas.height = gridHeight;
    
    const displayCtx = displayCanvas.getContext('2d')!;
    const analysisCtx = analysisCanvas.getContext('2d')!;
    
    // Calculate scale and position
    const scaleWidth = gridWidth / image.width;
    const scaleHeight = gridHeight / image.height;
    const scale = Math.max(scaleWidth, scaleHeight);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (gridWidth - scaledWidth) / 2;
    const y = (gridHeight - scaledHeight) / 2;
    
    // Draw original image for analysis
    analysisCtx.drawImage(image, x, y, scaledWidth, scaledHeight);
    
    // Draw darkened image for display
    displayCtx.filter = 'brightness(0.4) contrast(0.4)';
    displayCtx.globalAlpha = 0.85;
    displayCtx.drawImage(image, x, y, scaledWidth, scaledHeight);
    displayCtx.filter = 'none';
    displayCtx.globalAlpha = 1;
    
    // Create scaled images
    const displayImage = new Image();
    const analysisImage = new Image();
    
    let imagesLoaded = 0;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        const allPieces: HexPuzzlePiece[] = [];
        const centerX = gridWidth / 2;
        const centerY = gridHeight / 2;
        
        // Create pieces using both images
        validPositions.forEach(([q, r]: HexPosition, index: number) => {
          const pixelX = centerX + hexSize * (3/2 * q);
          const pixelY = centerY + hexSize * (Math.sqrt(3) * (r + q/2));
          
          const piece: HexPuzzlePiece = {
            id: index,
            correctPosition: { q, r },
            currentPosition: { q: -10, r: -10 },
            sourceX: pixelX - hexSize,
            sourceY: pixelY - hexSize,
            width: hexSize * 2,
            height: hexSize * 2,
            isSolved: false
          };

          // Check content using the analysis image
          const hasContent = hasSignificantContent(piece, analysisImage);
          
          console.debug(`Processing piece ${index}:`, {
            position: `q:${q}, r:${r}`,
            hasContent,
            willBeSolved: !hasContent
          });

          if (!hasContent) {
            piece.isSolved = true;
            piece.currentPosition = piece.correctPosition;
          }
          
          allPieces.push(piece);
        });

        resolve({ 
          pieces: allPieces,
          scaledImage: displayImage // Use the darkened image for display
        });
      }
    };
    
    displayImage.onload = onImageLoad;
    analysisImage.onload = onImageLoad;
    
    displayImage.src = displayCanvas.toDataURL();
    analysisImage.src = analysisCanvas.toDataURL();
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

// Add helper to determine if image is SVG
const isSvgImage = (img: HTMLImageElement): boolean => {
  return img.src.includes('data:image/svg+xml') || img.src.endsWith('.svg');
};

export const hasSignificantContent = (
  piece: HexPuzzlePiece,
  img: HTMLImageElement
): boolean => {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return true;

  const width = piece.width || 80;
  const height = piece.height || 80;
  tempCanvas.width = width;
  tempCanvas.height = height;

  // Draw the tile
  tempCtx.save();
  tempCtx.translate(width/2, height/2);
  drawHexImageTile(tempCtx, img, piece, 0, 0, width/2);
  tempCtx.restore();

  // Get image data
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let significantPixels = 0;
  let totalPixels = 0;

  const isSvg = isSvgImage(img);

  // Analyze pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a > 20) { // Only consider visible pixels
      totalPixels++;
      
      if (isSvg) {
        // For SVGs, look for near-black pixels
        if (r < 30 && g < 30 && b < 30) {
          significantPixels++;
        }
      } else {
        // For JPGs, look for non-white pixels with significant variation
        const isWhite = r > 240 && g > 240 && b > 240;
        const variation = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(b - r));
        
        if (!isWhite || variation > 15) {
          significantPixels++;
        }
      }
    }
  }

  const contentRatio = totalPixels > 0 ? significantPixels / totalPixels : 0;
  const threshold = isSvg ? 0.01 : 0.05; // Different thresholds for SVG and JPG
  const hasContent = contentRatio > threshold;

  // Debug logging
  console.debug(`Piece ${piece.id} analysis:`, {
    position: `q:${piece.correctPosition.q}, r:${piece.correctPosition.r}`,
    isSvg,
    totalPixels,
    significantPixels,
    contentRatio,
    threshold,
    hasContent
  });

  return hasContent;
}; 