import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App Password if using Gmail
  },
})

export const sendMagicLinkEmail = async (toEmail: string, magicLink: string) => {
  const fromName = process.env.EMAIL_FROM_NAME || 'Inventory Management System'

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your Sign-In Link for Inventory Management System',
    // PLAIN TEXT FALLBACK (Crucial for passing spam filters)
    text: `Hello,\n\nYou requested a sign-in link for the Inventory Management System.\n\nPlease copy and paste the following link into your browser to log in:\n${magicLink}\n\nIf you did not request this link, you can safely ignore this email.\n\nThank you,\nInventory Management System`,
    // HTML VERSION
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
          Inventory Management System
        </h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
          Hello, a request was received to sign in to your account. Click the button below to complete your authentication.
        </p>
        <div style="margin: 28px 0;">
          <a href="${magicLink}" 
             style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            Sign In to Account
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
          If the button above does not work, copy and paste this link into your web browser:<br/>
          <a href="${magicLink}" style="color: #2563eb; word-break: break-all;">${magicLink}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
          If you did not request this email, no further action is required.
        </p>
      </div>
    `,
  })
}

export const sendNotificationEmail = async (toEmail: string, subject: string, message: string) => {
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `[Notification] ${subject}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #111;">
        <h3>${subject}</h3>
        <p style="font-size: 14px; line-height: 1.5;">${message}</p>
      </div>
    `,
  })
}
