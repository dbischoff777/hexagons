import React, { useState, useEffect, useRef } from 'react';
import { HexPuzzlePiece, drawHexImageTile, createHexPuzzle } from '../utils/hexImageUtils';
import { hexToPixel } from '../utils/hexUtils';
import { loadAndTileSvg } from '../utils/svgTileUtils';
import './HexPuzzleMode.css';

interface HexPuzzleModeProps {
  imageSrc: string;
  onComplete: () => void;
  onExit: () => void;
}

const HexPuzzleMode: React.FC<HexPuzzleModeProps> = ({ imageSrc, onComplete, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<HexPuzzlePiece[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [hoverPiece, setHoverPiece] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionEffect, setCompletionEffect] = useState(0);
  const [isDebug] = useState(true);
  
  const tileSize = 40; // Same as main game
  const canvasWidth = 1200;
  const canvasHeight = Math.floor(1200 * (485/440)); // Maintain aspect ratio of 440x485

  // Load image and initialize puzzle
  useEffect(() => {
    const loadImage = async () => {
      try {
        const tiledSvg = await loadAndTileSvg(imageSrc, tileSize, 3);
        const img = new Image();
        
        img.onload = () => {
          setImage(img);
          
          // Use createHexPuzzle with the loaded image
          const puzzlePieces = createHexPuzzle(
            img,    // Pass the image directly
            tileSize
          );
          
          setPieces(puzzlePieces);
        };

        const svgBlob = new Blob([tiledSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
      } catch (error) {
        console.error('Error loading or processing SVG:', error);
      }
    };

    loadImage();
  }, [imageSrc, tileSize]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const clickedPiece = findPieceAtPosition(x, y);

    if (clickedPiece !== null) {
      if (selectedPiece === null) {
        setSelectedPiece(clickedPiece);
      } else {
        // Swap pieces
        swapPieces(selectedPiece, clickedPiece);
        setSelectedPiece(null);
      }
    }
  };

  // Find piece at position
  const findPieceAtPosition = (x: number, y: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      const pos = hexToPixel(
        piece.currentPosition.q,
        piece.currentPosition.r,
        centerX,
        centerY,
        tileSize
      );

      // Simple distance check for now
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance < tileSize) {
        return i;
      }
    }
    return null;
  };

  // Swap pieces
  const swapPieces = (index1: number, index2: number) => {
    setPieces(prevPieces => {
      const newPieces = [...prevPieces];
      const temp = newPieces[index1].currentPosition;
      newPieces[index1].currentPosition = newPieces[index2].currentPosition;
      newPieces[index2].currentPosition = temp;
      
      // Check if puzzle is solved
      if (isPuzzleSolved(newPieces)) {
        handlePuzzleCompletion();
      }
      
      return newPieces;
    });
  };

  // Check if puzzle is solved
  const isPuzzleSolved = (currentPieces: HexPuzzlePiece[]): boolean => {
    return currentPieces.every(piece => 
      piece.currentPosition.q === piece.correctPosition.q &&
      piece.currentPosition.r === piece.correctPosition.r
    );
  };

  // Add completion handler
  const handlePuzzleCompletion = () => {
    setIsCompleted(true);
    setCompletionEffect(1);
    
    // Animate completion effect
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCompletionEffect(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Call onComplete after animation
        setTimeout(onComplete, 500);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Update the draw function
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base grid first
    const validPositions = [
      [0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1],
      [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 1],
      [-2, 0], [0, -2], [1, -2], [-2, 2], [-1, -1], [3, -3], [3, -2],
      [3, -1], [2, 1], [1, 2], [0, 3], [-3, 2], [-3, 1], [-3, 0],
      [-1, -2], [-1, 3], [-2, -1], [0, -3], [1, -3], [3, 0], [-2, 3],
      [-3, 3], [2, -3]
    ];

    // Draw empty grid cells
    validPositions.forEach(([q, r]) => {
      const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize);
      
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const pointX = x + tileSize * Math.cos(angle);
        const pointY = y + tileSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(26, 26, 46, 0.5)';
      ctx.fill();
      ctx.strokeStyle = isDebug ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 159, 0.2)';
      ctx.stroke();
      ctx.restore();
    });

    // Draw placed pieces
    pieces.forEach((piece, index) => {
      const { x, y } = hexToPixel(
        piece.currentPosition.q,
        piece.currentPosition.r,
        centerX,
        centerY,
        tileSize
      );

      const isSelected = index === selectedPiece;
      const isHovered = index === hoverPiece;

      ctx.save();
      if (isSelected || isHovered) {
        ctx.shadowColor = isSelected ? '#00FF9F' : 'rgba(0, 255, 159, 0.5)';
        ctx.shadowBlur = 15;
      }

      drawHexImageTile(
        ctx, 
        image, 
        piece, 
        x, 
        y, 
        tileSize,
        false // Remove debug flag
      );
      ctx.restore();
    });

    // Draw dragged piece last (if any)
    if (selectedPiece !== null) {
      const piece = pieces[selectedPiece];
      const { x, y } = hexToPixel(
        piece.currentPosition.q,
        piece.currentPosition.r,
        centerX,
        centerY,
        tileSize
      );

      ctx.save();
      ctx.globalAlpha = 0.8;
      drawHexImageTile(ctx, image, piece, x, y, tileSize, false);
      ctx.restore();
    }

    if (isCompleted) {
      drawCompletionEffects(ctx, centerX, centerY, canvas.width, canvas.height);
    }
  };

  // Add completion effects helper
  const drawCompletionEffects = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ) => {
    ctx.save();
    
    // Draw glow
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, width / 2
    );
    gradient.addColorStop(0, `rgba(0, 255, 159, ${0.2 * completionEffect})`);
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw text
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 255, 255, ${completionEffect})`;
    ctx.shadowColor = '#00FF9F';
    ctx.shadowBlur = 20;
    ctx.fillText('Puzzle Completed!', centerX, centerY);
    
    ctx.restore();
  };

  // Animation frame
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [pieces, image, selectedPiece, hoverPiece, isCompleted, completionEffect]);

  return (
    <div className="hex-puzzle-mode">
      <div className="puzzle-container">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setHoverPiece(findPieceAtPosition(x, y));
          }}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {/* Add debug view of original image */}
        <div className="debug-view">
          {image && (
            <img 
              src={image.src} 
              alt="Original"
              style={{ 
                width: '440px',
                height: '485px',
                border: '1px solid red'
              }}
            />
          )}
        </div>
      </div>
      <button className="exit-button" onClick={onExit}>
        Exit Puzzle
      </button>
    </div>
  );
};

export default HexPuzzleMode; 