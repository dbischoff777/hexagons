import React, { useState, useEffect } from 'react';
import './CustomCursor.css';

interface CustomCursorProps {
  color?: string;
  hide?: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ color = '#00FF9F', hide = false }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent | Touch) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e);
      setIsTouching(false);
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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div 
      className={`custom-cursor ${hide ? 'hidden' : ''} ${isTouching ? 'touching' : ''}`}
      style={{
        '--cursor-x': `${position.x}px`,
        '--cursor-y': `${position.y}px`,
        '--cursor-color': color,
      } as React.CSSProperties}
    />
  );
};

export default CustomCursor; 