import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Button,
  Input,
  Modal,
  Dropdown,
  message,
  Empty,
  Tag,
  Popconfirm,
} from 'antd';
import {
  FolderOutlined,
  HistoryOutlined,
  InboxOutlined,
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  ImportOutlined,
  ExportOutlined,
  ReloadOutlined,
  FolderAddOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { SavedRequest, HistoryItem, ArchivedRequest, Collection, SidebarTab, HttpMethod } from '../../types';
import * as db from '../../services/database';
import { exportData, importData } from '../../services/export';

const { Sider } = Layout;

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSelectRequest: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  onNewRequest: () => void;
  refreshTrigger: number;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'cyan',
  HEAD: 'purple',
  OPTIONS: 'geekblue',
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onSelectRequest,
  onNewRequest,
  refreshTrigger,
}) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [archives, setArchives] = useState<ArchivedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [collectionsData, requestsData, historyData, archivesData] = await Promise.all([
        db.getCollections(),
        db.getSavedRequests(),
        db.getHistory(),
        db.getArchivedRequests(),
      ]);
      setCollections(collectionsData);
      setSavedRequests(requestsData);
      setHistory(historyData);
      setArchives(archivesData);
    } catch {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      message.warning('请输入集合名称');
      return;
    }
    const now = new Date().toISOString();
    await db.createCollection({
      id: crypto.randomUUID(),
      name: newCollectionName.trim(),
      parentId: null,
      createdAt: now,
      updatedAt: now,
    });
    setNewCollectionName('');
    setNewCollectionModal(false);
    loadData();
    message.success('集合创建成功');
  };

  const handleDeleteCollection = async (id: string) => {
    await db.deleteCollection(id);
    loadData();
    message.success('集合已删除');
  };

  const handleDeleteRequest = async (id: string) => {
    await db.deleteSavedRequest(id);
    loadData();
    message.success('请求已删除');
  };

  const handleMoveRequest = async (request: SavedRequest, collectionId: string | null) => {
    await db.updateSavedRequest({
      ...request,
      collectionId,
      updatedAt: new Date().toISOString(),
    });
    loadData();
    message.success('请求已移动');
  };

  const handleDeleteHistory = async (id: string) => {
    await db.deleteHistoryItem(id);
    loadData();
  };

  const handleClearHistory = async () => {
    await db.clearHistory();
    loadData();
    message.success('历史记录已清空');
  };

  const handleDeleteArchive = async (id: string) => {
    await db.deleteArchivedRequest(id);
    loadData();
    message.success('归档已删除');
  };

  const handleRestoreArchive = async (id: string) => {
    const request = await db.restoreArchivedRequest(id);
    if (request) {
      const now = new Date().toISOString();
      await db.createSavedRequest({
        id: crypto.randomUUID(),
        collectionId: null,
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        body: request.body,
        bodyType: request.bodyType,
        formData: request.formData || [],
        createdAt: now,
        updatedAt: now,
      });
      loadData();
      message.success('请求已恢复');
    }
  };

  const handleImport = async () => {
    const result = await importData();
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleExport = async () => {
    await exportData();
    message.success('导出成功');
  };

  const toggleCollection = (id: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCollections(newExpanded);
  };

  const getCollectionMenu = (collection: Collection) => ({
    items: [
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除集合',
        danger: true,
        onClick: () => handleDeleteCollection(collection.id),
      },
    ],
  });

  const getRequestMenu = (request: SavedRequest) => ({
    items: [
      {
        key: 'move',
        label: '移动到...',
        children: [
          {
            key: 'none',
            label: '未分类',
            onClick: () => handleMoveRequest(request, null),
          },
          ...collections.map(c => ({
            key: c.id,
            label: c.name,
            onClick: () => handleMoveRequest(request, c.id),
          })),
        ],
      },
      { type: 'divider' as const },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDeleteRequest(request.id),
      },
    ],
  });

  const getHistoryMenu = (item: HistoryItem) => ({
    items: [
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => handleDeleteHistory(item.id),
      },
    ],
  });

  const getArchiveMenu = (item: ArchivedRequest) => ({
    items: [
      {
        key: 'restore',
        icon: <ReloadOutlined />,
        label: '恢复到收藏',
        onClick: () => handleRestoreArchive(item.id),
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '永久删除',
        danger: true,
        onClick: () => handleDeleteArchive(item.id),
      },
    ],
  });

  const getRequestsByCollection = (collectionId: string | null) => {
    return savedRequests.filter(r => r.collectionId === collectionId);
  };

  const renderCollections = () => {
    const uncategorizedRequests = getRequestsByCollection(null);

    return (
      <div className="sidebar-content">
        <div className="sidebar-header">
          <Button type="primary" icon={<PlusOutlined />} onClick={onNewRequest} block>
            新建请求
          </Button>
        </div>
        <div className="sidebar-actions">
          <Button icon={<FolderAddOutlined />} onClick={() => setNewCollectionModal(true)}>
            新建集合
          </Button>
          <Button icon={<ImportOutlined />} onClick={handleImport}>
            导入
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        </div>
        <div className="sidebar-list">
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center' }}>加载中...</div>
          ) : (
            <>
              {/* 显示集合 */}
              {collections.map((collection) => {
                const collectionRequests = getRequestsByCollection(collection.id);
                const isExpanded = expandedCollections.has(collection.id);

                return (
                  <div key={collection.id} className="collection-group">
                    <div
                      className="collection-header"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {isExpanded ? <DownOutlined /> : <RightOutlined />}
                      <FolderOutlined style={{ marginLeft: 8, marginRight: 8 }} />
                      <span className="collection-name">{collection.name}</span>
                      <span className="collection-count">({collectionRequests.length})</span>
                      <Dropdown menu={getCollectionMenu(collection)} trigger={['click']}>
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                    {isExpanded && (
                      <div className="collection-items">
                        {collectionRequests.map((request) => (
                          <div
                            key={request.id}
                            className="sidebar-item indent"
                            onClick={() => onSelectRequest(request)}
                          >
                            <Tag color={methodColors[request.method]}>{request.method}</Tag>
                            <span className="item-name">{request.name}</span>
                            <Dropdown menu={getRequestMenu(request)} trigger={['click']}>
                              <Button
                                type="text"
                                size="small"
                                icon={<MoreOutlined />}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Dropdown>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 未分类请求 */}
              {uncategorizedRequests.length > 0 && (
                <div className="collection-group">
                  <div
                    className="collection-header"
                    onClick={() => toggleCollection('__uncategorized__')}
                  >
                    {expandedCollections.has('__uncategorized__') ? <DownOutlined /> : <RightOutlined />}
                    <FolderOutlined style={{ marginLeft: 8, marginRight: 8 }} />
                    <span className="collection-name">未分类</span>
                    <span className="collection-count">({uncategorizedRequests.length})</span>
                  </div>
                  {expandedCollections.has('__uncategorized__') && (
                    <div className="collection-items">
                      {uncategorizedRequests.map((request) => (
                        <div
                          key={request.id}
                          className="sidebar-item indent"
                          onClick={() => onSelectRequest(request)}
                        >
                          <Tag color={methodColors[request.method]}>{request.method}</Tag>
                          <span className="item-name">{request.name}</span>
                          <Dropdown menu={getRequestMenu(request)} trigger={['click']}>
                            <Button
                              type="text"
                              size="small"
                              icon={<MoreOutlined />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Dropdown>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {collections.length === 0 && uncategorizedRequests.length === 0 && (
                <Empty description="暂无保存的请求" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="sidebar-content">
      <div className="sidebar-header">
        <Popconfirm
          title="确定清空所有历史记录？"
          onConfirm={handleClearHistory}
          okText="确定"
          cancelText="取消"
        >
          <Button danger icon={<DeleteOutlined />}>清空历史</Button>
        </Popconfirm>
      </div>
      <div className="sidebar-list">
        {history.length === 0 ? (
          <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="sidebar-item"
              onClick={() => onSelectRequest(item)}
            >
              <Tag color={methodColors[item.method]}>{item.method}</Tag>
              <span className="item-name">{item.name}</span>
              {item.statusCode && (
                <Tag color={item.statusCode < 300 ? 'success' : item.statusCode < 400 ? 'warning' : 'error'}>
                  {item.statusCode}
                </Tag>
              )}
              <Dropdown menu={getHistoryMenu(item)} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
              </Dropdown>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderArchives = () => (
    <div className="sidebar-content">
      <div className="sidebar-list">
        {archives.length === 0 ? (
          <Empty description="暂无归档请求" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          archives.map((item) => (
            <div
              key={item.id}
              className="sidebar-item"
              onClick={() => onSelectRequest(item)}
            >
              <Tag color={methodColors[item.method]}>{item.method}</Tag>
              <span className="item-name">{item.name}</span>
              <Dropdown menu={getArchiveMenu(item)} trigger={['click']}>
                <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
              </Dropdown>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const menuItems: MenuProps['items'] = [
    {
      key: 'collections',
      icon: <FolderOutlined />,
      label: '收藏',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史',
    },
    {
      key: 'archives',
      icon: <InboxOutlined />,
      label: '归档',
    },
  ];

  return (
    <Sider width={300} className="sidebar">
      <Menu
        mode="horizontal"
        selectedKeys={[activeTab]}
        onClick={(e) => onTabChange(e.key as SidebarTab)}
        items={menuItems}
        className="sidebar-menu"
      />
      {activeTab === 'collections' && renderCollections()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'archives' && renderArchives()}

      <Modal
        title="新建集合"
        open={newCollectionModal}
        onOk={handleCreateCollection}
        onCancel={() => setNewCollectionModal(false)}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="输入集合名称"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onPressEnter={handleCreateCollection}
        />
      </Modal>
    </Sider>
  );
};