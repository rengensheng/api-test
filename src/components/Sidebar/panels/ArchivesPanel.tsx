import { Empty } from '../../ui';
import { RequestItem } from '../RequestItem';
import type { ArchivedRequest, SavedRequest, HistoryItem } from '../../../types';

interface ArchivesPanelProps {
  archives: ArchivedRequest[];
  loading: boolean;
  onSelectRequest: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  onRestoreArchive: (item: ArchivedRequest) => Promise<void>;
  onDeleteArchive: (id: string) => Promise<void>;
}

export const ArchivesPanel = ({
  archives,
  loading,
  onSelectRequest,
  onRestoreArchive,
  onDeleteArchive,
}: ArchivesPanelProps) => (
  <div className="sidebar-content">
    <div className="sidebar-list">
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
      ) : archives.length === 0 ? (
        <Empty description="暂无归档请求" />
      ) : (
        archives.map((item) => (
          <RequestItem
            key={item.id}
            request={item}
            menuItems={[
              {
                key: 'restore',
                label: '恢复到收藏',
                onClick: () => onRestoreArchive(item),
              },
              {
                key: 'delete',
                label: '永久删除',
                danger: true,
                onClick: () => onDeleteArchive(item.id),
              },
            ]}
            onSelect={onSelectRequest}
          />
        ))
      )}
    </div>
  </div>
);
