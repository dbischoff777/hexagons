// Constants
export const ROTATION_WARNING_DELAY = 1500; // 1.5 seconds warning before rotation
export const ROTATION_INTERVAL = 5000; // 5 seconds between rotations
export const ROTATION_ANIMATION_DURATION = 1000; // 1 second for smooth rotation

// Types
export interface RotationState {
  boardRotation: number;
  showWarning: boolean;
  showRotationText: boolean;
}

// Helper function to rotate tile edges
export const rotateTileEdges = (edges: { color: string }[]) => {
  return [...edges.slice(-1), ...edges.slice(0, -1)];
};

// Function to handle smooth rotation animation
export const animateRotation = (
  startRotation: number,
  onRotationUpdate: (rotation: number) => void,
  onRotationComplete: () => void
) => {
  let animationFrameId: number;
  let startTime: number | null = null;
  const targetRotation = startRotation + 180;

  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / ROTATION_ANIMATION_DURATION, 1);

    // Easing function for smooth rotation
    const easeProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress;
    onRotationUpdate(currentRotation % 360);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      onRotationUpdate(targetRotation % 360);
      onRotationComplete();
    }
  };

  animationFrameId = requestAnimationFrame(animate);

  // Return cleanup function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
};

// Function to setup rotation timer
export const setupRotationTimer = (
  isGameOver: boolean,
  rotationEnabled: boolean,
  onWarning: () => void,
  onRotation: () => void
): (() => void) => {
  if (!isGameOver && rotationEnabled) {
    let warningTimeoutId: number;
    const intervalId = setInterval(() => {
      onWarning();
      warningTimeoutId = window.setTimeout(onRotation, ROTATION_WARNING_DELAY);
    }, ROTATION_INTERVAL);

    return () => {
      clearInterval(intervalId);
      clearTimeout(warningTimeoutId);
    };
  }
  return () => {};
}; 