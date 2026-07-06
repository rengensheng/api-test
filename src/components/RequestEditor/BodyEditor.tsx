import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { Button, Select, TextArea } from '../ui';
import { FormDataEditor } from './FormDataEditor';
import type { RequestConfig, BodyType } from '../../types';


interface BodyEditorProps {
  request: RequestConfig;
  onChange: (updates: Partial<RequestConfig>) => void;
  jsonError: string | null;
  onJsonError: (error: string | null) => void;
}

const bodyTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form Data' },
  { value: 'multipart', label: 'Multipart' },
  { value: 'raw', label: 'Raw' },
];

export const BodyEditor = ({ request, onChange, jsonError, onJsonError }: BodyEditorProps) => {
  const validateJson = (value: string) => {
    if (!value.trim()) {
      onJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      onJsonError(null);
    } catch (e) {
      onJsonError(e instanceof Error ? e.message : 'JSON 错误');
    }
  };

  const handleJsonChange = (value: string) => {
    onChange({ body: value });
    validateJson(value);
  };

  const formatJson = () => {
    if (!request.body) return;
    try {
      const parsed = JSON.parse(request.body);
      onChange({ body: JSON.stringify(parsed, null, 2) });
      onJsonError(null);
    } catch {
      onJsonError('JSON 格式错误，无法格式化');
    }
  };

  return (
    <div className="body-editor">
      <div className="body-type-selector">
        <span>类型:</span>
        <Select
          value={request.bodyType}
          onChange={(value) => onChange({ bodyType: value as BodyType })}
          options={bodyTypeOptions}
          style={{ width: 120 }}
        />

        {request.bodyType === 'json' && (
          <Button size="sm" icon="align-left" onClick={formatJson}>
            格式化
          </Button>
        )}
      </div>

      {request.bodyType === 'multipart' && (
        <FormDataEditor items={request.formData} onChange={(formData) => onChange({ formData })} />
      )}

      {request.bodyType === 'json' && (
        <div className="json-editor-container">
          <CodeMirror
            value={request.body}
            height="100%"
            extensions={[json(), linter(jsonParseLinter())]}
            onChange={handleJsonChange}
            theme="dark"
            placeholder='{"key": "value"}'
          />

          {jsonError && <div className="json-error">JSON 错误: {jsonError}</div>}
        </div>
      )}

      {request.bodyType !== 'none' && request.bodyType !== 'multipart' && request.bodyType !== 'json' && (
        <TextArea
          value={request.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Request body"
          className="body-textarea"
        />
      )}
    </div>
  );
};