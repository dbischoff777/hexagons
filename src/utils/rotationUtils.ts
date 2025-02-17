// Constants
export const ROTATION_WARNING_DELAY = 1500; // 1.5 seconds warning before rotation
export const ROTATION_INTERVAL = 15000; // 5 seconds between rotations
export const ROTATION_ANIMATION_DURATION = 1000; // 1 second for smooth rotation

// Types
export interface RotationState {
  boardRotation: number;
  showWarning: boolean;
  showRotationText: boolean;
  isRotating: boolean;
}

// Helper function to rotate tile edges
export const rotateTileEdges = (edges: { color: string }[], counterClockwise: boolean = false) => {
  const newEdges = [...edges];
  if (counterClockwise) {
    // Move first edge to end for counter-clockwise rotation
    const firstEdge = newEdges.shift();
    if (firstEdge) newEdges.push(firstEdge);
  } else {
    // Move last edge to start for clockwise rotation
    const lastEdge = newEdges.pop();
    if (lastEdge) newEdges.unshift(lastEdge);
  }
  return newEdges;
};

// Modified animation function with better performance
export const animateRotation = (
  currentRotation: number,
  onStateUpdate: (state: RotationState) => void,
  onComplete: () => void
) => {
  const startTime = performance.now();
  const duration = ROTATION_ANIMATION_DURATION;
  let animationFrame: number;
  let isAnimating = true;
  let lastRotation = currentRotation;
  let lastUpdateTime = startTime;

  const animate = (currentTime: number) => {
    if (!isAnimating) return;
    
    // Throttle updates to every 16ms (roughly 60fps)
    if (currentTime - lastUpdateTime < 16) {
      animationFrame = requestAnimationFrame(animate);
      return;
    }
    
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Use easing function for smooth rotation
    const eased = easeInOutCubic(progress);
    const newRotation = currentRotation + (180 * eased);

    // Only update if rotation has changed significantly
    if (Math.abs(newRotation - lastRotation) > 0.5) {
      lastRotation = newRotation;
      lastUpdateTime = currentTime;
      
      onStateUpdate({
        boardRotation: newRotation,
        showWarning: false,
        showRotationText: false,
        isRotating: progress < 1
      });
    }

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      isAnimating = false;
      // Ensure final state is set exactly
      onStateUpdate({
        boardRotation: currentRotation + 180,
        showWarning: false,
        showRotationText: false,
        isRotating: false
      });
      // Call onComplete without modifying tile state
      onComplete();
    }
  };

  animationFrame = requestAnimationFrame(animate);

  return () => {
    isAnimating = false;
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

    // Start the interval immediately, but the first warning will happen after ROTATION_INTERVAL
    intervalId = window.setInterval(() => {
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