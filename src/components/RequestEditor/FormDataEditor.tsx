import { Button, Input, Select, Table } from '../ui';
import type { FormDataField } from '../../types';
import { open } from '@tauri-apps/plugin-dialog';

interface FormDataEditorProps {
  items: FormDataField[];
  onChange: (items: FormDataField[]) => void;
}

export const FormDataEditor = ({ items, onChange }: FormDataEditorProps) => {
  const add = () => onChange([...items, { key: '', value: '', type: 'text', enabled: true }]);

  const update = (index: number, field: keyof FormDataField, value: string | boolean) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const toggle = (index: number) => {
    const next = [...items];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    onChange(next);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const selectFile = async (index: number) => {
    try {
      const selected = await open({ multiple: false, title: '选择文件' });
      if (selected) update(index, 'value', selected as string);
    } catch (error) {
      console.error('选择文件失败:', error);
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'enabled',
      width: 40,
      render: (_: unknown, __: FormDataField, index: number) => (
        <input type="checkbox" checked={items[index]?.enabled} onChange={() => toggle(index)} />
      ),
    },
    {
      title: 'Key',
      dataIndex: 'key',
      render: (_: unknown, __: FormDataField, index: number) => (
        <Input
          value={items[index]?.key}
          placeholder="Key"
          onChange={(e) => update(index, 'key', e.target.value)}
        />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 90,
      render: (_: unknown, __: FormDataField, index: number) => (
        <Select
          value={items[index]?.type}
          onChange={(value) => update(index, 'type', value)}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'file', label: 'File' },
          ]}
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (_: unknown, record: FormDataField, index: number) =>
        record.type === 'file' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              value={items[index]?.value}
              placeholder="选择文件..."
              onChange={(e) => update(index, 'value', e.target.value)}
              style={{ flex: 1 }}
            />
            <Button size="sm" icon="folder-open" onClick={() => selectFile(index)}>
              选择
            </Button>
          </div>
        ) : (
          <Input
            value={items[index]?.value}
            placeholder="Value"
            onChange={(e) => update(index, 'value', e.target.value)}
          />
        ),
    },
    {
      title: '',
      width: 50,
      render: (_: unknown, __: FormDataField, index: number) => (
        <Button size="sm" icon="trash-2" variant="danger" onClick={() => remove(index)} />
      ),
    },
  ];

  return (
    <div className="multipart-editor">
      <Table dataSource={items} columns={columns} rowKey={(_, index) => `form-${index}`} />
      <Button icon="plus" onClick={add} block>
        添加字段
      </Button>
    </div>
  );
};
