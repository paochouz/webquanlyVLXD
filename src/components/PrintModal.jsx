import { useState } from 'react'
import SuccessModal from './SuccessModal'

export default function PrintModal({ order, onClose }) {
  const [success, setSuccess] = useState(null)

  const handleAction = (type) => setSuccess(type === 'print' ? 'In/Xuất hóa đơn thành công' : 'Xuất PDF thành công')

  if (success) return <SuccessModal message={success} onClose={onClose} />

  return (
    <div className="modal-overlay">
      <div className="modal-box print-modal">
        <h3 className="modal-title">Xem trước và xuất hóa đơn {order.id}</h3>
        <div className="print-body">
          {/* Preview */}
          <div className="invoice-preview">
            <div className="invoice-header">
              <strong>HÓA ĐƠN BÁN LẺ</strong>
              <div>CỬA HÀNG VLXD BÀ 6</div>
              <div style={{ fontSize: 12, color: '#666' }}>Địa chỉ: 123 Phố A, SĐT: 0900.000.000</div>
            </div>
            <div className="invoice-info">
              <div><span>Mã đơn: {order.id}</span><span>Ngày: {order.date}</span></div>
              <div>Khách hàng: {order.customer}</div>
              <div>SĐT: 090xxxxxxx</div>
            </div>
            <table className="invoice-table">
              <thead>
                <tr><th>Tên hàng</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
              </thead>
              <tbody>
                <tr><td>Gạch lát nền 60x60 A</td><td>10</td><td>150,000</td><td>1,500,000</td></tr>
                <tr><td>Thép xây dựng phi 10</td><td>200</td><td>20,000</td><td>4,000,000</td></tr>
                <tr><td>Xi măng PC40</td><td>5</td><td>90,000</td><td>450,000</td></tr>
              </tbody>
            </table>
            <div className="invoice-summary">
              <div><span>Tổng cộng:</span><span style={{ color: '#e74c3c' }}>6,450,000</span></div>
              <div><span>Đã thanh toán:</span><span>0</span></div>
              <div><span>Cần thanh toán:</span><span style={{ color: '#4a9fd4', fontWeight: 700 }}>6,450,000</span></div>
            </div>
            <div className="invoice-footer">Cảm ơn quý khách đã mua hàng!</div>
          </div>

          {/* Config + Actions */}
          <div className="print-config">
            <div className="config-section">
              <strong>Cấu hình:</strong>
              <label>Khổ giấy:</label>
              <input className="form-input" defaultValue="K80 (Máy in nhiệt)" readOnly />
            </div>
            <div className="print-actions">
              <button className="btn-print" onClick={() => handleAction('print')}>🖨 In hóa đơn</button>
              <button className="btn-pdf" onClick={() => handleAction('pdf')}>📄 Xuất PDF</button>
              <button className="btn-close-print" onClick={onClose}>Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
