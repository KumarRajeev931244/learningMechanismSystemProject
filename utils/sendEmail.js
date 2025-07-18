import { text } from 'express';
import nodemailer from 'nodemailer';

export const sendEmail = async({email, subject, message}) => {
    try {

            var transport = nodemailer.createTransport({
                host: "sandbox.smtp.mailtrap.io",
                port: 2525,
                auth: {
                user: "1cc653834656e1",
                pass: "674a5489f8ffd3"
                }
            });
          const mailOptions = {
            from: "rajeevkumar25112002@gmail.com",
            to: {email},
            subject: subject || 'reset password',
            text: message || 'click here to reset your password', 
            html: "<b>Hello world?</b>", // HTML body
          }
          const mailResponse = await transport.sendMail(mailOptions)
          return mailResponse
    } catch (error) {
        throw new Error(error.message)
        
    }
}

