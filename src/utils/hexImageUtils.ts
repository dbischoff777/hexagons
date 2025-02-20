import { generateValidPositions } from "./svgTileUtils";

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

interface ScalingOptions {
  targetWidth?: number;
  targetHeight?: number;
  maintainAspectRatio?: boolean;
}

export const createHexPuzzle = async (
  image: HTMLImageElement,
  tileSize: number,
  scalingOptions?: ScalingOptions,
  validPositions?: [number, number][]
): Promise<{ pieces: HexPuzzlePiece[]; scaledImage: HTMLImageElement }> => {
  // Create a temporary canvas for scaling
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) throw new Error('Could not get canvas context');

  // Calculate dimensions
  let scaledWidth: number;
  let scaledHeight: number;

  if (scalingOptions) {
    if (scalingOptions.maintainAspectRatio !== false) {
      // Maintain aspect ratio while fitting within target dimensions
      const aspectRatio = image.width / image.height;
      if (scalingOptions.targetWidth && scalingOptions.targetHeight) {
        if (aspectRatio > scalingOptions.targetWidth / scalingOptions.targetHeight) {
          scaledWidth = scalingOptions.targetWidth;
          scaledHeight = scaledWidth / aspectRatio;
        } else {
          scaledHeight = scalingOptions.targetHeight;
          scaledWidth = scaledHeight * aspectRatio;
        }
      } else if (scalingOptions.targetWidth) {
        scaledWidth = scalingOptions.targetWidth;
        scaledHeight = scaledWidth / aspectRatio;
      } else if (scalingOptions.targetHeight) {
        scaledHeight = scalingOptions.targetHeight;
        scaledWidth = scaledHeight * aspectRatio;
      } else {
        scaledWidth = image.width;
        scaledHeight = image.height;
      }
    } else {
      // Force exact dimensions
      scaledWidth = scalingOptions.targetWidth || image.width;
      scaledHeight = scalingOptions.targetHeight || image.height;
    }
  } else {
    // Default scaling if no options provided
    scaledWidth = image.width;
    scaledHeight = image.height;
  }

  // Set canvas dimensions and draw scaled image
  tempCanvas.width = scaledWidth;
  tempCanvas.height = scaledHeight;
  tempCtx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

  // Create scaled image
  const scaledImage = new Image();
  scaledImage.src = tempCanvas.toDataURL();

  // Wait for scaled image to load
  await new Promise((resolve) => {
    scaledImage.onload = resolve;
  });

  // Create puzzle pieces using the scaled image
  const allPieces: HexPuzzlePiece[] = [];
  const centerX = scaledWidth / 2;
  const centerY = scaledHeight / 2;
  
  // Use passed validPositions or generate default
  const positions = validPositions || generateValidPositions(5);
  
  positions.forEach(([q, r]: HexPosition, index: number) => {
    const pixelX = centerX + tileSize * (3/2 * q);
    const pixelY = centerY + tileSize * (Math.sqrt(3) * (r + q/2));
    
    const piece: HexPuzzlePiece = {
      id: index,
      correctPosition: { q, r },
      currentPosition: { q: -10, r: -10 },
      sourceX: pixelX - tileSize,
      sourceY: pixelY - tileSize,
      width: tileSize * 2,
      height: tileSize * 2,
      isSolved: false
    };

    // Check content using the scaled image
    const hasContent = hasSignificantContent(piece, scaledImage);
    
    if (!hasContent) {
      piece.isSolved = true;
      piece.currentPosition = piece.correctPosition;
    }
    
    allPieces.push(piece);
  });

  return { pieces: allPieces, scaledImage };
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

  return hasContent;
}; 