import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendMessage = (subject, message, sender, recipient) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PW,
    },
  });

  const mailOptions = {
    from: sender || process.env.EMAIL_USER,
    to: recipient.join(', ') || process.env.EMAIL_USER,
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

export default sendMessage;
