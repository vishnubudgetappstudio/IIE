import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // Use 587 for TLS
  secure: false, // Must be false for TLS
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true, // Ensures a secure connection
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  text?: string,
  html?: string
) => {
  try {
    const mailOptions = {
      from: `"IIE" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject,
      text,
      html, // Supports HTML format
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.messageId);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Error sending email: ", error);
    return { success: false, message: "Failed to send email" };
  }
};
