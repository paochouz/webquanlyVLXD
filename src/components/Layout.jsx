export default function Layout({ children }) {
  return (
    <div className="app-wrapper">
      <nav className="nav-tabs">
        <span className="nav-brand">VẬT LIỆU XÂY DỰNG BÀ SÁU</span>
        <div className="nav-right">
          <button className="icon-btn-nav">⚙️</button>
          <div className="avatar-nav">👤</div>
        </div>
      </nav>
      {children}
    </div>
  )
}
