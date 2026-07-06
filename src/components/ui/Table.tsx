import type { ReactNode } from 'react';

interface TableColumn<T> {
  title?: string;
  dataIndex?: string;
  key?: string;
  width?: number | string;
  render?: (value: unknown, record: T, index: number) => ReactNode;
}

interface TableProps<T> {
  dataSource: T[];
  columns: TableColumn<T>[];
  rowKey?: (record: T, index: number) => string;
  className?: string;
}

export const Table = <T extends object>({
  dataSource,
  columns,
  rowKey,
  className = '',
}: TableProps<T>) => (
  <table className={`flaw-table ${className}`}>
    <thead>
      <tr>
        {columns.map((col, idx) => (
          <th key={col.key ?? String(idx)} style={{ width: col.width }}>
            {col.title}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {dataSource.map((record, rowIndex) => (
        <tr key={rowKey ? rowKey(record, rowIndex) : `row-${rowIndex}`}>
          {columns.map((col, colIndex) => {
            const value = col.dataIndex ? (record as Record<string, unknown>)[col.dataIndex] : undefined;
            return (
              <td key={`${rowIndex}-${colIndex}`}>
                {col.render ? col.render(value, record, rowIndex) : String(value ?? '')}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  </table>
);
