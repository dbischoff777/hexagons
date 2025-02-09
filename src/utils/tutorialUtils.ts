import { TutorialHighlightArea } from '../types/tutorial'

export const drawTutorialHighlight = (
  ctx: CanvasRenderingContext2D,
  highlightArea: TutorialHighlightArea | null,
  dimensions: { centerX: number, centerY: number, nextPiecesX: number, nextPiecesY: number }
) => {
  if (!highlightArea) return

  const { centerX, centerY, nextPiecesX, nextPiecesY } = dimensions

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  ctx.strokeStyle = '#00FF9F'
  ctx.lineWidth = 2
  ctx.shadowColor = '#00FF9F'
  ctx.shadowBlur = 15

  switch (highlightArea.type) {
    case 'grid':
      ctx.clearRect(centerX - 300, centerY - 300, 600, 600)
      ctx.strokeRect(centerX - 300, centerY - 300, 600, 600)
      break
    case 'nextPieces':
      ctx.clearRect(nextPiecesX - 50, nextPiecesY - 50, 100, 300)
      ctx.strokeRect(nextPiecesX - 50, nextPiecesY - 50, 100, 300)
      break
    // Add other highlight cases...
  }
} 