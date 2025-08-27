import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user:"laundrproject@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD!,
  },
  tls: {
    rejectUnauthorized: false
  }
});
