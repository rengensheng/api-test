import { useState } from 'react';
import { Input, Modal, message } from '../ui';
import { SidebarTabs } from './SidebarTabs';
import { CollectionsPanel } from './panels/CollectionsPanel';
import { HistoryPanel } from './panels/HistoryPanel';
import { ArchivesPanel } from './panels/ArchivesPanel';
import { useSidebarData } from './useSidebarData';
import type {
  SavedRequest,
  HistoryItem,
  ArchivedRequest,
  SidebarTab,
} from '../../types';
import * as db from '../../services/database';
import { exportData, importData } from '../../services/export';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSelectRequest: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  onNewRequest: () => void;
  refreshTrigger: number;
  width?: number;
}

export const Sidebar = ({
  activeTab,
  onTabChange,
  onSelectRequest,
  onNewRequest,
  refreshTrigger,
  width = 260,
}: SidebarProps) => {
  const { collections, savedRequests, history, archives, loading, reload } =
    useSidebarData(refreshTrigger);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  const createCollection = async () => {
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
    reload();
    message.success('集合创建成功');
  };

  const toggleCollection = (id: string) => {
    const next = new Set(expandedCollections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCollections(next);
  };

  const moveRequest = async (request: SavedRequest, collectionId: string | null) => {
    await db.updateSavedRequest({
      ...request,
      collectionId,
      updatedAt: new Date().toISOString(),
    });
    reload();
    message.success('请求已移动');
  };

  const deleteRequest = async (id: string) => {
    await db.deleteSavedRequest(id);
    reload();
    message.success('请求已删除');
  };

  const deleteCollection = async (id: string) => {
    await db.deleteCollection(id);
    reload();
    message.success('集合已删除');
  };
  const clearHistory = async () => {
    if (!window.confirm('确定清空所有历史记录？')) return;
    await db.clearHistory();
    reload();
    message.success('历史记录已清空');
  };


  const deleteHistoryItem = async (id: string) => {
    await db.deleteHistoryItem(id);
    reload();
  };

  const restoreArchive = async (item: ArchivedRequest) => {
    const request = await db.restoreArchivedRequest(item.id);
    if (!request) return;
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
    reload();
    message.success('请求已恢复');
  };

  const deleteArchive = async (id: string) => {
    await db.deleteArchivedRequest(id);
    reload();
    message.success('归档已删除');
  };

  const handleImport = async () => {
    const result = await importData();
    if (result.success) {
      message.success(result.message);
      reload();
    } else {
      message.error(result.message);
    }
  };

  const handleExport = async () => {
    await exportData();
    message.success('导出成功');
  };

  return (
    <aside className="sidebar" style={{ width }}>
      <SidebarTabs activeTab={activeTab} onChange={onTabChange} />
      {activeTab === 'collections' && (
        <CollectionsPanel
          collections={collections}
          savedRequests={savedRequests}
          loading={loading}
          expandedCollections={expandedCollections}
          onToggleCollection={toggleCollection}
          onSelectRequest={onSelectRequest}
          onNewRequest={onNewRequest}
          onNewCollection={() => setNewCollectionModal(true)}
          onImport={handleImport}
          onExport={handleExport}
          onMoveRequest={moveRequest}
          onDeleteRequest={deleteRequest}
          onDeleteCollection={deleteCollection}
        />
      )}
      {activeTab === 'history' && (
        <HistoryPanel
          history={history}
          loading={loading}
          onSelectRequest={onSelectRequest}
          onClearHistory={clearHistory}
          onDeleteHistoryItem={deleteHistoryItem}
        />
      )}
      {activeTab === 'archives' && (
        <ArchivesPanel
          archives={archives}
          loading={loading}
          onSelectRequest={onSelectRequest}
          onRestoreArchive={restoreArchive}
          onDeleteArchive={deleteArchive}
        />
      )}

      <Modal
        title="新建集合"
        open={newCollectionModal}
        onOk={createCollection}
        onCancel={() => setNewCollectionModal(false)}
        okText="创建"
        cancelText="取消"
      >
        <label className="flaw-form-label">集合名称</label>
        <Input
          placeholder="输入集合名称"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onPressEnter={createCollection}
        />
      </Modal>
    </aside>
  );
};