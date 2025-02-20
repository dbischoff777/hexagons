import React, { useState, useEffect } from 'react';
import './CustomCursor.css';

interface CustomCursorProps {
  color?: string;
  hide?: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ color = '#00FF9F', hide = false }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updatePosition);
    return () => window.removeEventListener('mousemove', updatePosition);
  }, []);

  return (
    <div 
      className={`custom-cursor ${hide ? 'hidden' : ''}`}
      style={{
        '--cursor-x': `${position.x}px`,
        '--cursor-y': `${position.y}px`,
        '--cursor-color': color,
      } as React.CSSProperties}
    />
  );
};

export default CustomCursor; 