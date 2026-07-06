import { Button, Empty } from '../../ui';
import { CollectionGroup } from '../CollectionGroup';

import type { Collection, SavedRequest, HistoryItem, ArchivedRequest } from '../../../types';

interface CollectionsPanelProps {
  collections: Collection[];
  savedRequests: SavedRequest[];
  loading: boolean;
  expandedCollections: Set<string>;
  onToggleCollection: (id: string) => void;
  onSelectRequest: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  onNewRequest: () => void;
  onNewCollection: () => void;
  onImport: () => void;
  onExport: () => void;
  onMoveRequest: (request: SavedRequest, collectionId: string | null) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  onDeleteCollection: (id: string) => Promise<void>;
}

export const CollectionsPanel = ({
  collections,
  savedRequests,
  loading,
  expandedCollections,
  onToggleCollection,
  onSelectRequest,
  onNewRequest,
  onNewCollection,
  onImport,
  onExport,
  onMoveRequest,
  onDeleteRequest,
  onDeleteCollection,
}: CollectionsPanelProps) => {
  const getRequests = (id: string | null) => savedRequests.filter((r) => r.collectionId === id);
  const uncategorized = getRequests(null);
  const hasContent = collections.length > 0 || uncategorized.length > 0;
  const requestMenu = (request: SavedRequest) => [
    ...collections.map((c) => ({
      key: c.id,
      label: c.name,
      onClick: () => onMoveRequest(request, c.id),
    })),
    { key: 'none', label: '未分类', onClick: () => onMoveRequest(request, null) },
    { key: 'divider-move', label: '', divider: true },
    { key: 'delete', label: '删除', danger: true as const, onClick: () => onDeleteRequest(request.id) },
  ];


  const collectionMenu = (collection: Collection) => [
    {
      key: 'delete',
      label: '删除集合',
      danger: true as const,
      onClick: () => onDeleteCollection(collection.id),
    },
  ];

  return (
    <div className="sidebar-content">
      <div className="sidebar-header">
        <Button variant="primary" icon="plus" onClick={onNewRequest} block>
          新建请求
        </Button>
      </div>
      <div className="sidebar-actions">
        <Button icon="folder-plus" onClick={onNewCollection}>
          新建
        </Button>
        <Button icon="upload" onClick={onImport}>
          导入
        </Button>
        <Button icon="download" onClick={onExport}>
          导出
        </Button>
      </div>
      <div className="sidebar-list">
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
        ) : hasContent ? (
          <>
            {collections.map((collection) => (
              <CollectionGroup
                key={collection.id}
                id={collection.id}
                name={collection.name}
                requests={getRequests(collection.id)}
                expanded={expandedCollections.has(collection.id)}
                onToggle={onToggleCollection}
                onSelect={onSelectRequest}
                menuItems={collectionMenu}
                requestMenuItems={requestMenu}
                collection={collection}
              />
            ))}
            {uncategorized.length > 0 && (
              <CollectionGroup
                id="__uncategorized__"
                name="未分类"
                requests={uncategorized}
                expanded={expandedCollections.has('__uncategorized__')}
                onToggle={onToggleCollection}
                onSelect={onSelectRequest}
                menuItems={() => []}
                requestMenuItems={requestMenu}
                showMenu={false}
              />
            )}
          </>
        ) : (
          <Empty description="暂无保存的请求" />
        )}
      </div>
    </div>
  );
};