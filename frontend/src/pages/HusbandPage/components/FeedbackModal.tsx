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
        <div className="feedback-modal-icon">🎉</div>
        <h3 className="feedback-modal-title">完成啦！</h3>
        <p className="feedback-modal-dish">{dishName}</p>
        <p className="feedback-modal-tip">要不要给她发个消息？</p>
        <Button
          className="feedback-modal-btn"
          onClick={onNotify}
        >
          🍱 我做好啦！
        </Button>
        <Button
          className="feedback-modal-close"
          onClick={onClose}
        >
          先不发了
        </Button>
      </div>
    </Modal>
  );
}
