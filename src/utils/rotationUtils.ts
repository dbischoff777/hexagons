// Constants
export const ROTATION_WARNING_DELAY = 1500; // 1.5 seconds warning before rotation
export const ROTATION_INTERVAL = 5000; // 5 seconds between rotations
export const ROTATION_ANIMATION_DURATION = 1000; // 1 second for smooth rotation

// Types
export interface RotationState {
  boardRotation: number;
  showWarning: boolean;
  showRotationText: boolean;
  isRotating: boolean;
}

// Helper function to rotate tile edges
export const rotateTileEdges = (edges: { color: string }[]) => {
  return [...edges.slice(-1), ...edges.slice(0, -1)];
};

// Modified animation function with better performance
export const animateRotation = (
  currentRotation: number,
  onStateUpdate: (state: RotationState) => void,
  onComplete: () => void
) => {
  const startTime = performance.now();
  const duration = 1000; // 1 second animation
  let animationFrame: number;

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easing function for smooth rotation
    const eased = easeInOutCubic(progress);
    const newRotation = currentRotation + (180 * eased);

    // Batch state updates
    onStateUpdate({
      boardRotation: newRotation,
      showWarning: false,
      showRotationText: false,
      isRotating: progress < 1
    });

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };

  animationFrame = requestAnimationFrame(animate);

  // Return cleanup function
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
};

// Easing function for smooth animation
const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Function to setup rotation timer with improved performance
export const setupRotationTimer = (
  isGameOver: boolean,
  rotationEnabled: boolean,
  onWarning: () => void,
  onRotation: () => void
): (() => void) => {
  if (!isGameOver && rotationEnabled) {
    let warningTimeoutId: number;
    let intervalId: number;

    // Use a more precise timing mechanism
    const startTime = performance.now();
    const scheduleNextRotation = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime;
      const nextInterval = ROTATION_INTERVAL - (elapsed % ROTATION_INTERVAL);

      intervalId = window.setTimeout(() => {
        onWarning();
        warningTimeoutId = window.setTimeout(onRotation, ROTATION_WARNING_DELAY);
        scheduleNextRotation();
      }, nextInterval);
    };

    scheduleNextRotation();

    return () => {
      clearTimeout(intervalId);
      clearTimeout(warningTimeoutId);
    };
  }
  return () => {};
}; 