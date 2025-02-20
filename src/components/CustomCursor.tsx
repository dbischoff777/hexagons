import React, { useState, useEffect } from 'react';
import './CustomCursor.css';

interface CustomCursorProps {
  color?: string;
  hide?: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ color = '#00FF9F', hide = false }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window);

    const updatePosition = (e: MouseEvent | Touch) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e);
      setIsTouching(false);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) {
        updatePosition(e.touches[0]);
        setIsTouching(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) {
        updatePosition(e.touches[0]);
        setIsTouching(true);
      }
    };

    const handleTouchEnd = () => {
      setIsTouching(false);
    };

    if (!isTouch) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (!isTouch) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouch]);

  const shouldHide = hide || (isTouch && !isTouching);

  return (
    <div 
      className={`custom-cursor ${shouldHide ? 'hidden' : ''} ${isTouching ? 'touching' : ''}`}
      style={{
        '--cursor-x': `${position.x}px`,
        '--cursor-y': `${position.y}px`,
        '--cursor-color': color,
      } as React.CSSProperties}
    />
  );
};

export default CustomCursor; 