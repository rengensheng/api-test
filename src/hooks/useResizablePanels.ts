import { useState, useEffect, useRef } from 'react';

interface ResizablePanelsConfig {
  minSidebar?: number;
  maxSidebar?: number;
  minEditor?: number;
  maxEditor?: number;
  defaultSidebar?: number;
  defaultEditor?: number;
}

interface ResizablePanels {
  sidebarWidth: number;
  editorWidth: number;
  startResizeSidebar: () => void;
  startResizeEditor: () => void;
}

export const useResizablePanels = (config: ResizablePanelsConfig = {}): ResizablePanels => {
  const {
    minSidebar = 200,
    maxSidebar = 420,
    minEditor = 320,
    defaultSidebar = 260,
    defaultEditor = 520,
  } = config;

  const [sidebarWidth, setSidebarWidth] = useState(defaultSidebar);
  const [editorWidth, setEditorWidth] = useState(defaultEditor);
  const isResizingSidebar = useRef(false);
  const isResizingEditor = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar.current) {
        setSidebarWidth(Math.max(minSidebar, Math.min(maxSidebar, e.clientX)));
      }
      if (isResizingEditor.current) {
        const maxEditor = window.innerWidth - sidebarWidth - minEditor;
        setEditorWidth(Math.max(minEditor, Math.min(e.clientX - sidebarWidth, maxEditor)));
      }
    };
    const handleMouseUp = () => {
      isResizingSidebar.current = false;
      isResizingEditor.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [sidebarWidth, minSidebar, maxSidebar, minEditor]);

  const startResizeSidebar = () => {
    isResizingSidebar.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startResizeEditor = () => {
    isResizingEditor.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return { sidebarWidth, editorWidth, startResizeSidebar, startResizeEditor };
};
