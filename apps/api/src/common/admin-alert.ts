/** Shared inbox for alerts that have no specific staff recipient. Override with ADMIN_ALERT_EMAIL. */
export function adminAlertEmail(): string {
  return process.env.ADMIN_ALERT_EMAIL || 'hello@mjnhealthcare.com';
}
