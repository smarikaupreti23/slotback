// AppButton — Custom Component 1
// Reusable button used across all 4 screens in the SlotBack app.
// Supports three visual variants and a disabled / full-width mode.
//
// Props:
//   label      – the text shown on the button
//   onClick    – click handler function
//   variant    – 'primary' | 'secondary' | 'danger'  (default: 'primary')
//   disabled   – greys out and blocks interaction
//   fullWidth  – stretches to fill the parent container
//   type       – HTML button type ('button' | 'submit')  (default: 'button')

export default function AppButton({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  type = 'button',
}) {
  const baseStyle = {
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : 'auto',
    border: 'none',
    transition: 'background 0.15s ease, opacity 0.15s ease',
    fontFamily: 'inherit',
    lineHeight: '1.4',
  }

  const variants = {
    primary: {
      background: '#1B6B6B',
      color: '#FFFFFF',
    },
    secondary: {
      background: '#FFFFFF',
      color: '#1B6B6B',
      border: '1.5px solid #1B6B6B',
    },
    danger: {
      background: '#D63031',
      color: '#FFFFFF',
    },
  }

  const style = { ...baseStyle, ...variants[variant] }

  function handleMouseEnter(e) {
    if (disabled) return
    if (variant === 'primary')   e.target.style.background = '#145454'
    if (variant === 'danger')    e.target.style.background = '#B52828'
    if (variant === 'secondary') e.target.style.background = '#E8F5F5'
  }

  function handleMouseLeave(e) {
    if (disabled) return
    if (variant === 'primary')   e.target.style.background = '#1B6B6B'
    if (variant === 'danger')    e.target.style.background = '#D63031'
    if (variant === 'secondary') e.target.style.background = '#FFFFFF'
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={style}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {label}
    </button>
  )
}
