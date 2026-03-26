import React, { useState } from 'react';
import { Modal, Input, Button, message, Alert } from 'antd';
import { ImportOutlined } from '@ant-design/icons';
import { parseCurl, createRequestFromCurl } from '../../services/curl';
import type { RequestConfig } from '../../types';

const { TextArea } = Input;

interface CurlImportProps {
  onImport: (request: RequestConfig) => void;
}

export const CurlImport: React.FC<CurlImportProps> = ({ onImport }) => {
  const [visible, setVisible] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    if (!curlCommand.trim()) {
      setError('请输入 Curl 命令');
      return;
    }

    const request = createRequestFromCurl(curlCommand);
    if (request) {
      onImport(request);
      message.success('Curl 命令导入成功');
      setVisible(false);
      setCurlCommand('');
      setError(null);
    } else {
      setError('无法解析 Curl 命令，请检查格式');
    }
  };

  return (
    <>
      <Button icon={<ImportOutlined />} onClick={() => setVisible(true)}>
        导入 Curl
      </Button>
      <Modal
        title="导入 Curl 命令"
        open={visible}
        onOk={handleImport}
        onCancel={() => {
          setVisible(false);
          setCurlCommand('');
          setError(null);
        }}
        okText="导入"
        cancelText="取消"
        width={700}
      >
        <div className="curl-import">
          <Alert
            message="粘贴 Curl 命令以创建新请求"
            description="支持从浏览器开发者工具复制的 Curl 命令"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <TextArea
            value={curlCommand}
            onChange={(e) => {
              setCurlCommand(e.target.value);
              setError(null);
            }}
            placeholder={`curl 'https://api.example.com/endpoint' -H 'Content-Type: application/json' -d '{"key": "value"}'`}
            autoSize={{ minRows: 6, maxRows: 15 }}
            className="curl-textarea"
          />
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
          {curlCommand && !error && (
            <div className="curl-preview" style={{ marginTop: 16 }}>
              <Preview curlCommand={curlCommand} />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

const Preview: React.FC<{ curlCommand: string }> = ({ curlCommand }) => {
  const parsed = parseCurl(curlCommand);
  
  if (!parsed) {
    return null;
  }

  return (
    <div className="curl-preview-content">
      <h4>预览</h4>
      <div className="preview-item">
        <strong>方法:</strong> {parsed.method}
      </div>
      <div className="preview-item">
        <strong>URL:</strong> {parsed.url}
      </div>
      {parsed.headers.length > 0 && (
        <div className="preview-item">
          <strong>Headers:</strong>
          <ul>
            {parsed.headers.map((h, i) => (
              <li key={i}>{h.key}: {h.value}</li>
            ))}
          </ul>
        </div>
      )}
      {parsed.body && (
        <div className="preview-item">
          <strong>Body:</strong>
          <pre style={{ margin: 0, maxHeight: 100, overflow: 'auto' }}>{parsed.body}</pre>
        </div>
      )}
    </div>
  );
};