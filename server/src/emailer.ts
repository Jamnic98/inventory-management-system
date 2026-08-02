import nodemailer from 'nodemailer'

const sendMessage = (subject: string, message: string, recipients: string[]) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PW,
    },
  })

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients.join(', '),
    subject: subject,
    html: message,
  }

  transporter.sendMail(mailOptions, (error, _info) => {
    if (error) {
      console.error(error)
    }
  })
}

export default sendMessage
