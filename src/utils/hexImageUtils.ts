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
  imageWidth: number,
  imageHeight: number,
  hexSize: number
): HexPuzzlePiece[] => {
  const pieces: HexPuzzlePiece[] = [];
  
  const scaleFactor = 1;
  const adjustedHexSize = hexSize * scaleFactor;
  
  const width = adjustedHexSize * 2;
  const height = adjustedHexSize * Math.sqrt(3);
  
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;
  
  const pixelFromAxial = (q: number, r: number) => {
    const x = adjustedHexSize * (1.7 * q);
    const y = adjustedHexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  // Keep the same valid positions
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

  const overlap = 1;

  validPositions.forEach(([q, r], index) => {
    const { x, y } = pixelFromAxial(q, r);
    
    const sourceX = centerX + x - width/2;
    const sourceY = centerY + y - height/2;

    const sectionWidth = width * overlap;
    const sectionHeight = height * overlap;

    pieces.push({
      id: index,
      correctPosition: { q, r },
      currentPosition: { q, r },
      sourceX: Math.max(0, Math.min(imageWidth - sectionWidth, sourceX)),
      sourceY: Math.max(0, Math.min(imageHeight - sectionHeight, sourceY)),
      width: sectionWidth,
      height: sectionHeight,
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

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const pointX = x + size * Math.cos(angle);
    const pointY = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  }
  ctx.closePath();

  if (debug) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${tile.correctPosition.q},${tile.correctPosition.r}`, x, y - 10);
    ctx.fillText(`#${tile.id}`, x, y + 10);

    ctx.fillStyle = 'yellow';
    ctx.font = '10px Arial';
    ctx.fillText(`src: ${Math.round(tile.sourceX)},${Math.round(tile.sourceY)}`, x, y + 25);
  }

  ctx.clip();
  ctx.globalAlpha = 1.0;
  
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