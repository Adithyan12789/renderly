import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../config/env.js'

let transporter: Transporter | null = null

function getTransporter() {
  if (!transporter) {
    const user = env.EMAIL_USER.trim()
    // Remove all spaces from Gmail App Password e.g. "iyxv lgjs znvl uocz" -> "iyxvlgjsznvluocz"
    const pass = env.EMAIL_PASS.replace(/\s+/g, '')

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    })
  }
  return transporter
}

export async function sendAdminRecoveryEmail(targetEmail: string, passcode: string): Promise<boolean> {
  const mailer = getTransporter()

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Renderly Control Plane - Master Passcode Recovery</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #08080a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e5e5;">
        <div style="max-width: 560px; margin: 40px auto; background-color: #121215; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Top Accent Bar -->
          <div style="height: 4px; background: linear-gradient(90deg, #10b981, #06b6d4, #f59e0b);"></div>
          
          <div style="padding: 32px 32px 40px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <div style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; width: 40px; height: 40px; line-height: 40px; text-align: center; color: #10b981; font-weight: bold; font-size: 20px;">
                🛡️
              </div>
              <div style="margin-left: 12px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">Renderly Control Plane</h2>
                <p style="margin: 2px 0 0; font-size: 11px; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.05em;">Security & Telemetry Dispatch</p>
              </div>
            </div>

            <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 8px;">
              Admin Master Passcode Recovery
            </h1>
            <p style="font-size: 13px; line-height: 1.6; color: #a3a3a3; margin-bottom: 24px;">
              You requested master access recovery for the Renderly Administrative Terminal. Use the confidential code below to unlock the system:
            </p>

            <!-- Passcode Display Box -->
            <div style="background-color: #08080a; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #10b981; font-weight: 600; margin-bottom: 8px;">
                Master Security Passcode
              </span>
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #ffffff; text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);">
                ${passcode}
              </span>
            </div>

            <p style="font-size: 12px; line-height: 1.6; color: #737373; margin-bottom: 24px;">
              ⚠️ <strong style="color: #d4d4d4;">Confidentiality Notice:</strong> This code grants full administrative control over all user accounts, renders, subscriptions, and database assets. Do not share or expose this code.
            </p>

            <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; font-size: 11px; color: #525252; text-align: center;">
              Dispatched at ${new Date().toUTCString()} to ${targetEmail}<br/>
              Renderly Architecture &amp; Visualization Systems
            </div>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const info = await mailer.sendMail({
      from: `"Renderly Security" <${env.EMAIL_USER.trim()}>`,
      to: targetEmail,
      subject: '🔑 Renderly Admin Master Passcode Recovery',
      html,
    })
    console.log(`[Admin Mailer] Passcode recovery email dispatched to ${targetEmail} (MessageId: ${info.messageId})`)
    return true
  } catch (error) {
    console.error('[Admin Mailer] Failed to send recovery email:', error)
    throw error
  }
}
