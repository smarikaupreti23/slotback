// InputField — Custom Component 3
// A labelled text input with built-in error display and help text.
// Used on Login, CancelSlot, and Waitlist screens.
//
// Props:
//   label       – the label shown above the input
//   value       – controlled value (from parent state)
//   onChange    – change handler passed down from the parent
//   type        – input type: 'text' | 'email' | 'password' | 'date'  (default: 'text')
//   placeholder – placeholder text
//   error       – if provided, shows this string in red and turns the border red
//   required    – adds a red asterisk to the label
//   helpText    – muted helper text shown below the field (only when no error)

export default function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  error = '',
  required = false,
  helpText = '',
}) {
  const hasError = Boolean(error)

  const wrapperStyle = {
    marginBottom: '16px',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: '6px',
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '6px',
    border: `1px solid ${hasError ? '#D63031' : '#D0E4E4'}`,
    fontSize: '14px',
    color: '#2D3436',
    background: '#FFFFFF',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    outline: 'none',
  }

  const errorStyle = {
    fontSize: '12px',
    color: '#D63031',
    marginTop: '5px',
  }

  const helpStyle = {
    fontSize: '12px',
    color: '#636E72',
    marginTop: '5px',
  }

  return (
    <div style={wrapperStyle}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#D63031', marginLeft: '3px' }}>*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => {
          e.target.style.borderColor = hasError ? '#D63031' : '#1B6B6B'
          e.target.style.boxShadow = hasError
            ? '0 0 0 3px rgba(214,48,49,0.10)'
            : '0 0 0 3px rgba(27,107,107,0.12)'
        }}
        onBlur={e => {
          e.target.style.borderColor = hasError ? '#D63031' : '#D0E4E4'
          e.target.style.boxShadow = 'none'
        }}
      />

      {hasError && <p style={errorStyle}>{error}</p>}
      {!hasError && helpText && <p style={helpStyle}>{helpText}</p>}
    </div>
  )
}
