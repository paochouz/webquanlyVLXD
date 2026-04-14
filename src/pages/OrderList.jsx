import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CancelModal from '../components/CancelModal'
import SuccessModal from '../components/SuccessModal'

const STATUS_COLORS = {
  'Chờ giao hàng': '#6d28d9',
  'Đang giao': '#d97706',
  'Hoàn tất': '#27ae60',
  'Đã hủy': '#e74c3c',
}
const STATUS_BG = {
  'Chờ giao hàng': '#ede9fe',
  'Đang giao': '#fef3c7',
  'Hoàn tất': '#e8f8f0',
  'Đã hủy': '#fdecea',
}

function canDoAction(status, action) {
  if (action === 'Xem') return true
  if (status === 'Đã hủy') return false
  if (status === 'Hoàn tất' && ['Sửa', 'Hủy'].includes(action)) return false
  return true
}

const PAGE_SIZE = 10

export default function OrderList({ onNavigate }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [page, setPage] = useState(1)

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('don_ban_hang')
      .select('*')
      .order('ngay_tao_don', { ascending: false, nullsFirst: false })
      .order('ma_don_ban', { ascending: false })
    if (!error) setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const filtered = orders.filter(o =>
    o.ma_don_ban?.toLowerCase().includes(search.toLowerCase()) ||
    o.ten_kh?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCancel = async (reason) => {
    const { error } = await supabase
      .from('don_ban_hang')
      .update({ trang_thai_don: 'Đã hủy', ghi_chu: reason })
      .eq('ma_don_ban', cancelTarget.ma_don_ban)
    if (!error) {
      setCancelTarget(null)
      setSuccessMsg('Hủy đơn hàng thành công')
      fetchOrders()
    }
  }

  return (
    <main className="main-content" onClick={() => setOpenMenu(null)}>
      <div className="table-card">
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, tên khách"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            <button className="btn-search">Tìm kiếm</button>
          </div>
          <button className="btn-create" onClick={() => onNavigate('create')}>+ TẠO ĐƠN BÁN MỚI</button>
        </div>

        <table className="orders-table">
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày tạo</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Đang tải...</td></tr>
            ) : paged.map((order, idx) => (
              <tr key={order.ma_don_ban}>
                <td><span className="order-id">{order.ma_don_ban}</span></td>
                <td>{order.ten_kh}</td>
                <td>{order.ngay_tao_don ? new Date(order.ngay_tao_don).toLocaleDateString('vi-VN') : ''}</td>
                <td>{Number(order.tong_tien_ban || 0).toLocaleString('vi-VN')}</td>
                <td>
                  <span className="status-badge" style={{
                    color: STATUS_COLORS[order.trang_thai_don] || '#333',
                    background: STATUS_BG[order.trang_thai_don] || '#f0f0f0',
                  }}>
                    {order.trang_thai_don}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="actions" onClick={e => e.stopPropagation()}>
                    <button className="menu-trigger" onClick={() => setOpenMenu(openMenu === idx ? null : idx)}>···</button>
                    {openMenu === idx && (
                      <div className="dropdown-menu">
                        {[
                          { label: 'Xem', action: () => onNavigate('view', order) },
                          { label: 'Sửa', action: () => onNavigate('edit', order) },
                          { label: 'Hủy', action: () => { setCancelTarget(order); setOpenMenu(null) } },
                        ].map(a => {
                          const disabled = !canDoAction(order.trang_thai_don, a.label)
                          return (
                            <button key={a.label} className="dropdown-item"
                              style={{ color: disabled ? '#bbb' : '#333' }}
                              disabled={disabled}
                              onClick={!disabled ? a.action : undefined}
                            >{a.label}</button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="table-footer">
          <span className="table-count">Hiển thị {paged.length} trên tổng {filtered.length}</span>
        </div>
      </div>

      <div className="pagination">
        <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
        ))}
        <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
      </div>

      {cancelTarget && (
        <CancelModal orderId={cancelTarget.ma_don_ban} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} />
      )}
      {successMsg && (
        <SuccessModal message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}
    </main>
  )
}
