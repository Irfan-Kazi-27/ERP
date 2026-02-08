import { Quotation } from "../models/quotation.models.js";
import { Lead } from "../models/leads.models.js";
import { generateQuotationNumber } from "../utils/autoNumber.helper.js";
import { sendQuotationEmail } from "./email.services.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create quotation for a lead
 * @param {string} leadId - Lead ID
 * @param {Object} quotationData - Quotation data
 * @param {string} salesPersonId - Sales person ID
 * @returns {Promise<Object>} - Created quotation
 */
export const createQuotation = async (leadId, quotationData, salesPersonId) => {
    try {
        // Verify lead exists and is assigned to sales person
        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        if (lead.status !== "ASSIGNED" && lead.status !== "FOLLOW_UP") {
            throw new ApiError(400, `Cannot create quotation. Lead status: ${lead.status}`);
        }

        // Generate quotation number
        const quotationNo = await generateQuotationNumber();

        // Calculate totals
        let subtotal = 0;
        const quotationItems = quotationData.quotationItems.map(item => {
            const total = item.quantity * item.UnitPrice;
            subtotal += total;
            return {
                ...item,
                Total: total
            };
        });

        // Calculate additional charges
        let additionalChargesTotal = 0;
        if (quotationData.additionalCharges && quotationData.additionalCharges.length > 0) {
            quotationData.additionalCharges.forEach(charge => {
                if (charge.type === "Fixed") {
                    charge.amount = charge.value;
                } else {
                    charge.amount = (subtotal * charge.value) / 100;
                }
                additionalChargesTotal += charge.amount;
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (quotationData.discount) {
            if (quotationData.discount.type === "Fixed") {
                discountAmount = quotationData.discount.value;
            } else {
                discountAmount = (subtotal * quotationData.discount.value) / 100;
            }
            quotationData.discount.amount = discountAmount;
        }

        // Calculate tax
        let taxAmount = 0;
        const amountBeforeTax = subtotal + additionalChargesTotal - discountAmount;
        if (quotationData.tax) {
            taxAmount = (amountBeforeTax * quotationData.tax.percentage) / 100;
            quotationData.tax.amount = taxAmount;
        }

        // Calculate total amount
        const totalAmount = amountBeforeTax + taxAmount;

        // Create quotation
        const quotation = await Quotation.create({
            leadId,
            quotationNo,
            salesPersonId,
            quotationItems,
            additionalCharges: quotationData.additionalCharges || [],
            discount: quotationData.discount,
            tax: quotationData.tax,
            totalAmount,
            notes: quotationData.notes,
            validTill: quotationData.validTill,
            status: "CREATED"
        });

        return await Quotation.findById(quotation._id)
            .populate('leadId')
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error creating quotation: ${error.message}`);
    }
};

/**
 * Send quotation email to client
 * @param {string} quotationId - Quotation ID
 * @param {Array} ccEmails - CC email addresses
 * @returns {Promise<Object>} - Updated quotation
 */
export const sendQuotation = async (quotationId, ccEmails = []) => {
    try {
        const quotation = await Quotation.findById(quotationId)
            .populate('leadId')
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit');

        if (!quotation) {
            throw new ApiError(404, "Quotation not found");
        }

        if (quotation.status !== "CREATED") {
            throw new ApiError(400, `Quotation already sent. Current status: ${quotation.status}`);
        }

        // Send email
        const clientEmail = quotation.leadId.customer.email;
        await sendQuotationEmail(quotation, clientEmail, ccEmails);

        // Update quotation status
        quotation.status = "SENT";
        quotation.emailSentAt = new Date();
        quotation.emailSentTo = clientEmail;
        await quotation.save();

        // Update lead status
        await Lead.findByIdAndUpdate(quotation.leadId._id, {
            status: "FOLLOW_UP"
        });

        return quotation;

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error sending quotation: ${error.message}`);
    }
};

/**
 * Get quotation by ID
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} - Quotation details
 */
export const getQuotationById = async (quotationId) => {
    try {
        const quotation = await Quotation.findById(quotationId)
            .populate('leadId')
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit');

        if (!quotation) {
            throw new ApiError(404, "Quotation not found");
        }

        return quotation;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error fetching quotation: ${error.message}`);
    }
};

/**
 * Get all quotations for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Array>} - List of quotations
 */
export const getQuotationsByLead = async (leadId) => {
    try {
        const quotations = await Quotation.find({ leadId })
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit')
            .sort({ createdAt: -1 });

        return quotations;
    } catch (error) {
        throw new ApiError(500, `Error fetching quotations: ${error.message}`);
    }
};

/**
 * Update quotation status
 * @param {string} quotationId - Quotation ID
 * @param {string} status - New status (APPROVED, REJECTED)
 * @returns {Promise<Object>} - Updated quotation
 */
export const updateQuotationStatus = async (quotationId, status) => {
    try {
        if (!["APPROVED", "REJECTED"].includes(status)) {
            throw new ApiError(400, "Invalid status. Must be APPROVED or REJECTED");
        }

        const quotation = await Quotation.findById(quotationId);
        if (!quotation) {
            throw new ApiError(404, "Quotation not found");
        }

        if (quotation.status !== "SENT") {
            throw new ApiError(400, `Cannot update status. Current status: ${quotation.status}`);
        }

        quotation.status = status;
        await quotation.save();

        // Update lead status
        if (status === "APPROVED") {
            await Lead.findByIdAndUpdate(quotation.leadId, {
                status: "APPROVED_BY_CLIENT"
            });
        }

        return await Quotation.findById(quotationId)
            .populate('leadId')
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating quotation status: ${error.message}`);
    }
};
