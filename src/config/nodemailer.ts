import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { log } from "console";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
  logger: true,
  debug: true,
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    console.log('Sending email to:',process.env.ADMIN_EMAIL);
    // Validate environment variables
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASSWORD) {
      throw new Error('Missing ADMIN_EMAIL or ADMIN_EMAIL_PASSWORD in environment variables');
    }

    // Validate input
    if (!to || !subject) {
      throw new Error('Missing required fields: to and subject are required');
    }

    const mailOptions = {
      from: `"IIE" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      text: text || '', // Fallback to empty string if text is undefined
      html: html || undefined, // Only include html if provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, email: to, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email: ', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { success: false, message: `Failed to send email: ${errorMessage}` };
  }
};
