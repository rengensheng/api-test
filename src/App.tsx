import { useState, useEffect, useCallback } from 'react';
import { Layout, message, ConfigProvider, theme } from 'antd';
import { Sidebar } from './components/Sidebar';
import { RequestEditor } from './components/RequestEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { CurlImport } from './components/CurlImport';
import type { RequestConfig, ResponseData, SidebarTab, SavedRequest, HistoryItem, ArchivedRequest } from './types';
import { initDatabase, createSavedRequest, updateSavedRequest, createHistoryItem, createArchivedRequest, deleteSavedRequest } from './services/database';
import { sendRequest } from './services/http';
import { v4 as uuidv4 } from 'uuid';

const { Content } = Layout;

const createEmptyRequest = (): RequestConfig => ({
  id: uuidv4(),
  name: '未命名请求',
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  body: '',
  bodyType: 'none',
  formData: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function App() {
  const [currentRequest, setCurrentRequest] = useState<RequestConfig | null>(null);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SidebarTab>('collections');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [isNewRequest, setIsNewRequest] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbInitialized(true);
        message.success('数据库初始化成功');
      })
      .catch((err) => {
        console.error('Database init error:', err);
        message.error('数据库初始化失败');
      });
  }, []);

  const handleSendRequest = useCallback(async () => {
    if (!currentRequest || !currentRequest.url) {
      message.warning('请输入请求 URL');
      return;
    }

    setLoading(true);
    try {
      const responseData = await sendRequest(currentRequest);
      setResponse(responseData);

      const historyItem: HistoryItem = {
        id: uuidv4(),
        requestId: null,
        name: currentRequest.name,
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        params: currentRequest.params,
        body: currentRequest.body,
        bodyType: currentRequest.bodyType,
        formData: currentRequest.formData || [],
        statusCode: responseData.status,
        responseTime: responseData.time,
        responseSize: responseData.size,
        createdAt: new Date().toISOString(),
      };
      await createHistoryItem(historyItem);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      message.error(`请求失败: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [currentRequest]);

  const handleSaveRequest = useCallback(async (collectionId: string | null, name: string) => {
    if (!currentRequest) return;

    try {
      if (isNewRequest) {
        await createSavedRequest({
          ...currentRequest,
          id: uuidv4(),
          name: name,
          collectionId: collectionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        message.success('请求已保存');
      } else {
        await updateSavedRequest({
          ...currentRequest,
          name: name,
          collectionId: collectionId,
          updatedAt: new Date().toISOString(),
        });
        message.success('请求已更新');
      }
      setRefreshTrigger((prev) => prev + 1);
      setIsNewRequest(false);
    } catch (err) {
      message.error(`保存失败: ${err}`);
    }
  }, [currentRequest, isNewRequest]);

  const handleArchiveRequest = useCallback(async () => {
    if (!currentRequest || isNewRequest) return;

    try {
      await createArchivedRequest({
        id: uuidv4(),
        name: currentRequest.name,
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        params: currentRequest.params,
        body: currentRequest.body,
        bodyType: currentRequest.bodyType,
        formData: currentRequest.formData || [],
        archivedAt: new Date().toISOString(),
        createdAt: currentRequest.createdAt,
      });
      await deleteSavedRequest(currentRequest.id);
      message.success('请求已归档');
      setCurrentRequest(null);
      setResponse(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      message.error(`归档失败: ${err}`);
    }
  }, [currentRequest, isNewRequest]);

  const handleSelectRequest = useCallback((request: SavedRequest | HistoryItem | ArchivedRequest) => {
    const config: RequestConfig = {
      id: request.id,
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      params: request.params,
      body: request.body,
      bodyType: request.bodyType,
      formData: request.formData || [],
      createdAt: 'createdAt' in request ? request.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentRequest(config);
    setResponse(null);
    setIsNewRequest(false);
    if ('collectionId' in request) {
      setSelectedCollectionId(request.collectionId);
    }
  }, []);

  const handleNewRequest = useCallback(() => {
    setCurrentRequest(createEmptyRequest());
    setResponse(null);
    setIsNewRequest(true);
    setSelectedCollectionId(null);
  }, []);

  const handleImportCurl = useCallback((request: RequestConfig) => {
    setCurrentRequest(request);
    setResponse(null);
    setIsNewRequest(true);
    setSelectedCollectionId(null);
  }, []);

  if (!dbInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>正在初始化...</p>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 6,
        },
      }}
    >
      <Layout className="app-layout">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectRequest={handleSelectRequest}
          onNewRequest={handleNewRequest}
          refreshTrigger={refreshTrigger}
        />
        <Layout className="main-layout">
          <Content className="main-content">
            <div className="toolbar">
              <CurlImport onImport={handleImportCurl} />
            </div>
            <div className="editor-response-container">
              <div className="editor-panel">
                <RequestEditor
                  request={currentRequest}
                  onRequestChange={setCurrentRequest}
                  onSend={handleSendRequest}
                  onSave={handleSaveRequest}
                  onArchive={handleArchiveRequest}
                  loading={loading}
                  isNew={isNewRequest}
                  selectedCollectionId={selectedCollectionId}
                />
              </div>
              <div className="response-panel">
                <ResponseViewer response={response} loading={loading} />
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;