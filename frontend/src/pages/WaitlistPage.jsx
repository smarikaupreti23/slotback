import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AppButton from '../components/AppButton'
import FormSectionWrapper from '../components/FormSectionWrapper'
import InputField from '../components/InputField'
import SlotBackStepper from '../components/SlotBackStepper'
import { api } from '../lib/api'

// WaitlistPage — Screen 3
// Shows the ranked waitlist (longest wait first), loaded from Supabase.
// Sending offers saves the offers to the database, updates each row's status
// badge live, then the first reply is recorded and the booking is confirmed.

const SERVICES = ['Physio', 'Podiatry', 'Chiro', 'Speech Pathology']

export default function WaitlistPage() {
  const navigate = useNavigate()
  const cancellationId = sessionStorage.getItem('cancellationId')

  const [cancelledSlot, setCancelledSlot] = useState(null)
  const [patients, setPatients]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [pageError, setPageError] = useState('')
  const [offerSent, setOfferSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const [newPatient, setNewPatient] = useState({ name: '', phone: '', service: 'Physio' })
  const [addErrors, setAddErrors]   = useState({ name: '', phone: '' })
  const [addSuccess, setAddSuccess] = useState('')
  const [addServerError, setAddServerError] = useState('')
  const [isAdding, setIsAdding]     = useState(false)

  useEffect(() => {
    if (!cancellationId) return
    Promise.all([api.getCancellation(cancellationId), api.getWaitlist()])
      .then(([slot, list]) => {
        setCancelledSlot(slot)
        setPatients(list)
        if (slot.status === 'Offers Sent') setOfferSent(true)
      })
      .catch(err => setPageError(err.message))
      .finally(() => setLoading(false))
  }, [cancellationId])

  if (!cancellationId) return <Navigate to="/cancel" replace />

  function handlePatientChange(field) {
    return (e) => {
      setNewPatient(prev => ({ ...prev, [field]: e.target.value }))
      if (addErrors[field]) setAddErrors(prev => ({ ...prev, [field]: '' }))
      if (addServerError) setAddServerError('')
    }
  }

  async function handleAddPatient() {
    const errs = {}
    if (!newPatient.name.trim())  errs.name  = 'Patient name is required'
    if (!newPatient.phone.trim()) errs.phone = 'Phone number is required'

    if (Object.keys(errs).length) {
      setAddErrors(errs)
      return
    }

    setIsAdding(true)
    setAddServerError('')
    try {
      const added = await api.addPatient({
        name: newPatient.name.trim(),
        phone: newPatient.phone.trim(),
        service: newPatient.service,
      })
      setPatients(await api.getWaitlist())
      setNewPatient({ name: '', phone: '', service: 'Physio' })
      setAddSuccess(`${added.name} added to the waitlist.`)
      setTimeout(() => setAddSuccess(''), 3000)
    } catch (err) {
      setAddServerError(err.message)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleSendOffers() {
    setIsSending(true)
    setPageError('')
    try {
      // Saves the offers and marks the top 3 as "Offer Sent" in Supabase
      const result = await api.sendOffers(cancellationId)
      if (result.waitlist) {
        setPatients(result.waitlist)
      } else {
        setPatients(await api.getWaitlist())
      }
      setOfferSent(true)

      // Brief delay so the coordinator sees the badges change, then the first
      // patient's (simulated) "YES" reply is recorded and the slot is confirmed.
      await new Promise(resolve => setTimeout(resolve, 1800))
      await api.acceptFirstOffer(cancellationId)
      navigate('/confirmed')
    } catch (err) {
      setPageError(err.message)
      setIsSending(false)
    }
  }

  const top3Names = patients.slice(0, 3).map(p => p.name.split(' ')[0]).join(', ')

  function statusBadgeClass(status) {
    if (status === 'Offer Sent') return 'status-badge status-badge--sent'
    if (status === 'Confirmed')  return 'status-badge status-badge--confirmed'
    return 'status-badge status-badge--pending'
  }

  return (
    <>
      <SlotBackStepper activeStep={2} />

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Manage Waitlist</h1>
          {cancelledSlot && (
            <p className="page-subtitle">
              Cancelled slot: <strong>{cancelledSlot.practitioner_name}</strong> — {cancelledSlot.appointment_date} at {cancelledSlot.time_slot}
            </p>
          )}
        </div>

        {pageError && <div className="form-error-banner">{pageError}</div>}

        {offerSent && (
          <div className="offer-banner">
            <span>📨</span>
            <span>Offers sent to <strong>{top3Names}</strong> — waiting for first response…</span>
          </div>
        )}

        <FormSectionWrapper
          title="Waitlisted Patients"
          subtitle="Sorted by waiting time — longest wait first"
          icon="👥"
        >
          {loading ? (
            <div className="loading-note">Loading waitlist…</div>
          ) : patients.length === 0 ? (
            <div className="loading-note">The waitlist is empty. Add a patient below.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="waitlist-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Patient Name</th>
                    <th>Phone</th>
                    <th>Service</th>
                    <th>Waiting</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient, index) => (
                    <tr key={patient.id}>
                      <td>
                        <span style={{
                          fontWeight: '700',
                          color: index < 3 ? '#1B6B6B' : '#9AAAAA',
                          fontSize: '13px',
                        }}>
                          #{index + 1}
                          {index < 3 && <span style={{ fontSize: '10px', marginLeft: '4px' }}>●</span>}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500' }}>{patient.name}</td>
                      <td style={{ color: '#636E72' }}>{patient.phone}</td>
                      <td>{patient.service}</td>
                      <td>
                        <span style={{ fontWeight: '600', color: patient.days_waiting > 14 ? '#C47B2B' : '#2D3436' }}>
                          {patient.days_waiting > 0 ? `${patient.days_waiting} days` : 'New'}
                        </span>
                      </td>
                      <td>
                        <span className={statusBadgeClass(patient.status)}>
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p style={{ fontSize: '12px', color: '#9AAAAA', marginTop: '12px' }}>
            ● Highlighted rows will receive offers (top 3 by waiting time)
          </p>
        </FormSectionWrapper>

        <FormSectionWrapper
          title="Add Patient to Waitlist"
          icon="➕"
          subtitle="Manually add a patient who requested to be waitlisted"
        >
          {addSuccess && (
            <div style={{
              background: '#E6F5EF',
              border: '1px solid #A3D9C8',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#0A5A40',
              marginBottom: '16px',
            }}>
              ✓ {addSuccess}
            </div>
          )}
          {addServerError && <div className="form-error-banner">{addServerError}</div>}

          <div className="form-row">
            <InputField
              label="Patient Name"
              value={newPatient.name}
              onChange={handlePatientChange('name')}
              placeholder="First and last name"
              error={addErrors.name}
              required
            />
            <InputField
              label="Mobile Number"
              value={newPatient.phone}
              onChange={handlePatientChange('phone')}
              placeholder="04XX XXX XXX"
              error={addErrors.phone}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }} className="select-wrapper">
            <label>Service Type</label>
            <select
              value={newPatient.service}
              onChange={e => setNewPatient(prev => ({ ...prev, service: e.target.value }))}
            >
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <AppButton
            label={isAdding ? 'Adding…' : 'Add to Waitlist'}
            onClick={handleAddPatient}
            variant="secondary"
            disabled={isAdding}
          />
        </FormSectionWrapper>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <AppButton
            label={isSending ? 'Sending Offers…' : '📨 Send Offers to Top 3'}
            onClick={handleSendOffers}
            variant="primary"
            disabled={isSending || loading || patients.length === 0}
          />
        </div>
      </div>
    </>
  )
}
