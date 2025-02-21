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
  const [isOverSimilarColor, setIsOverSimilarColor] = useState(false);

  // Convert hex color to RGB for rgba usage
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 255, 159';
  };

  // Get inverted color
  const getInvertedColor = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#FF0060';
    
    const r = 255 - parseInt(result[1], 16);
    const g = 255 - parseInt(result[2], 16);
    const b = 255 - parseInt(result[3], 16);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

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

    const checkBackgroundColor = (e: MouseEvent) => {
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const elementColor = window.getComputedStyle(element).backgroundColor;
        const elementHex = rgbToHex(elementColor);
        const similarity = getColorSimilarity(color, elementHex);
        setIsOverSimilarColor(similarity > 0.8); // Threshold for similarity
      }
    };

    if (!isTouch) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousemove', checkBackgroundColor);
    }
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (!isTouch) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousemove', checkBackgroundColor);
      }
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouch, color]);

  const shouldHide = hide || (isTouch && !isTouching);

  // Helper function to convert RGB to HEX
  const rgbToHex = (rgb: string) => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#000000';
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Calculate color similarity (0-1)
  const getColorSimilarity = (color1: string, color2: string) => {
    const rgb1 = hexToRgb(color1).split(',').map(Number);
    const rgb2 = hexToRgb(color2).split(',').map(Number);
    
    const rmean = (rgb1[0] + rgb2[0]) / 2;
    const r = rgb1[0] - rgb2[0];
    const g = rgb1[1] - rgb2[1];
    const b = rgb1[2] - rgb2[2];
    
    return 1 - Math.sqrt((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8)) / 764.833;
  };

  const cursorColor = isOverSimilarColor ? getInvertedColor(color) : color;

  return (
    <div 
      className={`custom-cursor ${shouldHide ? 'hidden' : ''} ${isTouching ? 'touching' : ''} ${isOverSimilarColor ? 'inverted' : ''}`}
      style={{
        '--cursor-x': `${position.x}px`,
        '--cursor-y': `${position.y}px`,
        '--cursor-color': cursorColor,
        '--cursor-color-rgb': hexToRgb(cursorColor),
      } as React.CSSProperties}
    />
  );
};

export default CustomCursor; 