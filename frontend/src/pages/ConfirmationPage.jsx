import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AppButton from '../components/AppButton'
import FormSectionWrapper from '../components/FormSectionWrapper'
import SlotBackStepper from '../components/SlotBackStepper'
import { api } from '../lib/api'

// ConfirmationPage — Screen 4
// The "job done" screen. Everything shown here is read back from Supabase:
// who was notified, who accepted, and which offers were auto-cancelled.

function joinNames(names) {
  if (names.length <= 1) return names.join('')
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const cancellationId = sessionStorage.getItem('cancellationId')

  const [summary, setSummary] = useState(null)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!cancellationId) return
    api.getSummary(cancellationId)
      .then(setSummary)
      .catch(err => setError(err.message))
  }, [cancellationId])

  if (!cancellationId) return <Navigate to="/cancel" replace />

  function handleBack() {
    sessionStorage.removeItem('cancellationId')
    navigate('/cancel')
  }

  const slot = summary?.cancellation
  const winner = summary?.winner

  return (
    <>
      <SlotBackStepper activeStep={3} />

      <div className="page-content">
        {error && <div className="form-error-banner">{error}</div>}
        {!summary && !error && <div className="loading-note">Loading booking summary…</div>}

        {summary && (
          <div className="confirmation-wrap">
            <div className="confirmation-icon">✅</div>
            <h1 className="confirmation-title">Slot Successfully Filled!</h1>
            <p className="confirmation-subtitle">
              SlotBack sent offers to the top {summary.notified.length} waitlisted patient{summary.notified.length === 1 ? '' : 's'}.
              {winner && <> {winner.name} accepted — the slot is now confirmed.</>}
            </p>

            <FormSectionWrapper
              title="Booking Summary"
              icon="🏥"
              subtitle="What happened in the last 60 seconds"
              success
            >
              <div className="confirmation-detail">
                <div className="confirmation-detail-item">
                  <span className="confirmation-detail-icon">📨</span>
                  <span>
                    Offers sent to <strong>{joinNames(summary.notified)}</strong>
                  </span>
                </div>
                {winner && (
                  <div className="confirmation-detail-item">
                    <span className="confirmation-detail-icon">✅</span>
                    <span>
                      <strong>{winner.name}</strong> accepted — slot confirmed with{' '}
                      <strong>{slot.practitioner_name}</strong> at <strong>{slot.time_slot}</strong>
                      {' '}(was waiting <strong>{winner.days_waited} days</strong>)
                    </span>
                  </div>
                )}
                {summary.cancelled_offers.length > 0 && (
                  <div className="confirmation-detail-item">
                    <span className="confirmation-detail-icon">🚫</span>
                    <span>
                      Remaining offers to {joinNames(summary.cancelled_offers)} cancelled automatically — no double booking possible
                    </span>
                  </div>
                )}
                {summary.next_in_line && (
                  <div className="confirmation-detail-item">
                    <span className="confirmation-detail-icon">📊</span>
                    <span>
                      Waitlist updated — {summary.next_in_line} now moves to position #1 for the next available slot
                    </span>
                  </div>
                )}
              </div>
            </FormSectionWrapper>

            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '32px',
              width: '100%',
              maxWidth: '480px',
            }}>
              {[
                { value: summary.time_to_fill || '—', label: 'Time to fill slot' },
                { value: String(summary.notified.length), label: 'Patients notified' },
                { value: '0', label: 'Phone calls made' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: '#FFFFFF',
                  border: '1px solid #D0E4E4',
                  borderRadius: '8px',
                  padding: '16px 24px',
                  textAlign: 'center',
                  flex: '1',
                  minWidth: '120px',
                }}>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#1B6B6B' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#636E72', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <AppButton
              label="← Back to Dashboard"
              onClick={handleBack}
              variant="secondary"
            />
          </div>
        )}
      </div>
    </>
  )
}
