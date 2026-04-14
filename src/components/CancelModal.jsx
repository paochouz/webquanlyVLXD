import { useState } from 'react'

export default function CancelModal({ orderId, onClose, onConfirm }) {
  const [reason, setReason] = useState('')

  return (
    <div className="modal-overlay">
      <div className="cancel-modal-wrap">
        <div className="cm-header">
          <div className="cm-title-row">
            <span className="cm-title">Hủy đơn hàng <span className="cm-badge">{orderId}</span></span>
          </div>
        </div>

        <div className="cm-body">
          <div className="cm-alert">
            <span className="cm-alert-icon">!</span>
            <span>Thao tác này <strong>không thể hoàn tác</strong> sau khi xác nhận.</span>
          </div>

          <label className="cm-label">Lý do hủy <span className="cm-required">*</span></label>
          <textarea
            className="cm-textarea"
            placeholder="Nhập lý do hủy đơn hàng..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div className="cm-footer">
          <button className="cm-btn-back" onClick={onClose}>Quay lại</button>
          <button
            className="cm-btn-confirm"
            onClick={() => reason.trim() && onConfirm(reason)}
            disabled={!reason.trim()}
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  )
}
