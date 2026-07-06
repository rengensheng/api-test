import { useState, useMemo } from 'react';
import { Button, Empty, Spin, Tabs, Tag, message } from '../ui';
import type { ResponseData } from '../../types';

import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface ResponseViewerProps {
  response: ResponseData | null;
  loading: boolean;
}

const getStatusColor = (status: number) => {
  if (status < 200) return 'default' as const;
  if (status < 300) return 'green' as const;
  if (status < 400) return 'orange' as const;
  return 'red' as const;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatTime = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`);

export const ResponseViewer = ({ response, loading }: ResponseViewerProps) => {
  const [activeTab, setActiveTab] = useState('body');
  const handleCopy = async () => {
    if (!response?.data) return;
    try {
      await navigator.clipboard.writeText(response.data);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };


  const { isJson, jsonData } = useMemo(() => {
    if (!response?.data) return { isJson: false, jsonData: null };
    try {
      return { isJson: true, jsonData: JSON.parse(response.data) };
    } catch {
      return { isJson: false, jsonData: null };
    }
  }, [response?.data]);

  if (loading) {
    return (
      <div className="response-viewer loading">
        <Spin tip="请求发送中..." />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-viewer empty">
        <Empty description="发送请求后查看响应" />
      </div>
    );
  }

  const tabs = [
    {
      key: 'body',
      label: 'Body',
      children: (
        <div className="response-body">
          <div className="response-body-actions">
            <Button icon="copy" onClick={handleCopy} size="sm">
              复制
            </Button>
          </div>
          <div className="response-content-wrapper">
            {isJson && jsonData ? (
              <JsonView data={jsonData} shouldExpandNode={() => true} />
            ) : (
              <pre className="response-content">{response.data}</pre>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'headers',
      label: 'Headers',
      children: (
        <div className="response-headers">
          <table className="headers-table">
            <tbody>
              {Object.entries(response.headers).map(([key, value]) => (
                <tr key={key}>
                  <td className="header-key">{key}</td>
                  <td className="header-value">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="response-viewer">
      <div className="response-status">
        <Tag color={getStatusColor(response.status)} className="status-tag">
          {response.status} {response.statusText}
        </Tag>
        <span className="response-meta">
          {formatTime(response.time)} · {formatSize(response.size)}
        </span>
      </div>
      <div className="container">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} className="response-tabs" />
      </div>
    </div>
  );
};