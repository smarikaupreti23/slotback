import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppButton from '../components/AppButton'
import FormSectionWrapper from '../components/FormSectionWrapper'
import InputField from '../components/InputField'
import SlotBackStepper from '../components/SlotBackStepper'
import { api, clearSession } from '../lib/api'

// CancelSlotPage — Screen 2
// The coordinator records a cancellation. All five fields are required.
// On submit the cancellation is saved to Supabase (via the backend) and its id
// is kept in sessionStorage so the next screens can load it.

const TODAY = new Date().toISOString().split('T')[0]

export default function CancelSlotPage() {
  const navigate = useNavigate()

  const [options, setOptions] = useState({ practitioners: [], time_slots: [] })
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    practitioner: '',
    date: TODAY,
    timeSlot: '',
    patientName: '',
    reason: '',
  })

  const [errors, setErrors] = useState({
    practitioner: '',
    date: '',
    timeSlot: '',
    patientName: '',
    reason: '',
  })

  useEffect(() => {
    api.getConfig().then(setOptions).catch(err => setLoadError(err.message))
  }, [])

  function handleChange(field) {
    return (e) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
      if (submitError) setSubmitError('')
    }
  }

  async function handleSubmit() {
    const newErrors = {}

    if (!formData.practitioner) newErrors.practitioner = 'Please select a practitioner'
    if (!formData.date)         newErrors.date         = 'Date is required'
    if (!formData.timeSlot)     newErrors.timeSlot     = 'Please select a time slot'
    if (!formData.patientName.trim()) newErrors.patientName = 'Patient name is required'
    if (!formData.reason.trim()) newErrors.reason      = 'Please enter a cancellation reason'

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      return
    }

    setSaving(true)
    setSubmitError('')
    try {
      const cancellation = await api.createCancellation({
        practitioner_id:  formData.practitioner,
        appointment_date: formData.date,
        time_slot:        formData.timeSlot,
        patient_name:     formData.patientName.trim(),
        reason:           formData.reason.trim(),
      })
      sessionStorage.setItem('cancellationId', cancellation.id)
      navigate('/waitlist')
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleSignOut() {
    clearSession()
    navigate('/login')
  }

  return (
    <>
      <SlotBackStepper activeStep={1} />

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Mark Cancellation</h1>
          <p className="page-subtitle">
            Fill in the details of the appointment that has been cancelled.
          </p>
        </div>

        {loadError && <div className="form-error-banner">{loadError}</div>}
        {submitError && <div className="form-error-banner">{submitError}</div>}

        <FormSectionWrapper
          title="Cancelled Appointment Details"
          icon="📅"
          subtitle="Select the practitioner, date, and time slot"
        >
          <div className="form-row">
            <div className="select-wrapper">
              <label>
                Practitioner <span style={{ color: '#D63031' }}>*</span>
              </label>
              <select
                value={formData.practitioner}
                onChange={handleChange('practitioner')}
                className={errors.practitioner ? 'error' : ''}
              >
                <option value="">Select practitioner…</option>
                {options.practitioners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.practitioner && (
                <p className="select-error">{errors.practitioner}</p>
              )}
            </div>

            <InputField
              label="Appointment Date"
              type="date"
              value={formData.date}
              onChange={handleChange('date')}
              error={errors.date}
              required
            />
          </div>

          <div className="select-wrapper">
            <label>
              Time Slot <span style={{ color: '#D63031' }}>*</span>
            </label>
            <select
              value={formData.timeSlot}
              onChange={handleChange('timeSlot')}
              className={errors.timeSlot ? 'error' : ''}
            >
              <option value="">Select time slot…</option>
              {options.time_slots.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.timeSlot && (
              <p className="select-error">{errors.timeSlot}</p>
            )}
          </div>
        </FormSectionWrapper>

        <FormSectionWrapper
          title="Cancellation Details"
          icon="📝"
          subtitle="Who cancelled and why"
        >
          <InputField
            label="Cancelling Patient Name"
            value={formData.patientName}
            onChange={handleChange('patientName')}
            placeholder="e.g. Tom Richardson"
            error={errors.patientName}
            required
          />

          <InputField
            label="Cancellation Reason"
            value={formData.reason}
            onChange={handleChange('reason')}
            placeholder="e.g. Work conflict, family emergency…"
            error={errors.reason}
            required
            helpText="This is for internal records only, not shared with waitlisted patients."
          />
        </FormSectionWrapper>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <AppButton label="Sign Out" onClick={handleSignOut} variant="secondary" />
          <AppButton
            label={saving ? 'Saving…' : 'Mark as Cancelled & Find Waitlist →'}
            onClick={handleSubmit}
            variant="primary"
            disabled={saving}
          />
        </div>
      </div>
    </>
  )
}
