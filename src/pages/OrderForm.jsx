import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SuccessModal from '../components/SuccessModal'

const emptyRow = () => ({ ma_sp: '', so_luong: 1, don_gia: 0, search: '', showSuggest: false })

export default function OrderForm({ mode = 'create', order, onNavigate }) {
  const isEdit = mode === 'edit'

  const [products, setProducts] = useState([])
  const [rows, setRows] = useState([emptyRow()])
  const [customer, setCustomer] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [deliveryType, setDeliveryType] = useState('giao_hang')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.from('san_pham').select('*').order('ma_sp').then(({ data }) => setProducts(data || []))
  }, [])

  useEffect(() => {
    if (isEdit && order) {
      setCustomer(order.ten_kh || '')
      setPhone(order.sdt_kh || '')
      setAddress(order.dia_chi_giao || '')
      setNote(order.ghi_chu || '')
      setDeliveryType(order.dia_chi_giao ? 'giao_hang' : 'nhan_tai_cho')
      supabase.from('chi_tiet_don_ban').select('*').eq('ma_don_ban', order.ma_don_ban)
        .then(({ data }) => {
          if (data && data.length > 0)
            setRows(data.map(r => ({ ma_sp: r.ma_sp, so_luong: r.so_luong, don_gia: r.don_gia, search: r.ma_sp, showSuggest: false })))
        })
    }
  }, [isEdit, order])

  const updateRow = (idx, fields) => {
    setRows(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], ...fields }
      return next
    })
  }

  const selectProduct = (idx, product) => {
    setRows(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], ma_sp: product.ma_sp, don_gia: product.don_gia, search: product.ten_sp, showSuggest: false }
      return next
    })
  }

  const getSuggestions = (search) =>
    products.filter(p =>
      search.trim().length === 0 ||
      p.ten_sp.toLowerCase().includes(search.toLowerCase()) ||
      p.ma_sp.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 8)

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx))

  const subtotal = rows.reduce((sum, r) => sum + (Number(r.don_gia) || 0) * (Number(r.so_luong) || 0), 0)
  const discount = Math.round(subtotal * 0.05)
  const total = subtotal - discount

  const handleSave = async () => {
    if (!customer.trim()) { setErrorMsg('Vui lòng nhập tên khách hàng'); return }
    if (!phone.trim()) { setErrorMsg('Vui lòng nhập số điện thoại'); return }
    if (/[^0-9]/.test(phone.trim())) { setErrorMsg('Số điện thoại không được chứa chữ hoặc ký tự đặc biệt'); return }
    if (phone.trim().length !== 10) { setErrorMsg('Số điện thoại phải đúng 10 chữ số'); return }
    if (deliveryType === 'giao_hang' && !address.trim()) { setErrorMsg('Vui lòng nhập địa chỉ giao hàng'); return }
    if (rows.some(r => !r.ma_sp)) { setErrorMsg('Vui lòng chọn sản phẩm cho tất cả dòng'); return }
    setErrorMsg('')
    setSaving(true)

    const trangThai = deliveryType === 'giao_hang' ? 'Chờ giao hàng' : 'Hoàn tất'

    try {
      if (isEdit) {
        const { error } = await supabase.from('don_ban_hang').update({
          ten_kh: customer, sdt_kh: phone,
          dia_chi_giao: deliveryType === 'giao_hang' ? address : '',
          ghi_chu: note,
          trang_thai_don: deliveryType === 'giao_hang' ? 'Chờ giao hàng' : 'Hoàn tất',
          tong_tien_ban: total,
        }).eq('ma_don_ban', order.ma_don_ban)

        if (error) { setErrorMsg('Lỗi cập nhật: ' + error.message); return }

        await supabase.from('chi_tiet_don_ban').delete().eq('ma_don_ban', order.ma_don_ban)
        const { error: e2 } = await supabase.from('chi_tiet_don_ban').insert(
          rows.map(r => ({ ma_don_ban: order.ma_don_ban, ma_sp: r.ma_sp, so_luong: Number(r.so_luong), don_gia: Number(r.don_gia) }))
        )
        if (e2) { setErrorMsg('Lỗi lưu chi tiết: ' + e2.message); return }
        setSuccess(true)
      } else {
        const { data: existing } = await supabase.from('don_ban_hang').select('ma_don_ban').order('ma_don_ban', { ascending: false }).limit(1)
        let newId = 'DB001'
        if (existing && existing.length > 0) {
          const num = parseInt(existing[0].ma_don_ban.replace(/\D/g, '')) + 1
          newId = 'DB' + String(num).padStart(3, '0')
        }

        const { error } = await supabase.from('don_ban_hang').insert({
          ma_don_ban: newId, ten_kh: customer, sdt_kh: phone,
          dia_chi_giao: deliveryType === 'giao_hang' ? address : '',
          ghi_chu: note, trang_thai_don: trangThai,
          tong_tien_ban: total, ngay_tao_don: new Date().toISOString().split('T')[0],
        })

        if (error) { setErrorMsg('Lỗi tạo đơn: ' + error.message); return }

        const { error: e2 } = await supabase.from('chi_tiet_don_ban').insert(
          rows.map(r => ({ ma_don_ban: newId, ma_sp: r.ma_sp, so_luong: Number(r.so_luong), don_gia: Number(r.don_gia) }))
        )
        if (e2) { setErrorMsg('Lỗi lưu chi tiết: ' + e2.message); return }
        setSuccess(true)
      }
    } finally {
      setSaving(false)
    }
  }

  const getProduct = (ma_sp) => products.find(p => p.ma_sp === ma_sp)

  return (
    <main className="main-content">
      {success && (
        <SuccessModal
          message={isEdit ? 'Cập nhật hóa đơn thành công' : 'Tạo đơn thành công'}
          onClose={() => onNavigate('list')}
        />
      )}

      <div className="form-layout">
        <div className="form-left">
          <h2 className="form-title">{isEdit ? 'SỬA ĐƠN BÁN' : 'TẠO ĐƠN BÁN'}</h2>

          <div className="table-card" style={{ padding: 0, overflow: 'visible' }}>
            <table className="product-table" style={{ overflow: 'visible' }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>STT</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: 70 }}>ĐVT</th>
                  <th style={{ width: 130 }}>Số lượng</th>
                  <th style={{ width: 130 }}>Đơn giá</th>
                  <th style={{ width: 120 }}>Thành tiền</th>
                  <th style={{ width: 46 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const p = getProduct(row.ma_sp)
                  const suggestions = getSuggestions(row.search)
                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', color: '#888' }}>{idx + 1}</td>
                      <td style={{ position: 'relative' }}>
                        <input
                          className="cell-input"
                          placeholder="Gõ tên sản phẩm..."
                          value={row.search}
                          onChange={e => updateRow(idx, { search: e.target.value, showSuggest: true })}
                          onFocus={() => updateRow(idx, { showSuggest: true })}
                          onBlur={() => setTimeout(() => updateRow(idx, { showSuggest: false }), 150)}
                          autoComplete="off"
                        />
                        {row.showSuggest && suggestions.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                            background: '#fff', border: '1px solid #ddd', borderRadius: 6,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
                          }}>
                            {suggestions.map(sp => (
                              <div key={sp.ma_sp}
                                onMouseDown={() => selectProduct(idx, sp)}
                                style={{
                                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                                  borderBottom: '1px solid #f0f0f0',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                              >
                                <span style={{ fontWeight: 600, color: '#333' }}>{sp.ten_sp}</span>
                                <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>{sp.ma_sp} · {sp.don_vi_tinh}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: '#666' }}>{p ? p.don_vi_tinh : ''}</td>
                      <td>
                        <div className="qty-control">
                          <button className="qty-btn" onClick={() => updateRow(idx, { so_luong: Math.max(1, row.so_luong - 1) })}>−</button>
                          <input className="cell-input qty-center" type="number" value={row.so_luong} min={1}
                            onChange={e => updateRow(idx, { so_luong: Number(e.target.value) })} />
                          <button className="qty-btn" onClick={() => updateRow(idx, { so_luong: row.so_luong + 1 })}>+</button>
                        </div>
                      </td>
                      <td>
                        <input className="cell-input" type="number" value={row.don_gia} min={0}
                          onChange={e => updateRow(idx, { don_gia: Number(e.target.value) })} />
                      </td>
                      <td>{((Number(row.don_gia) || 0) * row.so_luong).toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-remove-row" onClick={() => removeRow(idx)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button className="btn-add-row" onClick={addRow}>+ Thêm sản phẩm</button>
        </div>

        <div className="form-right">
          <div className="info-section">
            <div className="info-section-header">Thông tin khách hàng</div>
            <label className="field-label">Tên khách hàng <span style={{ color: '#e74c3c' }}>*</span></label>
            <input className="form-input" value={customer} onChange={e => setCustomer(e.target.value)} />
            <label className="field-label">Số điện thoại <span style={{ color: '#e74c3c' }}>*</span></label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />

            <label className="field-label">Hình thức nhận hàng</label>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" value="giao_hang" checked={deliveryType === 'giao_hang'}
                  onChange={() => setDeliveryType('giao_hang')} />
                Giao hàng
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
                <input type="radio" value="nhan_tai_cho" checked={deliveryType === 'nhan_tai_cho'}
                  onChange={() => setDeliveryType('nhan_tai_cho')} />
                Nhận tại chỗ
              </label>
            </div>

            {deliveryType === 'giao_hang' && (
              <>
                <label className="field-label">Địa chỉ giao hàng <span style={{ color: '#e74c3c' }}>*</span></label>
                <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
              </>
            )}

            <label className="field-label">Ghi chú</label>
            <textarea className="form-textarea" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="summary-section">
            <div className="summary-row"><span>Tổng tiền hàng:</span><span>{subtotal.toLocaleString('vi-VN')}đ</span></div>
            <div className="summary-row"><span>Chiết khấu (5%):</span><span>-{discount.toLocaleString('vi-VN')}đ</span></div>
            <div className="summary-total">
              <span>{isEdit ? 'CẦN THANH TOÁN:' : 'TỔNG CỘNG:'}</span>
              <span className="total-amount">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {errorMsg && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{errorMsg}</p>}

          <div className="form-buttons">
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Lưu đơn hàng')}
            </button>
            <button className="btn-back" onClick={() => onNavigate('list')}>
              {isEdit ? 'Quay lại danh sách' : 'Hủy bỏ'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
