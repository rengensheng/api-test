import { useState } from 'react';
import { Button, Dropdown, Icon, type DropdownItem } from '../ui';
import { RequestItem } from './RequestItem';
import type { Collection, SavedRequest, HistoryItem, ArchivedRequest } from '../../types';

interface CollectionGroupProps {
  id: string;
  name: string;
  requests: SavedRequest[];
  expanded: boolean;
  onToggle: (id: string) => void;
  onSelect: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  menuItems: (collection: Collection) => DropdownItem[];
  requestMenuItems: (request: SavedRequest) => DropdownItem[];
  collection?: Collection;
  showMenu?: boolean;
}



export const CollectionGroup = ({
  id,
  name,
  requests,
  expanded,
  onToggle,
  onSelect,
  menuItems,
  requestMenuItems,
  collection,
  showMenu = true,
}: CollectionGroupProps) => {
  const [hover, setHover] = useState(false);

  return (
    <div className="collection-group">
      <div
        className={`collection-header ${hover ? 'hover' : ''}`}
        onClick={() => onToggle(id)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} />
        <Icon name="folder-open" />
        <span className="collection-name">{name}</span>
        <span className="collection-count">({requests.length})</span>
        {showMenu && collection && (
          <div className="collection-actions">
            <Dropdown items={menuItems(collection)}>
              <Button size="sm" icon="more-horizontal" variant="ghost" onClick={(e) => e.stopPropagation()} />
            </Dropdown>
          </div>
        )}
      </div>

      {expanded && (
        <div className="collection-items">
          {requests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              indent
              menuItems={requestMenuItems(request)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};