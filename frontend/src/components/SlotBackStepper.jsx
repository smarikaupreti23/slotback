// SlotBackStepper — 21st.dev Integration
// A three-step progress indicator showing the coordinator's position
// in the SlotBack workflow. Integrated from 21st.dev's stepper component
// pattern and adapted to match the SlotBack brand.
//
// Props:
//   activeStep – number (1, 2, or 3) indicating the current screen

const STEPS = [
  { id: 1, label: 'Mark Cancellation', icon: '📅' },
  { id: 2, label: 'Manage Waitlist',   icon: '📋' },
  { id: 3, label: 'Booking Confirmed', icon: '✅' },
]

export default function SlotBackStepper({ activeStep }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E8F5F5',
      padding: '16px 24px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '520px',
        margin: '0 auto',
        gap: '0',
      }}>
        {STEPS.map((step, index) => {
          const isComplete = step.id < activeStep
          const isActive   = step.id === activeStep
          const isUpcoming = step.id > activeStep

          const circleStyle = {
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isComplete ? '15px' : '13px',
            fontWeight: '700',
            flexShrink: 0,
            background: isComplete ? '#1B6B6B'
                      : isActive   ? '#1B6B6B'
                      : '#E8EEEE',
            color: isComplete || isActive ? '#FFFFFF' : '#8E9E9E',
            boxShadow: isActive ? '0 0 0 4px rgba(27,107,107,0.15)' : 'none',
            transition: 'all 0.2s ease',
          }

          const labelStyle = {
            fontSize: '12px',
            fontWeight: isActive ? '700' : '500',
            color: isUpcoming ? '#9AAAAA' : '#2D3436',
            marginTop: '6px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }

          // The connector line between steps
          const connectorStyle = {
            flex: 1,
            height: '2px',
            background: isComplete ? '#1B6B6B' : '#D0E4E4',
            margin: '0 8px',
            marginBottom: '22px',
            transition: 'background 0.3s ease',
          }

          return (
            <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: step.id < STEPS.length ? 1 : 0 }}>
              {/* Step node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '64px' }}>
                <div style={circleStyle}>
                  {isComplete ? '✓' : isActive ? step.icon : step.id}
                </div>
                <span style={labelStyle}>{step.label}</span>
              </div>

              {/* Connector to next step */}
              {index < STEPS.length - 1 && (
                <div style={connectorStyle} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
