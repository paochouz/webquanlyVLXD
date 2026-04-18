import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SuccessModal from '../components/SuccessModal'

const STATUS_COLORS = {
  'Chờ giao hàng': '#6d28d9',
  'Đang giao': '#d97706',
  'Hoàn tất': '#15803d',
  'Đã hủy': '#b91c1c',
}
const STATUS_BG = {
  'Chờ giao hàng': '#ede9fe',
  'Đang giao': '#fef3c7',
  'Hoàn tất': '#dcfce7',
  'Đã hủy': '#fee2e2',
}

const NEXT_STATUS = {
  'Chờ giao hàng': 'Đang giao',
  'Đang giao': 'Hoàn tất',
}
const NEXT_LABEL = {
  'Chờ giao hàng': 'Xác nhận giao hàng',
  'Đang giao': 'Xác nhận hoàn tất',
}

export default function OrderView({ order, onNavigate }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(order?.trang_thai_don || 'Chờ giao hàng')
  const [updating, setUpdating] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    if (!order?.ma_don_ban) return
    supabase
      .from('chi_tiet_don_ban')
      .select('*, san_pham(ten_sp, don_vi_tinh)')
      .eq('ma_don_ban', order.ma_don_ban)
      .then(({ data }) => { setItems(data || []); setLoading(false) })
  }, [order])

  const subtotal = items.reduce((s, i) => s + Number(i.don_gia) * Number(i.so_luong), 0)
  const discount = Math.round(subtotal * 0.05)
  const total = subtotal - discount

  const handleAdvanceStatus = async () => {
    const next = NEXT_STATUS[status]
    if (!next) return
    setUpdating(true)
    const { error } = await supabase
      .from('don_ban_hang')
      .update({ trang_thai_don: next })
      .eq('ma_don_ban', order.ma_don_ban)
    if (!error) {
      setStatus(next)
      setSuccessMsg(`Đã chuyển sang "${next}"`)
    }
    setUpdating(false)
  }

  return (
    <main className="main-content">
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />}

      <div className="form-layout">
        <div className="form-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <h2 className="form-title" style={{ margin: 0 }}>CHI TIẾT ĐƠN HÀNG</h2>
            <span style={{
              fontSize: 15, fontWeight: 700, color: '#4a9fd4',
              background: '#eef4f9', padding: '3px 12px', borderRadius: 20,
            }}>
              {order?.ma_don_ban}
            </span>
          </div>

          <div className="table-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="product-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>STT</th>
                  <th style={{ width: 90 }}>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: 70 }}>ĐVT</th>
                  <th style={{ width: 80 }}>SL</th>
                  <th style={{ width: 120 }}>Đơn giá</th>
                  <th style={{ width: 130 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>Đang tải...</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', color: '#888' }}>{idx + 1}</td>
                    <td>{item.ma_sp}</td>
                    <td>{item.san_pham?.ten_sp || ''}</td>
                    <td>{item.san_pham?.don_vi_tinh || ''}</td>
                    <td>{item.so_luong}</td>
                    <td>{Number(item.don_gia).toLocaleString('vi-VN')}</td>
                    <td style={{ fontWeight: 600 }}>{(Number(item.don_gia) * Number(item.so_luong)).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, marginTop: 16 }}>
            <div className="order-stamp" style={{ color: STATUS_COLORS[status], borderColor: STATUS_COLORS[status], background: 'transparent' }}>
              <span>{status.toUpperCase()}</span>
            </div>
            <div className="summary-section" style={{ width: 280 }}>
              <div className="summary-row"><span>Tổng tiền hàng:</span><span>{subtotal.toLocaleString('vi-VN')}đ</span></div>
              <div className="summary-row"><span>Chiết khấu (5%):</span><span>-{discount.toLocaleString('vi-VN')}đ</span></div>
              <div className="summary-total">
                <span>TỔNG CỘNG:</span>
                <span className="total-amount">{total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="form-right">
          <div className="info-section">
            <div className="info-section-header">Thông tin khách hàng</div>
            <div className="view-info-row"><span>Khách hàng</span><span>{order?.ten_kh}</span></div>
            <div className="view-info-row"><span>Số điện thoại</span><span>{order?.sdt_kh}</span></div>
            {order?.dia_chi_giao && <div className="view-info-row"><span>Địa chỉ</span><span>{order.dia_chi_giao}</span></div>}
            {order?.ghi_chu && <div className="view-info-row"><span>Ghi chú</span><span>{order.ghi_chu}</span></div>}
          </div>

          {/* Nút chuyển trạng thái */}
          {NEXT_STATUS[status] && (
            <button
              className="btn-save"
              style={{ width: '100%', marginBottom: 8, background: STATUS_COLORS[NEXT_STATUS[status]] }}
              onClick={handleAdvanceStatus}
              disabled={updating}
            >
              {updating ? 'Đang cập nhật...' : NEXT_LABEL[status]}
            </button>
          )}

          <div className="form-buttons">
            {status === 'Chờ giao hàng' && (
              <button className="btn-save" onClick={() => onNavigate('edit', order)}>Sửa đơn hàng</button>
            )}
            <button className="btn-back" onClick={() => onNavigate('list')}>Quay lại</button>
          </div>

          <div className="view-meta-note">
            <span>Ngày tạo: {order?.ngay_tao_don ? new Date(order.ngay_tao_don).toLocaleDateString('vi-VN') : ''}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
