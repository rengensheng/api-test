import React, { useState, useEffect } from 'react';
import {
  Input,
  Select,
  Button,
  Tabs,
  Table,
  Space,
  Dropdown,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import {
  SendOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  CopyOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import type { RequestConfig, KeyValue, HttpMethod, FormDataField, Collection } from '../../types';
import { exportToCurl } from '../../services/curl';
import { open } from '@tauri-apps/plugin-dialog';
import * as db from '../../services/database';

const { TextArea } = Input;

interface RequestEditorProps {
  request: RequestConfig | null;
  onRequestChange: (request: RequestConfig) => void;
  onSend: () => void;
  onSave: (collectionId: string | null) => void;
  onArchive: () => void;
  loading: boolean;
  isNew: boolean;
  selectedCollectionId?: string | null;
}

const methodOptions: { value: HttpMethod; label: string; color?: string }[] = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
];

const methodColors: Record<HttpMethod, string> = {
  GET: '#52c41a',
  POST: '#1890ff',
  PUT: '#fa8c16',
  DELETE: '#f5222d',
  PATCH: '#13c2c2',
  HEAD: '#722ed1',
  OPTIONS: '#2f54eb',
};

export const RequestEditor: React.FC<RequestEditorProps> = ({
  request,
  onRequestChange,
  onSend,
  onSave,
  onArchive,
  loading,
  isNew,
  selectedCollectionId: initialCollectionId,
}) => {
  const [activeTab, setActiveTab] = useState('params');
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [curlModalVisible, setCurlModalVisible] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');

  useEffect(() => {
    if (request) {
      setRequestName(request.name);
    }
  }, [request]);

  useEffect(() => {
    setSelectedCollectionId(initialCollectionId ?? null);
  }, [initialCollectionId]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const data = await db.getCollections();
    setCollections(data);
  };

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
    onRequestChange({
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddKeyValue = (field: 'headers' | 'params') => {
    const newItems: KeyValue[] = [
      ...request[field],
      { key: '', value: '', enabled: true },
    ];
    updateRequest({ [field]: newItems });
  };

  const handleUpdateKeyValue = (
    field: 'headers' | 'params',
    index: number,
    key: string,
    value: string
  ) => {
    const newItems = [...request[field]];
    if (key === 'key') {
      newItems[index] = { ...newItems[index], key: value };
    } else {
      newItems[index] = { ...newItems[index], value };
    }
    updateRequest({ [field]: newItems });
  };

  const handleToggleKeyValue = (field: 'headers' | 'params', index: number) => {
    const newItems = [...request[field]];
    newItems[index] = { ...newItems[index], enabled: !newItems[index].enabled };
    updateRequest({ [field]: newItems });
  };

  const handleDeleteKeyValue = (field: 'headers' | 'params', index: number) => {
    const newItems = request[field].filter((_, i) => i !== index);
    updateRequest({ [field]: newItems });
  };

  const handleAddFormField = () => {
    const newItems: FormDataField[] = [
      ...request.formData,
      { key: '', value: '', type: 'text', enabled: true },
    ];
    updateRequest({ formData: newItems });
  };

  const handleUpdateFormField = (
    index: number,
    field: keyof FormDataField,
    value: string | boolean
  ) => {
    const newItems = [...request.formData];
    newItems[index] = { ...newItems[index], [field]: value };
    updateRequest({ formData: newItems });
  };

  const handleToggleFormField = (index: number) => {
    const newItems = [...request.formData];
    newItems[index] = { ...newItems[index], enabled: !newItems[index].enabled };
    updateRequest({ formData: newItems });
  };

  const handleDeleteFormField = (index: number) => {
    const newItems = request.formData.filter((_, i) => i !== index);
    updateRequest({ formData: newItems });
  };

  const handleSelectFile = async (index: number) => {
    try {
      const selected = await open({
        multiple: false,
        title: '选择文件',
      });
      if (selected) {
        handleUpdateFormField(index, 'value', selected as string);
      }
    } catch (error) {
      console.error('选择文件失败:', error);
    }
  };

  const handleSaveWithName = () => {
    if (!requestName.trim()) {
      message.warning('请输入请求名称');
      return;
    }
    updateRequest({ name: requestName.trim() });
    setNameModalVisible(false);
    onSave(selectedCollectionId);
  };

  const handleExportCurl = () => {
    const curl = exportToCurl(request);
    setCurlCommand(curl);
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

  const keyValueColumns = (field: 'headers' | 'params') => [
    {
      title: '',
      dataIndex: 'enabled',
      width: 40,
      render: (_: unknown, __: KeyValue, index: number) => (
        <input
          type="checkbox"
          checked={request[field][index]?.enabled}
          onChange={() => handleToggleKeyValue(field, index)}
        />
      ),
    },
    {
      title: field === 'headers' ? 'Header Name' : 'Parameter',
      dataIndex: 'key',
      render: (text: string, _: KeyValue, index: number) => (
        <Input
          value={text}
          placeholder={field === 'headers' ? 'Header' : 'Parameter'}
          onChange={(e) => handleUpdateKeyValue(field, index, 'key', e.target.value)}
          bordered={false}
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (text: string, _: KeyValue, index: number) => (
        <Input
          value={text}
          placeholder="Value"
          onChange={(e) => handleUpdateKeyValue(field, index, 'value', e.target.value)}
          bordered={false}
        />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_: unknown, __: KeyValue, index: number) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteKeyValue(field, index)}
        />
      ),
    },
  ];

  const formDataColumns = [
    {
      title: '',
      dataIndex: 'enabled',
      width: 40,
      render: (_: unknown, __: FormDataField, index: number) => (
        <input
          type="checkbox"
          checked={request.formData[index]?.enabled}
          onChange={() => handleToggleFormField(index)}
        />
      ),
    },
    {
      title: 'Key',
      dataIndex: 'key',
      render: (text: string, _: FormDataField, index: number) => (
        <Input
          value={text}
          placeholder="Key"
          onChange={(e) => handleUpdateFormField(index, 'key', e.target.value)}
          bordered={false}
        />
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: 100,
      render: (text: string, _: FormDataField, index: number) => (
        <Select
          value={text}
          onChange={(value) => handleUpdateFormField(index, 'type', value)}
          options={[
            { value: 'text', label: 'Text' },
            { value: 'file', label: 'File' },
          ]}
          bordered={false}
          size="small"
        />
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (text: string, record: FormDataField, index: number) => (
        record.type === 'file' ? (
          <Space>
            <Input
              value={text}
              placeholder="选择文件..."
              onChange={(e) => handleUpdateFormField(index, 'value', e.target.value)}
              bordered={false}
              style={{ flex: 1 }}
            />
            <Button
              size="small"
              icon={<FileAddOutlined />}
              onClick={() => handleSelectFile(index)}
            >
              选择
            </Button>
          </Space>
        ) : (
          <Input
            value={text}
            placeholder="Value"
            onChange={(e) => handleUpdateFormField(index, 'value', e.target.value)}
            bordered={false}
          />
        )
      ),
    },
    {
      title: '',
      width: 50,
      render: (_: unknown, __: FormDataField, index: number) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteFormField(index)}
        />
      ),
    },
  ];

  const tabs: TabsProps['items'] = [
    {
      key: 'params',
      label: 'Params',
      children: (
        <div className="key-value-table">
          <Table
            dataSource={request.params}
            columns={keyValueColumns('params')}
            pagination={false}
            size="small"
            rowKey={(_, index) => `param-${index}`}
          />
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleAddKeyValue('params')} block>
            添加参数
          </Button>
        </div>
      ),
    },
    {
      key: 'headers',
      label: 'Headers',
      children: (
        <div className="key-value-table">
          <Table
            dataSource={request.headers}
            columns={keyValueColumns('headers')}
            pagination={false}
            size="small"
            rowKey={(_, index) => `header-${index}`}
          />
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleAddKeyValue('headers')} block>
            添加 Header
          </Button>
        </div>
      ),
    },
    {
      key: 'body',
      label: 'Body',
      children: (
        <div className="body-editor">
          <Space className="body-type-selector">
            <span>类型:</span>
            <Select
              value={request.bodyType}
              onChange={(value) => updateRequest({ bodyType: value })}
              options={[
                { value: 'none', label: 'None' },
                { value: 'json', label: 'JSON' },
                { value: 'form', label: 'Form Data' },
                { value: 'multipart', label: 'Multipart' },
                { value: 'raw', label: 'Raw' },
              ]}
              style={{ width: 120 }}
            />
          </Space>
          {request.bodyType === 'multipart' && (
            <div className="multipart-editor">
              <Table
                dataSource={request.formData}
                columns={formDataColumns}
                pagination={false}
                size="small"
                rowKey={(_, index) => `form-${index}`}
              />
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddFormField} block>
                添加字段
              </Button>
            </div>
          )}
          {request.bodyType !== 'none' && request.bodyType !== 'multipart' && (
            <TextArea
              value={request.body}
              onChange={(e) => updateRequest({ body: e.target.value })}
              placeholder={request.bodyType === 'json' ? '{"key": "value"}' : 'Request body'}
              className="body-textarea"
              autoSize={{ minRows: 10, maxRows: 20 }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="request-editor">
      <div className="request-header">
        <Input
          className="request-name"
          value={request.name}
          onChange={(e) => updateRequest({ name: e.target.value })}
          placeholder="请求名称"
          bordered={false}
        />
      </div>
      <div className="request-url-bar">
        <Select
          value={request.method}
          onChange={(value) => updateRequest({ method: value })}
          options={methodOptions}
          style={{ width: 100 }}
          className={`method-select method-${request.method.toLowerCase()}`}
        />
        <Input
          className="url-input"
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
          placeholder="输入请求 URL"
          onPressEnter={onSend}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onSend}
          loading={loading}
          style={{ backgroundColor: methodColors[request.method], borderColor: methodColors[request.method] }}
        >
          发送
        </Button>
      </div>
      <div className="request-actions">
        <Button icon={<SaveOutlined />} onClick={() => setNameModalVisible(true)}>
          保存
        </Button>
        {!isNew && (
          <Popconfirm
            title="确定归档此请求？"
            onConfirm={onArchive}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<InboxOutlined />}>归档</Button>
          </Popconfirm>
        )}
        <Dropdown
          menu={{
            items: [
              { key: 'curl', label: '导出为 Curl', icon: <CopyOutlined />, onClick: handleExportCurl },
            ],
          }}
        >
          <Button>更多</Button>
        </Dropdown>
      </div>
      <div className='container'>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          className="request-tabs"
        />
      </div>
      <Modal
        title="保存请求"
        open={nameModalVisible}
        onOk={handleSaveWithName}
        onCancel={() => setNameModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>请求名称</label>
          <Input
            placeholder="请求名称"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            onPressEnter={handleSaveWithName}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8 }}>保存到集合</label>
          <Select
            style={{ width: '100%' }}
            value={selectedCollectionId}
            onChange={setSelectedCollectionId}
            placeholder="选择集合（可选）"
            allowClear
            options={[
              { value: null, label: '未分类' },
              ...collections.map(c => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </Modal>

      <Modal
        title="Curl 命令"
        open={curlModalVisible}
        onCancel={() => setCurlModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyCurl}>
            复制
          </Button>,
          <Button key="close" onClick={() => setCurlModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        <TextArea
          value={curlCommand}
          rows={10}
          readOnly
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  );
};