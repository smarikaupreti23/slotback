// FormSectionWrapper — Custom Component 2
// A white card container that groups related form fields or content.
// Used on every screen to create visual hierarchy and consistency.
//
// Props:
//   title     – section heading (required)
//   subtitle  – optional supporting text below the title
//   icon      – optional emoji shown before the title
//   children  – the content rendered inside the card
//   success   – if true, adds a subtle green glow (used on Confirmation screen)

export default function FormSectionWrapper({ title, subtitle, icon, children, success = false }) {
  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: success
      ? '0 1px 4px rgba(0,0,0,0.08), 0 0 0 4px rgba(0,184,148,0.15)'
      : '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    borderLeft: '3px solid #1B6B6B',
    overflow: 'hidden',
  }

  const headerStyle = {
    padding: '14px 20px',
    borderBottom: '1px solid #E8F5F5',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  }

  const titleStyle = {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2D3436',
    lineHeight: '1.4',
  }

  const subtitleStyle = {
    fontSize: '13px',
    color: '#636E72',
    marginTop: '3px',
  }

  const bodyStyle = {
    padding: '20px',
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        {icon && <span style={{ fontSize: '17px', marginTop: '1px' }}>{icon}</span>}
        <div>
          <div style={titleStyle}>{title}</div>
          {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
        </div>
      </div>
      <div style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}
