export default function SuccessModal({ message, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box success-modal">
        <div className="success-icon">✔</div>
        <p className="success-msg">{message}</p>
        <button className="btn-success-close" onClick={onClose}>Đóng</button>
      </div>
    </div>
  )
}
