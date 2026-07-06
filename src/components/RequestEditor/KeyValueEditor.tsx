import { Button, Input, Table } from '../ui';
import type { KeyValue } from '../../types';

interface KeyValueEditorProps {
  items: KeyValue[];
  field: 'headers' | 'params';
  onChange: (items: KeyValue[]) => void;
}

export const KeyValueEditor = ({ items, field, onChange }: KeyValueEditorProps) => {
  const add = () => onChange([...items, { key: '', value: '', enabled: true }]);

  const update = (index: number, key: 'key' | 'value', value: string) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const toggle = (index: number) => {
    const next = [...items];
    next[index] = { ...next[index], enabled: !next[index].enabled };
    onChange(next);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));

  const columns = [
    {
      title: '',
      dataIndex: 'enabled',
      width: 40,
      render: (_: unknown, __: KeyValue, index: number) => (
        <input type="checkbox" checked={items[index]?.enabled} onChange={() => toggle(index)} />
      ),
    },
    {
      title: field === 'headers' ? 'Header Name' : 'Parameter',
      dataIndex: 'key',
      render: (_: unknown, __: KeyValue, index: number) => (
        <Input
          value={items[index]?.key}
          placeholder={field === 'headers' ? 'Header' : 'Parameter'}
          onChange={(e) => update(index, 'key', e.target.value)}
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (_: unknown, __: KeyValue, index: number) => (
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
      render: (_: unknown, __: KeyValue, index: number) => (
        <Button size="sm" icon="trash-2" variant="danger" onClick={() => remove(index)} />
      ),
    },
  ];

  return (
    <div className="key-value-table">
      <Table dataSource={items} columns={columns} rowKey={(_, index) => `${field}-${index}`} />
      <Button icon="plus" onClick={add} block>
        添加{field === 'headers' ? ' Header' : '参数'}
      </Button>
    </div>
  );
};
