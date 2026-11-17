/**
 * Email Service Client
 * Connects to the local/deployed email-service for sending emails
 */

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:5000'
const EMAIL_SERVICE_API_KEY = process.env.EMAIL_SERVICE_API_KEY || ''

export interface SendEmailParams {
  to: string | string[]
  template: string
  data: Record<string, unknown>
  subject?: string // Optional override
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using the email service
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (process.env.EMAIL_DELIVERY_ENABLED !== 'true') return { success: false, error: 'Email delivery disabled' }
  if (!EMAIL_SERVICE_API_KEY) {
    console.warn('EMAIL_SERVICE_API_KEY not configured, skipping email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/api/send`, {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EMAIL_SERVICE_API_KEY,
      },
      body: JSON.stringify({
        to: params.to,
        template: params.template,
        data: params.data,
        ...(params.subject && { subject: params.subject }),
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      console.error('Email service error:', result.error || result.message)
      return { success: false, error: result.error || 'Failed to send email' }
    }

    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error) {
    console.error('Email client error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Send emails to multiple recipients (batch)
 */
export async function sendEmailBatch(
  recipients: Array<{ email: string; data: Record<string, unknown> }>,
  template: string
): Promise<{ success: boolean; sent: number; failed: number; errors: string[]; sentTo: string[] }> {
  const outcomes = await Promise.all(recipients.map(async recipient => ({ email: recipient.email, ...await sendEmail({ to: recipient.email, template, data: recipient.data }) })))
  const sentTo = outcomes.filter(r => r.success).map(r => r.email)
  const errors = outcomes.filter(r => !r.success).map(r => `${r.email}: ${r.error}`)
  return { success: errors.length === 0, sent: sentTo.length, failed: errors.length, errors, sentTo }
}

/**
 * Check if email service is available
 */
export async function checkEmailServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/api/health`)
    const data = await response.json()
    return data.status === 'ok'
  } catch {
    return false
  }
}
