import { Button, Empty } from '../../ui';
import { RequestItem } from '../RequestItem';
import type { HistoryItem, SavedRequest, ArchivedRequest } from '../../../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  loading: boolean;
  onSelectRequest: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => Promise<void>;
}

export const HistoryPanel = ({
  history,
  loading,
  onSelectRequest,
  onClearHistory,
  onDeleteHistoryItem,
}: HistoryPanelProps) => (
  <div className="sidebar-content">
    <div className="sidebar-header">
      <Button variant="danger" icon="trash-2" onClick={onClearHistory}>
        清空历史
      </Button>
    </div>
    <div className="sidebar-list">
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>加载中...</div>
      ) : history.length === 0 ? (
        <Empty description="暂无历史记录" />
      ) : (
        history.map((item) => (
          <RequestItem
            key={item.id}
            request={item}
            statusCode={item.statusCode}
            menuItems={[
              {
                key: 'delete',
                label: '删除',
                danger: true,
                onClick: () => onDeleteHistoryItem(item.id),
              },
            ]}
            onSelect={onSelectRequest}
          />
        ))
      )}
    </div>
  </div>
);
