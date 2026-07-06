import type { ReactNode } from 'react';

interface TabItem {
  key: string;
  label: string;
  children: ReactNode;
}

interface TabsProps {
  activeKey: string;
  onChange: (key: string) => void;
  items: TabItem[];
  className?: string;
}

export const Tabs = ({ activeKey, onChange, items, className = '' }: TabsProps) => {
  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div className={`flaw-tabs ${className}`}>
      <div className="flaw-tabs-nav">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`flaw-tabs-tab ${item.key === activeKey ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flaw-tabs-content">{activeItem?.children}</div>
    </div>
  );
};
