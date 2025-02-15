import React, { useCallback } from 'react';

interface PreventContextMenuProps {
  children: React.ReactNode;
}

const PreventContextMenu: React.FC<PreventContextMenuProps> = ({ children }) => {
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div onContextMenu={handleContextMenu} style={{ height: '100%' }}>
      {children}
    </div>
  );
};

export default PreventContextMenu; 