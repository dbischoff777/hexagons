// Constants for rotation
export const ROTATION_WARNING_DELAY = 1500; // 1.5 seconds warning before rotation
export const ROTATION_INTERVAL = 5000; // 5 seconds between rotations
export const ROTATION_ANIMATION_DURATION = 1000; // 1 second for smooth rotation

// Helper function to rotate tile edges
export const rotateTileEdges = (edges: { color: string }[]) => {
  // Preserve the original array and create a new one to avoid reference issues
  return [...edges.slice(-1), ...edges.slice(0, -1)];
};

// Function to handle smooth rotation animation
export const animateRotation = (
  startRotation: number,
  onRotationUpdate: (rotation: number) => void,
  onRotationComplete: () => void
) => {
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

    // Only update the rotation transform, not any other properties
    const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress;
    onRotationUpdate(currentRotation % 360);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      // Ensure we end exactly at the target rotation to prevent floating point errors
      onRotationUpdate(targetRotation % 360);
      // Use setTimeout to ensure any state updates have completed
      setTimeout(onRotationComplete, 0);
    }
  };

  requestAnimationFrame(animate);
}; 