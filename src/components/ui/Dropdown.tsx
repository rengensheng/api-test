import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';
export interface DropdownItem {
  key: string;
  label: string;
  icon?: string;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  items: DropdownItem[];
  children: ReactNode;
}


export const Dropdown = ({ items, children }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (item: DropdownItem) => {
    item.onClick?.();
    setOpen(false);
  };

  return (
    <div className="flaw-dropdown" ref={ref}>
      <div className="flaw-dropdown-trigger" onClick={() => setOpen((v) => !v)}>
        {children}
      </div>
      {open && (
        <div className="flaw-dropdown-menu">
          {items.map((item) =>
            item.divider ? (
              <div key={item.key} className="flaw-dropdown-divider" />
            ) : (
              <button
                key={item.key}
                type="button"
                className={`flaw-dropdown-item ${item.danger ? 'danger' : ''}`}
                onClick={() => handleClick(item)}
              >
                {item.icon && <Icon name={item.icon} />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};