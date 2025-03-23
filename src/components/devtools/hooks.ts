import { useState, useEffect } from 'react';

export const useWindowSize = (padding: { width: number; height: number }) => {
  const [windowSize, setWindowSize] = useState({ 
    width: window.innerWidth - padding.width, 
    height: window.innerHeight - padding.height 
  });
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth - padding.width,
        height: window.innerHeight - padding.height
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [padding.width, padding.height]);
  
  return windowSize;
}; 