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
  startRotation: number,
  onRotationUpdate: (state: RotationState) => void,
  onComplete: () => void
) => {
  let animationFrameId: number;
  let startTime: number | null = null;
  const targetRotation = startRotation + 180;

  // Use a more optimized easing function
  const easeInOutCubic = (t: number): number => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / ROTATION_ANIMATION_DURATION, 1);

    // Use the optimized easing function
    const easeProgress = easeInOutCubic(progress);

    // Calculate rotation with minimal floating point operations
    const currentRotation = startRotation + ((targetRotation - startRotation) * easeProgress);
    
    // Round to 2 decimal places to reduce jitter
    const roundedRotation = Math.round(currentRotation * 100) / 100;
    
    // Update all rotation-related state at once
    onRotationUpdate({
      boardRotation: roundedRotation % 360,
      showWarning: false,
      showRotationText: false,
      isRotating: true
    });

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      // Ensure we end exactly at target rotation
      onRotationUpdate({
        boardRotation: targetRotation % 360,
        showWarning: false,
        showRotationText: false,
        isRotating: false
      });
      onComplete();
    }
  };

  // Use requestAnimationFrame for smoother animation
  animationFrameId = requestAnimationFrame(animate);

  // Return cleanup function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
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