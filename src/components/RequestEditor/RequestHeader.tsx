import { Button, Input, Select } from '../ui';
import type { RequestConfig, HttpMethod } from '../../types';

interface RequestHeaderProps {
  request: RequestConfig;
  loading: boolean;
  onChange: (updates: Partial<RequestConfig>) => void;
  onSend: () => void;
}

const methodOptions: { value: HttpMethod; label: string }[] = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
];

export const RequestHeader = ({ request, loading, onChange, onSend }: RequestHeaderProps) => (
  <>
    <div className="request-header">
      <Input
        value={request.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="请求名称"
      />
    </div>
    <div className="request-url-bar">
      <Select
        value={request.method}
        onChange={(value) => onChange({ method: value as HttpMethod })}
        options={methodOptions}
        className="method-select"
      />
      <Input
        className="url-input"
        value={request.url}
        onChange={(e) => onChange({ url: e.target.value })}
        placeholder="输入请求 URL"
        onPressEnter={onSend}
      />
      <Button variant="primary" icon="zap" onClick={onSend} loading={loading}>
        发送
      </Button>
    </div>
  </>
);
