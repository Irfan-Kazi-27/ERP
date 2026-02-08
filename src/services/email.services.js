import nodemailer from "nodemailer";
import { EmailLog } from "../models/emailLog.models.js";

// Create transporter (configure with your email service)
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * Send quotation email to client
 * @param {Object} quotation - Quotation object with populated data
 * @param {string} clientEmail - Client email address
 * @param {Array} ccEmails - Array of CC email addresses
 * @returns {Promise<Object>} - Email send result
 */
export const sendQuotationEmail = async (quotation, clientEmail, ccEmails = []) => {
    try {
        const transporter = createTransporter();

        // Prepare email content
        const subject = `Quotation ${quotation.quotationNo} - ${quotation.leadId.customer.companyName}`;

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Quotation Details</h2>
        <p>Dear ${quotation.leadId.customer.name},</p>
        <p>Please find below the quotation details for your inquiry:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Quotation No:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${quotation.quotationNo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(quotation.quotationDate).toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Valid Till:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${new Date(quotation.validTill).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>₹${quotation.totalAmount.toFixed(2)}</strong></td>
          </tr>
        </table>

        <h3 style="color: #333;">Items:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #333; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd;">Item</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Quantity</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.quotationItems.map((item, index) => `
              <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
                <td style="padding: 10px; border: 1px solid #ddd;">${item.itemId.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">₹${item.UnitPrice.toFixed(2)}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">₹${item.Total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${quotation.notes ? `<p><strong>Notes:</strong> ${quotation.notes}</p>` : ''}

        <p style="margin-top: 30px;">Thank you for your interest in our products.</p>
        <p>Best regards,<br>Sales Team</p>
      </div>
    `;

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: clientEmail,
            cc: ccEmails.length > 0 ? ccEmails.join(',') : undefined,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);

        // Log email
        await logEmail({
            emailType: "QUOTATION",
            recipient: clientEmail,
            cc: ccEmails,
            subject: subject,
            body: htmlContent,
            status: "SENT",
            relatedTo: {
                model: "Quotation",
                id: quotation._id
            }
        });

        return {
            success: true,
            messageId: info.messageId,
            sentTo: clientEmail,
            cc: ccEmails
        };

    } catch (error) {
        // Log failed email
        await logEmail({
            emailType: "QUOTATION",
            recipient: clientEmail,
            cc: ccEmails,
            subject: `Quotation ${quotation.quotationNo}`,
            status: "FAILED",
            relatedTo: {
                model: "Quotation",
                id: quotation._id
            },
            error: error.message
        });

        throw error;
    }
};

/**
 * Log email to database
 * @param {Object} emailData - Email data to log
 * @returns {Promise<Object>} - Created email log
 */
export const logEmail = async (emailData) => {
    try {
        const emailLog = await EmailLog.create(emailData);
        return emailLog;
    } catch (error) {
        console.error("Error logging email:", error);
        // Don't throw error, just log it
        return null;
    }
};
