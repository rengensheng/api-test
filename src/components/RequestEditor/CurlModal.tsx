import { Button, Modal, TextArea } from '../ui';

interface CurlModalProps {
  open: boolean;
  command: string;
  onClose: () => void;
  onCopy: () => void;
}

export const CurlModal = ({ open, command, onClose, onCopy }: CurlModalProps) => (
  <Modal
    title="Curl 命令"
    open={open}
    onCancel={onClose}
    footer={
      <>
        <Button onClick={onClose}>关闭</Button>
        <Button variant="primary" onClick={onCopy}>
          复制
        </Button>
      </>
    }

    width={700}
  >
    <TextArea value={command} readOnly rows={10} mono />
  </Modal>
);