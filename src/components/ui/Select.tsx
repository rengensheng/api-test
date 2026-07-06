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
}: SelectProps) => (
  <select
    className={`flaw-select ${className}`}
    value={value ?? ''}
    onChange={(e) => onChange?.(e.target.value)}
    style={style}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((opt) => (
      <option key={String(opt.value)} value={opt.value ?? ''}>
        {opt.label}
      </option>
    ))}
  </select>
);
