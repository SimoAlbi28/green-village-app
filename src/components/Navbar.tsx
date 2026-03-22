interface NavbarProps {
  initials: string
  avatarColor?: string
  userName?: string
  onHomeClick: () => void
  onProfileOpen: () => void
}

export default function Navbar({ initials, avatarColor, userName, onHomeClick, onProfileOpen }: NavbarProps) {
  const isWhite = avatarColor === '#ffffff'
  const textColor = isWhite ? '#000000' : (avatarColor || '#1a3a6b')
  const initialsColor = isWhite ? '#000000' : '#ffffff'

  return (
    <nav className="app-navbar">
      <div className="navbar-left">
        <img
          src="/logo-green-village.png"
          className="navbar-logo-small"
          onClick={onHomeClick}
          alt="Home"
        />
      </div>
      <div className="navbar-center">
        <span className="navbar-title">CONSIGLIERE</span>
        {userName && (
          <span className="navbar-username" style={{ color: textColor }}>
            {userName}
          </span>
        )}
      </div>
      <div className="navbar-right">
        <button
          className="btn-profile"
          onClick={onProfileOpen}
          style={{
            backgroundColor: avatarColor || '#1a3a6b',
            color: initialsColor,
            border: isWhite ? '2px solid #000' : undefined,
          }}
        >
          {initials}
        </button>
      </div>
    </nav>
  )
}
