import React, { useState, useEffect, useRef } from 'react';
import { HexPuzzlePiece, drawHexImageTile, createHexPuzzle } from '../utils/hexImageUtils';
import { hexToPixel } from '../utils/hexUtils';
import { loadAndTileSvg } from '../utils/svgTileUtils';
import './HexPuzzleMode.css';
import SpringModal from './SpringModal';

interface HexPuzzleModeProps {
  imageSrc: string;
  onComplete: () => void;
  onExit: () => void;
}

const HexPuzzleMode: React.FC<HexPuzzleModeProps> = ({ imageSrc, onComplete, onExit }) => {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<HexPuzzlePiece[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionEffect, setCompletionEffect] = useState(0);
  const [isPuzzleStarted, setIsPuzzleStarted] = useState(false);
  const [allTileOptions, setAllTileOptions] = useState<HexPuzzlePiece[]>([]);
  const [visibleTileOptions, setVisibleTileOptions] = useState<HexPuzzlePiece[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const tileSize = 40; // Same as main game
  const canvasWidth = 800; // Smaller initial size
  const canvasHeight = 800; // Square canvas for better centering

  // Add at the top of the component, outside any effects
  const validPositions: [number, number][] = [
    [0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1],
    [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 1],
    [-2, 0], [0, -2], [1, -2], [-2, 2], [-1, -1], [3, -3], [3, -2],
    [3, -1], [2, 1], [1, 2], [0, 3], [-3, 2], [-3, 1], [-3, 0],
    [-1, -2], [-1, 3], [-2, -1], [0, -3], [1, -3], [3, 0], [-2, 3],
    [-3, 3], [2, -3]
  ];

  // Load image and initialize puzzle
  useEffect(() => {
    const loadImage = async () => {
      try {
        const tiledSvg = await loadAndTileSvg(imageSrc, tileSize, 3);
        const img = new Image();
        
        img.onload = () => {
          setImage(img);
          
          // Create puzzle pieces
          const puzzlePieces = createHexPuzzle(img, tileSize);
          
          // Initialize all tile options with shuffled pieces
          const shuffledPieces = [...puzzlePieces].sort(() => Math.random() - 0.5);
          setAllTileOptions(shuffledPieces);
          
          // Set first 3 pieces as visible options
          setVisibleTileOptions(shuffledPieces.slice(0, 3));
          
          // Initialize pieces in their correct positions for preview
          const initialPieces = puzzlePieces.map(piece => ({
            ...piece,
            currentPosition: piece.correctPosition,
            isSolved: false
          }));
          setPieces(initialPieces);
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
    const canvas = gameCanvasRef.current;
    if (!canvas || !isPuzzleStarted) return;

    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Apply scaling to get the correct canvas coordinates
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    // Adjust for context scaling and translation
    const adjustedX = (x - canvas.width/2) / 0.8 + canvas.width/2;
    const adjustedY = (y - canvas.height/2) / 0.8 + canvas.height/2;
    
    const gridPosition = findGridPosition(adjustedX, adjustedY);

    if (selectedTileIndex !== null && gridPosition) {
      placeTileOnGrid(selectedTileIndex, gridPosition);
      setSelectedTileIndex(null);
    }
  };

  // Check if puzzle is solved
  const isPuzzleSolved = (currentPieces: HexPuzzlePiece[]): boolean => {
    // Count how many pieces are correctly placed
    let correctlyPlacedCount = 0;
    validPositions.forEach(([q, r]) => {
      const piece = currentPieces.find(p => 
        p.currentPosition.q === q && 
        p.currentPosition.r === r &&
        p.correctPosition.q === q &&
        p.correctPosition.r === r
      );
      if (piece) correctlyPlacedCount++;
    });

    // Puzzle is solved when all positions have correct pieces
    return correctlyPlacedCount === validPositions.length;
  };

  // Add completion handler
  const handlePuzzleCompletion = () => {
    setIsCompleted(true);
    setCompletionEffect(1);
    setShowCompletionModal(true);
    
    // Animate completion effect
    const startTime = Date.now();
    const duration = 2000; // 2 seconds
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCompletionEffect(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Update the background canvas useEffect
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Apply scaling
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(0.8, 0.8);
    ctx.translate(-centerX, -centerY);

    // Draw grid and base image
    validPositions.forEach(([q, r]) => {
      const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize);
      
      // Draw hex cell background and grid
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const pointX = x + tileSize * Math.cos(angle);
        const pointY = y + tileSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(pointX, pointY);
        else ctx.lineTo(pointX, pointY);
      }
      ctx.closePath();

      // Fill with game-style gradient
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, tileSize
      );
      gradient.addColorStop(0, 'rgba(26, 26, 46, 0.8)');
      gradient.addColorStop(1, 'rgba(26, 26, 46, 0.4)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add inner glow
      ctx.strokeStyle = 'rgba(0, 255, 159, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw hex border with game style
      ctx.strokeStyle = 'rgba(0, 255, 159, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw the base image with better visibility
      const correctPiece = pieces.find(p => 
        p.correctPosition.q === q && p.correctPosition.r === r
      );
      if (correctPiece) {
        if (isPuzzleStarted) {
          // Increase opacity for better visibility during puzzle
          ctx.globalAlpha = 0.4;
          // Add subtle glow to make image more visible
          ctx.shadowColor = 'rgba(0, 255, 159, 0.2)';
          ctx.shadowBlur = 10;
        }
        drawHexImageTile(ctx, image, correctPiece, x, y, tileSize);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }
    });

    ctx.restore();
  }, [image, pieces, isPuzzleStarted]);

  // Update the game animation to only draw dynamic content
  useEffect(() => {
    const canvas = gameCanvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(0.8, 0.8);
      ctx.translate(-centerX, -centerY);

      // Only draw active pieces and preview
      if (isPuzzleStarted) {
        // Draw placed pieces
        pieces.forEach(piece => {
          if (piece.currentPosition.q !== -10) {
            drawActivePiece(ctx, piece, centerX, centerY);
          }
        });

        // Draw preview at cursor position if tile is selected
        if (selectedTileIndex !== null && cursorPosition) {
          const selectedTile = visibleTileOptions[selectedTileIndex];
          
          ctx.save();
          
          ctx.globalAlpha = 0.8;
          ctx.shadowColor = 'rgba(0, 255, 159, 0.6)';
          ctx.shadowBlur = 25;
          
          // Draw at cursor position
          drawHexImageTile(
            ctx,
            image!,
            selectedTile,
            cursorPosition.x,
            cursorPosition.y,
            tileSize
          );

          // Add hex outline
          ctx.strokeStyle = 'rgba(0, 255, 159, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const pointX = cursorPosition.x + tileSize * Math.cos(angle);
            const pointY = cursorPosition.y + tileSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(pointX, pointY);
            else ctx.lineTo(pointX, pointY);
          }
          ctx.closePath();
          ctx.stroke();
          
          ctx.restore();
        }
      }

      if (isCompleted) {
        drawCompletionEffects(ctx, centerX, centerY, canvas.width, canvas.height);
      }

      ctx.restore();
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [pieces, selectedTileIndex, cursorPosition, isPuzzleStarted, isCompleted]);

  // Add helper to find grid position
  const findGridPosition = (x: number, y: number) => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return null;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Find closest hex position
    let closestDist = Infinity;
    let closestPos = null;

    validPositions.forEach(([q, r]) => {
      const hexPos = hexToPixel(q, r, centerX, centerY, tileSize);
      const dist = Math.sqrt(Math.pow(x - hexPos.x, 2) + Math.pow(y - hexPos.y, 2));
      if (dist < closestDist && dist < tileSize) {
        closestDist = dist;
        closestPos = { q, r };
      }
    });

    return closestPos;
  };

  // Add function to place tile on grid
  const placeTileOnGrid = (tileIndex: number, position: { q: number, r: number } | null) => {
    if (!position) return;

    const selectedTile = visibleTileOptions[tileIndex];
    const isCorrectPlacement = 
      position.q === selectedTile.correctPosition.q && 
      position.r === selectedTile.correctPosition.r;
    
    if (isCorrectPlacement) {
      // Create the new tile with the target position
      const newTile: HexPuzzlePiece = {
        ...selectedTile,
        currentPosition: position,
        correctPosition: selectedTile.correctPosition,
        isSolved: true
      };

      // Update pieces array with new tile
      setPieces(prevPieces => {
        const newPieces = [...prevPieces];
        
        // Find if there's already a piece at this position
        const existingIndex = newPieces.findIndex(p => 
          p.currentPosition.q === position.q && 
          p.currentPosition.r === position.r
        );

        if (existingIndex >= 0) {
          // Replace existing piece
          newPieces[existingIndex] = newTile;
        } else {
          // Add new piece
          newPieces.push(newTile);
        }

        // Check if puzzle is solved
        if (isPuzzleSolved(newPieces)) {
          handlePuzzleCompletion();
        }

        return newPieces;
      });

      // Update tile options
      setAllTileOptions((prev: HexPuzzlePiece[]) => {
        const newOptions = prev.filter((t: HexPuzzlePiece) => t.id !== selectedTile.id);
        return newOptions;
      });

      // Update visible options
      setVisibleTileOptions((prev: HexPuzzlePiece[]) => {
        const newVisible = [...prev];
        newVisible.splice(tileIndex, 1);
        // Add next tile from remaining options if available
        if (allTileOptions.length > prev.length) {
          const nextTile = allTileOptions.find((t: HexPuzzlePiece) => 
            !prev.some((p: HexPuzzlePiece) => p.id === t.id) && t.id !== selectedTile.id
          );
          if (nextTile) {
            newVisible.push(nextTile);
          }
        }
        return newVisible;
      });
    } else {
      // For incorrect placement, rotate the visible options
      setVisibleTileOptions(prev => {
        const newVisible = [...prev];
        const [removedTile] = newVisible.splice(tileIndex, 1);
        newVisible.push(removedTile);
        return newVisible;
      });
    }
  };

  // Draw next tile options
  const drawNextTileOption = (
    ctx: CanvasRenderingContext2D,
    tile: HexPuzzlePiece,
    isSelected: boolean
  ) => {
    ctx.save();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(0, 255, 159, 0.4)';
    ctx.shadowBlur = isSelected ? 20 : 15;
    
    // Draw the tile image
    drawHexImageTile(
      ctx,
      image!, // Add non-null assertion since we know image is loaded at this point
      tile,
      50,  // Center X of the canvas
      50,  // Center Y of the canvas
      tileSize * 0.8  // Slightly smaller for next tiles
    );

    // Add selection indicator
    if (isSelected) {
      ctx.strokeStyle = '#00FF9F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(50, 50, 42, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Add hover effect
    if (isSelected) {
      const gradient = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);
      gradient.addColorStop(0, 'rgba(0, 255, 159, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 255, 159, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(50, 50, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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

  const drawActivePiece = (
    ctx: CanvasRenderingContext2D, 
    piece: HexPuzzlePiece,
    centerX: number,
    centerY: number
  ) => {
    const { x, y } = hexToPixel(
      piece.currentPosition.q,
      piece.currentPosition.r,
      centerX,
      centerY,
      tileSize
    );

    ctx.save();

    // Add glow effect for correctly placed pieces
    const isCorrectlyPlaced = 
      piece.currentPosition.q === piece.correctPosition.q && 
      piece.currentPosition.r === piece.correctPosition.r;

    if (isCorrectlyPlaced) {
      // Add stronger matched tile effects
      ctx.shadowColor = 'rgba(0, 255, 159, 0.6)';
      ctx.shadowBlur = 20;
      
      // Add stronger radial glow
      const gradient = ctx.createRadialGradient(
        x, y, 0,
        x, y, tileSize * 1.2
      );
      gradient.addColorStop(0, 'rgba(0, 255, 159, 0.3)');
      gradient.addColorStop(0.6, 'rgba(0, 255, 159, 0.1)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add pulsing animation
      const pulseScale = 1 + Math.sin(Date.now() * 0.004) * 0.05;
      ctx.translate(x, y);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-x, -y);

      // Increase brightness
      ctx.filter = 'brightness(1.3)';
      
      // Add second glow layer
      ctx.strokeStyle = 'rgba(0, 255, 159, 0.4)';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.8; // Make unmatched pieces slightly transparent
    }

    drawHexImageTile(ctx, image!, piece, x, y, tileSize);
    ctx.restore();
  };

  return (
    <div className="hex-puzzle-container">
      <div className="hex-puzzle-canvas-wrapper">
        <canvas
          ref={backgroundCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />
        <canvas
          ref={gameCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
          onClick={handleCanvasClick}
          onMouseMove={(e) => {
            const canvas = gameCanvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            
            // Get the actual displayed dimensions
            const displayWidth = rect.width;
            const displayHeight = rect.height;
            
            // Convert screen coordinates to canvas space
            const scaleX = canvas.width / displayWidth;
            const scaleY = canvas.height / displayHeight;
            
            // Get mouse position in canvas coordinates
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            // Get the center point
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            // Adjust for the canvas scale transformation
            const adjustedX = (mouseX - centerX) / 0.8 + centerX;
            const adjustedY = (mouseY - centerY) / 0.8 + centerY;
            
            setCursorPosition({
              x: adjustedX,
              y: adjustedY
            });
          }}
          onMouseLeave={() => setCursorPosition(null)}
        />
      </div>

      {!isPuzzleStarted ? (
        <button 
          className="hex-puzzle-start-button"
          onClick={() => {
            setPieces(prevPieces => 
              prevPieces.map((piece, index) => ({
                ...piece,
                currentPosition: { 
                  q: -10,
                  r: index
                },
                isSolved: false
              }))
            );
            setIsPuzzleStarted(true);
          }}
        >
          Start Puzzle
        </button>
      ) : (
        <div className="hex-puzzle-next-tiles-container">
          <div className="hex-puzzle-next-tiles">
            {visibleTileOptions.map((tile, index) => (
              <div 
                key={tile.id}
                className={`hex-puzzle-next-tile ${selectedTileIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedTileIndex(selectedTileIndex === index ? null : index)}
              >
                <canvas
                  width={100}
                  height={100}
                  ref={el => {
                    if (el) {
                      const ctx = el.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, 100, 100);
                        drawNextTileOption(ctx, tile, selectedTileIndex === index);
                      }
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="hex-puzzle-exit-button" onClick={() => setShowExitModal(true)}>
        Exit Puzzle
      </button>

      {/* Modals */}
      <SpringModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Puzzle"
        message="Are you sure you want to exit? Your progress will be lost."
        variant="danger"
      >
        <button className="modal-button cancel" onClick={() => setShowExitModal(false)}>
          Stay
        </button>
        <button className="modal-button confirm" onClick={onExit}>
          Exit
        </button>
      </SpringModal>

      <SpringModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          onComplete();
        }}
        title="Puzzle Completed!"
        message="Congratulations! You've completed the puzzle!"
      >
        <button 
          className="modal-button confirm"
          onClick={() => {
            setShowCompletionModal(false);
            onComplete();
          }}
        >
          Continue
        </button>
      </SpringModal>
    </div>
  );
};

export default HexPuzzleMode; 