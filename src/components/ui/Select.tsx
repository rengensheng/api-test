import { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

interface SelectOption {
  value: string | number | null;
  label: string;
}

interface SelectProps {
  value?: string | number | null;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Select = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  style,
}: SelectProps) => {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const normalizeValue = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    return String(v);
  };
  const selectedOption = options.find((opt) => normalizeValue(opt.value) === normalizeValue(value));

  const close = useCallback(() => {
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [close]);

  // scroll highlighted option into view
  useEffect(() => {
    if (!open || highlightIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('.flaw-select-option');
    if (items[highlightIndex]) {
      items[highlightIndex].scrollIntoView({ block: 'nearest' });
    }
  }, [open, highlightIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(options.findIndex((opt) => normalizeValue(opt.value) === normalizeValue(value)));
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => {
          const next = prev + 1;
          return next >= options.length ? 0 : next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? options.length - 1 : next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < options.length) {
          const opt = options[highlightIndex];
          onChange?.(String(opt.value ?? ''));
          close();
        }
        break;
    }
  };

  const handleSelect = (opt: SelectOption) => {
    onChange?.(String(opt.value ?? ''));
    close();
  };

  const normValue = normalizeValue(value);

  return (
    <div
      className={`flaw-select-wrap ${className}`}
      style={style}
      ref={ref}
      onKeyDown={handleKeyDown}
      data-value={normValue}
    >
      <button
        type="button"
        className={`flaw-select-trigger ${open ? 'is-open' : ''}`}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setHighlightIndex(options.findIndex((opt) => normalizeValue(opt.value) === normalizeValue(value)));
          }
        }}
        tabIndex={0}
      >
        <span className={`flaw-select-value ${!selectedOption ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : (placeholder || '选择...')}
        </span>
        <Icon name="chevron-down" className={`flaw-select-arrow ${open ? 'is-open' : ''}`} />
      </button>

      {open && (
        <div className="flaw-select-dropdown" ref={listRef}>
          {options.map((opt, index) => {
            const isSelected = normalizeValue(opt.value) === normValue;
            const isHighlighted = index === highlightIndex;
            return (
              <button
                key={String(opt.value ?? '__empty__') + index}
                type="button"
                className={`flaw-select-option ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                {opt.label}
                {isSelected && <Icon name="check" size={12} className="flaw-select-check" />}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="flaw-select-empty">无选项</div>
          )}
        </div>
      )}
    </div>
  );
};