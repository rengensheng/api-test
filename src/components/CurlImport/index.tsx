import { useState } from 'react';
import { Alert, Button, Modal, TextArea, message } from '../ui';
import { parseCurl, createRequestFromCurl } from '../../services/curl';
import type { RequestConfig } from '../../types';

interface CurlImportProps {
  onImport: (request: RequestConfig) => void;
}

interface ParsedCurl {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  body?: string;
}

export const CurlImport = ({ onImport }: CurlImportProps) => {
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

  const close = () => {
    setVisible(false);
    setCurlCommand('');
    setError(null);
  };

  return (
    <>
      <Button icon="upload" onClick={() => setVisible(true)}>
        导入 Curl
      </Button>
      <Modal
        title="导入 Curl 命令"
        open={visible}
        onOk={handleImport}
        onCancel={close}
        okText="导入"
        cancelText="取消"
        width={700}
      >
        <div className="curl-import">
          <Alert
            message="粘贴 Curl 命令以创建新请求"
            description="支持从浏览器开发者工具复制的 Curl 命令"
            type="info"
            className="flaw-form-row"
          />
          <TextArea
            value={curlCommand}
            onChange={(e) => {
              setCurlCommand(e.target.value);
              setError(null);
            }}
            placeholder={`curl 'https://api.example.com/endpoint' -H 'Content-Type: application/json' -d '{"key": "value"}'`}
            rows={8}
            mono
            className="curl-textarea"
          />
          {error && <Alert message={error} type="error" className="flaw-form-row" />}
          {curlCommand && !error && (
            <div className="curl-preview flaw-form-row">
              <Preview curlCommand={curlCommand} />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

const Preview = ({ curlCommand }: { curlCommand: string }) => {
  const parsed = parseCurl(curlCommand) as ParsedCurl | null;
  if (!parsed) return null;

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
              <li key={i}>
                {h.key}: {h.value}
              </li>
            ))}
          </ul>
        </div>
      )}
      {parsed.body && (
        <div className="preview-item">
          <strong>Body:</strong>
          <pre>{parsed.body}</pre>
        </div>
      )}
    </div>
  );
};
