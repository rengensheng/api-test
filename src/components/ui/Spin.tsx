interface SpinProps {
  tip?: string;
  size?: 'sm' | 'md';
}

export const Spin = ({ tip, size = 'md' }: SpinProps) => (
  <div className={`flaw-spin ${size === 'md' ? 'flaw-spin-md' : 'flaw-spin-sm'}`}>
    <span className="flaw-spinner" />
    {tip && <span className="flaw-spin-tip">{tip}</span>}
  </div>
);
