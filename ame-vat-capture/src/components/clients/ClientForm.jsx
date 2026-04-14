import { useEffect, useState } from 'react';
import {
  VAT_CATEGORIES,
  vatNumberError,
  phoneError,
  emailError,
  isValidRegistrationNumber,
  formatPhoneForDisplay
} from '../../utils/validation.js';

const EMPTY = {
  businessName: '',
  tradingName: '',
  vatNumber: '',
  registrationNumber: '',
  contactPerson: '',
  phone: '',
  email: '',
  whatsappNumber: '',
  vatCategory: 'B',
  isActive: true
};

function validate(values) {
  const errors = {};
  if (!values.businessName.trim()) errors.businessName = 'Business name is required';
  if (!values.contactPerson.trim()) errors.contactPerson = 'Contact person is required';

  const vatErr = vatNumberError(values.vatNumber);
  if (vatErr) errors.vatNumber = vatErr;

  if (values.registrationNumber && !isValidRegistrationNumber(values.registrationNumber)) {
    errors.registrationNumber = 'Registration number must be 12 digits (YYYY/NNNNNN/NN)';
  }

  const phoneErr = phoneError(values.phone);
  if (phoneErr) errors.phone = phoneErr;

  const emailErr = emailError(values.email);
  if (emailErr) errors.email = emailErr;

  if (values.whatsappNumber) {
    const waErr = phoneError(values.whatsappNumber);
    if (waErr) errors.whatsappNumber = waErr;
  }

  return errors;
}

export default function ClientForm({ open, initialValues, onSubmit, onClose, submitting }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, ...(initialValues || {}) });
      setErrors({});
      setTouched(false);
    }
  }, [open, initialValues]);

  if (!open) return null;

  const isEdit = Boolean(initialValues && initialValues.id);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched) {
      setErrors(validate({ ...values, [field]: value }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched(true);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(values);
  }

  function copyPhoneToWhatsapp() {
    handleChange('whatsappNumber', values.phone);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink-primary/50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl bg-surface-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-primary">
            {isEdit ? 'Edit client' : 'Add client'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-secondary hover:text-ink-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Business name" required error={errors.businessName}>
              <input
                className="input"
                value={values.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="ACME Trading (Pty) Ltd"
                autoFocus
              />
            </Field>
            <Field label="Trading name" error={errors.tradingName}>
              <input
                className="input"
                value={values.tradingName}
                onChange={(e) => handleChange('tradingName', e.target.value)}
                placeholder="ACME"
              />
            </Field>

            <Field label="VAT number" required error={errors.vatNumber}>
              <input
                className="input"
                value={values.vatNumber}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                placeholder="4123456789"
                inputMode="numeric"
                maxLength={10}
              />
            </Field>
            <Field label="Registration number" error={errors.registrationNumber}>
              <input
                className="input"
                value={values.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="2018/123456/07"
              />
            </Field>

            <Field label="Contact person" required error={errors.contactPerson}>
              <input
                className="input"
                value={values.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Thandi Mokoena"
              />
            </Field>
            <Field label="Email" required error={errors.email}>
              <input
                className="input"
                type="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="accounts@acme.co.za"
              />
            </Field>

            <Field label="Phone" required error={errors.phone}>
              <input
                className="input"
                value={values.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="082 123 4567"
              />
              {values.phone && !errors.phone && (
                <p className="mt-1 text-xs text-ink-secondary">
                  Stored as {formatPhoneForDisplay(values.phone)}
                </p>
              )}
            </Field>
            <Field
              label="WhatsApp number"
              error={errors.whatsappNumber}
              hint={
                <button
                  type="button"
                  onClick={copyPhoneToWhatsapp}
                  className="text-xs font-semibold text-brand-secondary hover:underline"
                >
                  Same as phone
                </button>
              }
            >
              <input
                className="input"
                value={values.whatsappNumber}
                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                placeholder="082 123 4567"
              />
            </Field>

            <Field label="VAT category" required>
              <select
                className="input"
                value={values.vatCategory}
                onChange={(e) => handleChange('vatCategory', e.target.value)}
              >
                {VAT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <label className="mt-2 inline-flex items-center gap-2 text-sm text-ink-primary">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-secondary focus:ring-brand-secondary"
                />
                Active
              </label>
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-primary">
          {label}
          {required && <span className="text-brand-danger"> *</span>}
        </span>
        {hint}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-brand-danger">{error}</p>}
    </label>
  );
}
