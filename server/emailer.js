import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendMessage = (subject, message, recipients) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PW,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients.join(', '),
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    }
  });
};

export default sendMessage;
