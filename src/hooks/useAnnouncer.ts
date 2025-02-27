import { useCallback } from 'react';

/**
 * Hook for making screen reader announcements
 * @returns A function to make announcements
 */
export const useAnnouncer = () => {
  return useCallback((message: string) => {
    // Create or get the live region
    let liveRegion = document.getElementById('screen-reader-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'screen-reader-announcer';
      liveRegion.className = 'visually-hidden';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }

    // Update the message
    liveRegion.textContent = '';
    // Force a reflow
    void liveRegion.offsetWidth;
    liveRegion.textContent = message;
  }, []);
}; 