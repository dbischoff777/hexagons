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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<HexPuzzlePiece[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [hoverPiece, setHoverPiece] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionEffect, setCompletionEffect] = useState(0);
  const [isPuzzleStarted, setIsPuzzleStarted] = useState(false);
  const [allTileOptions, setAllTileOptions] = useState<HexPuzzlePiece[]>([]);
  const [visibleTileOptions, setVisibleTileOptions] = useState<HexPuzzlePiece[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [clickedGridPosition, setClickedGridPosition] = useState<{ q: number, r: number } | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  
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
          
          // Create puzzle pieces
          const puzzlePieces = createHexPuzzle(img, tileSize);
          
          // Initialize all tile options with shuffled pieces
          const shuffledPieces = [...puzzlePieces].sort(() => Math.random() - 0.5);
          setAllTileOptions(shuffledPieces);
          
          // Set first 3 pieces as visible options
          setVisibleTileOptions(shuffledPieces.slice(0, 3));
          
          // Keep pieces in their correct positions initially for preview
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
    if (!canvas || !isPuzzleStarted) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const gridPosition = findGridPosition(x, y);

    if (selectedTileIndex !== null && gridPosition) {
      // Try to place the selected tile
      placeTileOnGrid(selectedTileIndex, gridPosition);
      setSelectedTileIndex(null);
      setClickedGridPosition(null);
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

  // Update the draw function
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base grid first with game-style hexagons
    const validPositions = [
      [0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1],
      [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 1],
      [-2, 0], [0, -2], [1, -2], [-2, 2], [-1, -1], [3, -3], [3, -2],
      [3, -1], [2, 1], [1, 2], [0, 3], [-3, 2], [-3, 1], [-3, 0],
      [-1, -2], [-1, 3], [-2, -1], [0, -3], [1, -3], [3, 0], [-2, 3],
      [-3, 3], [2, -3]
    ];

    // Draw grid cells with image
    validPositions.forEach(([q, r]) => {
      const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize);
      
      ctx.save();
      
      // Draw hex cell background
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

      // Draw the image section for this hex
      const correctPiece = pieces.find(p => 
        p.correctPosition.q === q && p.correctPosition.r === r
      );
      if (correctPiece) {
        drawHexImageTile(
          ctx,
          image,
          correctPiece,
          x,
          y,
          tileSize,
        );
      }

      // Draw hex border with game style
      ctx.strokeStyle = 'rgba(0, 255, 159, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    });

    // Draw placed pieces on top with slight transparency
    if (isPuzzleStarted) {
      pieces.forEach(piece => {
        if (piece.currentPosition.q !== -10) { // Only draw placed pieces
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

            // Increase brightness more
            ctx.filter = 'brightness(1.3)';
            
            // Add second glow layer
            ctx.strokeStyle = 'rgba(0, 255, 159, 0.4)';
            ctx.lineWidth = 3;
            ctx.stroke();
          } else {
            ctx.globalAlpha = 0.8; // Make unmatched pieces slightly transparent
          }

          drawHexImageTile(
            ctx,
            image,
            piece,
            x,
            y,
            tileSize,
          );

          ctx.restore();
        }
      });
    }

    if (isCompleted) {
      drawCompletionEffects(ctx, centerX, centerY, canvas.width, canvas.height);
    }

    // Draw preview at cursor position if tile is selected
    if (isPuzzleStarted && selectedTileIndex !== null && cursorPosition) {
      const selectedTile = visibleTileOptions[selectedTileIndex];
      
      ctx.save();
      ctx.globalAlpha = 0.6;
      
      // Add glow effect
      ctx.shadowColor = 'rgba(0, 255, 159, 0.4)';
      ctx.shadowBlur = 15;
      
      // Draw at cursor position, centered
      drawHexImageTile(
        ctx,
        image,
        selectedTile,
        cursorPosition.x,  // No offset needed, drawHexImageTile handles centering
        cursorPosition.y,
        tileSize
      );
      ctx.restore();
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
  }, [pieces, image, hoverPiece, isCompleted, completionEffect]);

  // Add helper to find grid position
  const findGridPosition = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Get all valid positions
    const validPositions: [number, number][] = [
      [0, 0], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1],
      [2, -2], [2, -1], [2, 0], [1, 1], [0, 2], [-1, 2], [-2, 1],
      [-2, 0], [0, -2], [1, -2], [-2, 2], [-1, -1], [3, -3], [3, -2],
      [3, -1], [2, 1], [1, 2], [0, 3], [-3, 2], [-3, 1], [-3, 0],
      [-1, -2], [-1, 3], [-2, -1], [0, -3], [1, -3], [3, 0], [-2, 3],
      [-3, 3], [2, -3]
    ];

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
      setAllTileOptions(prev => {
        const newOptions = prev.filter(t => t.id !== selectedTile.id);
        return newOptions;
      });

      // Update visible options
      setVisibleTileOptions(prev => {
        const newVisible = [...prev];
        newVisible.splice(tileIndex, 1);
        // Add next tile from remaining options if available
        if (allTileOptions.length > prev.length) {
          const nextTile = allTileOptions.find(t => 
            !prev.some(p => p.id === t.id) && t.id !== selectedTile.id
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

  return (
    <div className="hex-puzzle-mode">
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
          setCursorPosition({ x, y });
          setHoverPiece(findPieceAtPosition(x, y));
        }}
        onMouseLeave={() => setCursorPosition(null)}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {!isPuzzleStarted ? (
        <button 
          className="start-button"
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
        <div className="next-tiles-container">
          <div className="next-tiles">
            {visibleTileOptions.map((tile, index) => (
              <div 
                key={tile.id}
                className={`next-tile ${selectedTileIndex === index ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTileIndex(index);
                  setClickedGridPosition(null);
                }}
              >
                <canvas
                  ref={el => {
                    if (el && image) {
                      const ctx = el.getContext('2d');
                      if (ctx) {
                        drawHexImageTile(
                          ctx,
                          image,
                          tile,
                          tileSize,
                          tileSize,
                          tileSize
                        );
                      }
                    }
                  }}
                  width={tileSize * 2}
                  height={tileSize * 2}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="exit-button" onClick={() => setShowExitModal(true)}>
        Exit Puzzle
      </button>

      {/* Exit Confirmation Modal */}
      <SpringModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Puzzle"
        message="Are you sure you want to exit? Your progress will be lost."
        variant="danger"
      >
        <button 
          className="modal-button cancel" 
          onClick={() => setShowExitModal(false)}
        >
          Stay
        </button>
        <button 
          className="modal-button confirm" 
          onClick={onExit}
        >
          Exit
        </button>
      </SpringModal>

      {/* Completion Modal */}
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