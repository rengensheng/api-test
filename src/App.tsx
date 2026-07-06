import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestEditor } from './components/RequestEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { CurlImport } from './components/CurlImport';
import { ToastProvider, message, Icon } from './components/ui';
import { useResizablePanels } from './hooks/useResizablePanels';
import { useRequestActions } from './hooks/useRequestActions';
import type { SidebarTab } from './types';
import { initDatabase } from './services/database';

const STORAGE_THEME_KEY = 'flaw-theme';

const initTheme = () => {
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
};

function AppContent() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('collections');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(initTheme);
  const { sidebarWidth, editorWidth, startResizeSidebar, startResizeEditor } = useResizablePanels();
  const {
    currentRequest,
    response,
    loading,
    isNewRequest,
    selectedCollectionId,
    setCurrentRequest,
    onSend,
    onSave,
    onArchive,
    onSelectRequest,
    onNewRequest,
    onImportCurl,
    refreshTrigger,
  } = useRequestActions();


  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    initDatabase()
      .then(() => setDbInitialized(true))
      .catch((err) => {
        console.error('Database init error:', err);
        const isTauriMissing =
          err instanceof TypeError &&
          (err.message.includes('__TAURI_INTERNALS__') || err.message.includes('invoke'));
        if (isTauriMissing) {
          message.error('请在 Tauri 环境中运行：pnpm tauri dev');
        } else {
          message.error('数据库初始化失败');
        }
      });
  }, []);


  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  if (!dbInitialized) {
    return (
      <div className="flaw-spin flaw-spin-md" style={{ height: '100vh', justifyContent: 'center' }}>
        <span className="flaw-spinner" />
        <span className="flaw-spin-tip">正在初始化...</span>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSelectRequest={onSelectRequest}
        onNewRequest={onNewRequest}
        refreshTrigger={refreshTrigger}
        width={sidebarWidth}
      />
      <div className="resize-bar resize-bar-sidebar" onMouseDown={startResizeSidebar} />
      <div className="main-layout">
        <div className="main-content">
          <div className="toolbar">
            <CurlImport onImport={onImportCurl} />
            <div style={{ flex: 1 }} />
            <button className="theme-toggle" onClick={toggleTheme} title="切换主题">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          </div>
          <div className="editor-response-container">
            <div className="editor-panel" style={{ width: editorWidth }}>
              <RequestEditor
                request={currentRequest}
                onRequestChange={setCurrentRequest}
                onSend={onSend}
                onSave={onSave}
                onArchive={onArchive}
                loading={loading}
                isNew={isNewRequest}
                selectedCollectionId={selectedCollectionId}
              />
            </div>
            <div className="resize-bar resize-bar-editor" onMouseDown={startResizeEditor} />
            <div className="response-panel">
              <ResponseViewer response={response} loading={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;