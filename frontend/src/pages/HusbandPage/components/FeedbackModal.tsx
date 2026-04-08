import { Modal, Button } from 'antd-mobile';
import './FeedbackModal.css';

interface FeedbackModalProps {
  visible: boolean;
  dishName: string;
  onNotify: () => void;
  onClose: () => void;
}

export default function FeedbackModal({ visible, dishName, onNotify, onClose }: FeedbackModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      onClose={onClose}
      className="feedback-modal"
    >
      <div className="feedback-modal-content">
        <div className="feedback-modal-icon">🍱</div>
        <h3 className="feedback-modal-title">做完了！</h3>
        <p className="feedback-modal-dish">{dishName}</p>
        <p className="feedback-modal-tip">给她发个通知？</p>
        <Button
          className="feedback-modal-btn primary"
          onClick={onNotify}
          block
        >
          通知她
        </Button>
        <Button
          className="feedback-modal-btn secondary"
          onClick={onClose}
          block
        >
          稍后再说
        </Button>
      </div>
    </Modal>
  );
}
