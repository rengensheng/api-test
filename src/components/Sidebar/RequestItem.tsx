import { Button, Dropdown, Tag, type DropdownItem } from '../ui';
import type { SavedRequest, HistoryItem, ArchivedRequest } from '../../types';
import { getMethodTagColor } from '../../utils/method';

interface RequestItemProps {
  request: SavedRequest | HistoryItem | ArchivedRequest;
  statusCode?: number | null;
  indent?: boolean;
  menuItems: DropdownItem[];
  onSelect: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
}


export const RequestItem = ({
  request,
  statusCode,
  indent = false,
  menuItems,
  onSelect,
}: RequestItemProps) => (

  <div className={`sidebar-item ${indent ? 'indent' : ''}`} onClick={() => onSelect(request)}>
    <Tag color={getMethodTagColor(request.method)}>{request.method}</Tag>
    <span className="item-name">{request.name}</span>
    {statusCode !== undefined && statusCode !== null && (
      <Tag color={statusCode < 300 ? 'green' : statusCode < 400 ? 'orange' : 'red'}>
        {statusCode}
      </Tag>
    )}
    <Dropdown items={menuItems}>
      <Button size="sm" icon="more-horizontal" variant="ghost" onClick={(e) => e.stopPropagation()} />
    </Dropdown>
  </div>
);