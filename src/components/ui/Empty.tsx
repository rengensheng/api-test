interface EmptyProps {
  description: string;
  className?: string;
}

export const Empty = ({ description, className = '' }: EmptyProps) => (
  <div className={`flaw-empty ${className}`}>
    <div className="flaw-empty-line" />
    <div className="flaw-empty-line short" />
    <p>{description}</p>
  </div>
);
