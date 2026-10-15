import { useNavigate } from 'react-router-dom'
import { clearSession, getUser } from '../lib/api'

// TopNav — appears on all screens except Login
// Shows the SlotBack brand + the signed-in coordinator on the right

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?'
}

export default function TopNav() {
  const navigate = useNavigate()
  const user = getUser()
  const name = user?.full_name || user?.email || ''

  function handleSignOut() {
    clearSession()
    navigate('/login')
  }

  return (
    <nav className="top-nav">
      <div className="top-nav-logo">
        <span>🏥</span> SlotBack
      </div>
      <div className="top-nav-user">
        <span>{name}</span>
        <div className="top-nav-avatar">{initials(name)}</div>
        <button className="top-nav-signout" onClick={handleSignOut}>Sign out</button>
      </div>
    </nav>
  )
}
