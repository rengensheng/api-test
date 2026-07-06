import { useEffect, useState } from 'react';
import { Input, Modal, Select } from '../ui';
import type { Collection } from '../../types';

interface SaveModalProps {
  open: boolean;
  name: string;
  collectionId: string | null;
  collections: Collection[];
  onOk: (name: string, collectionId: string | null) => void;
  onCancel: () => void;
  onCollectionChange: (id: string | null) => void;
}

export const SaveModal = ({
  open,
  name,
  collectionId,
  collections,
  onOk,
  onCancel,
  onCollectionChange,
}: SaveModalProps) => {
  const [localName, setLocalName] = useState(name);

  useEffect(() => {
    setLocalName(name);
  }, [name, open]);

  const handleOk = () => onOk(localName.trim(), collectionId);

  return (

    <Modal
      title="保存请求"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
    >
      <div className="flaw-form-row">
        <label className="flaw-form-label">请求名称</label>
        <Input
          placeholder="请求名称"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onPressEnter={handleOk}
        />
      </div>
      <div className="flaw-form-row">
        <label className="flaw-form-label">保存到集合</label>
        <Select
          style={{ width: '100%' }}
          value={collectionId}
          onChange={(value) => onCollectionChange(value || null)}
          placeholder="选择集合（可选）"
          options={[{ value: '', label: '未分类' }, ...collections.map((c) => ({ value: c.id, label: c.name }))]}
        />
      </div>
    </Modal>
  );
};