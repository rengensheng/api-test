import { useState, useEffect } from 'react';
import { Button, Dropdown, Tabs, message } from '../ui';
import { RequestHeader } from './RequestHeader';
import { KeyValueEditor } from './KeyValueEditor';
import { BodyEditor } from './BodyEditor';
import { SaveModal } from './SaveModal';
import { CurlModal } from './CurlModal';
import type { RequestConfig, Collection } from '../../types';
import { exportToCurl } from '../../services/curl';
import * as db from '../../services/database';

interface RequestEditorProps {
  request: RequestConfig | null;
  onRequestChange: (request: RequestConfig) => void;
  onSend: () => void;
  onSave: (collectionId: string | null, name: string) => void;
  onArchive: () => void;
  loading: boolean;
  isNew: boolean;
  selectedCollectionId?: string | null;
}


export const RequestEditor = ({
  request,
  onRequestChange,
  onSend,
  onSave,
  onArchive,
  loading,
  isNew,
  selectedCollectionId: initialCollectionId,
}: RequestEditorProps) => {
  const [activeTab, setActiveTab] = useState('params');
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [curlModalVisible, setCurlModalVisible] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (request) setRequestName(request.name);
  }, [request]);

  useEffect(() => {
    setSelectedCollectionId(initialCollectionId ?? null);
  }, [initialCollectionId]);

  useEffect(() => {
    db.getCollections().then(setCollections);
  }, []);

  if (!request) {
    return (
      <div className="request-editor empty">
        <div className="empty-state">
          <p>选择一个请求或创建新请求开始</p>
        </div>
      </div>
    );
  }

  const updateRequest = (updates: Partial<RequestConfig>) => {
    onRequestChange({ ...request, ...updates, updatedAt: new Date().toISOString() });
  };
  const handleSave = (name: string) => {
    if (!name) {
      message.warning('请输入请求名称');
      return;
    }
    updateRequest({ name });
    setNameModalVisible(false);
    onSave(selectedCollectionId, name);
  };


  const handleExportCurl = () => {
    setCurlCommand(exportToCurl(request));
    setCurlModalVisible(true);
  };

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const tabs = [
    {
      key: 'params',
      label: 'Params',
      children: (
        <KeyValueEditor
          items={request.params}
          field="params"
          onChange={(params) => updateRequest({ params })}
        />
      ),
    },
    {
      key: 'headers',
      label: 'Headers',
      children: (
        <KeyValueEditor
          items={request.headers}
          field="headers"
          onChange={(headers) => updateRequest({ headers })}
        />
      ),
    },
    {
      key: 'body',
      label: 'Body',
      children: (
        <BodyEditor
          request={request}
          onChange={updateRequest}
          jsonError={jsonError}
          onJsonError={setJsonError}
        />
      ),
    },
  ];
  return (
    <div className="request-editor">
      <RequestHeader request={request} loading={loading} onChange={updateRequest} onSend={onSend} />
      <div className="request-actions">
        <Button icon="save" onClick={() => setNameModalVisible(true)}>
          {isNew ? '保存' : '更新'}
        </Button>
        {!isNew && (
          <Button icon="archive" onClick={onArchive}>
            归档
          </Button>
        )}
        <Dropdown
          items={[{ key: 'curl', label: '导出为 Curl', icon: 'copy', onClick: handleExportCurl }]}
        >
          <Button icon="more-horizontal">更多</Button>
        </Dropdown>
      </div>
      <div className="container">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} className="request-tabs" />
      </div>
      <SaveModal
        open={nameModalVisible}
        name={requestName}
        collectionId={selectedCollectionId}
        collections={collections}
        onOk={handleSave}
        onCancel={() => setNameModalVisible(false)}
        onCollectionChange={setSelectedCollectionId}
      />


      <CurlModal
        open={curlModalVisible}
        command={curlCommand}
        onClose={() => setCurlModalVisible(false)}
        onCopy={handleCopyCurl}
      />
    </div>
  );
};