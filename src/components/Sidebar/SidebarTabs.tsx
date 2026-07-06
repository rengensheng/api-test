import { Icon } from '../ui';
import type { SidebarTab } from '../../types';

interface SidebarTabsProps {
  activeTab: SidebarTab;
  onChange: (tab: SidebarTab) => void;
}

const tabs: { key: SidebarTab; label: string; icon: string }[] = [
  { key: 'collections', label: '收藏', icon: 'folder-open' },
  { key: 'history', label: '历史', icon: 'clock' },
  { key: 'archives', label: '归档', icon: 'archive' },
];

export const SidebarTabs = ({ activeTab, onChange }: SidebarTabsProps) => (
  <div className="sidebar-tab-bar">
    {tabs.map((tab) => (
      <button
        key={tab.key}
        type="button"
        className={`sidebar-tab ${activeTab === tab.key ? 'active' : ''}`}
        onClick={() => onChange(tab.key)}
      >
        <Icon name={tab.icon} />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
);
