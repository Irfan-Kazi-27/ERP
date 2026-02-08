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

        if (lead.status !== "QUALIFIED") {
            throw new ApiError(400, `Cannot create quotation. Lead must be QUALIFIED. Current status: ${lead.status}`);
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
            salesPersonId: lead.assignedTo, // Use lead's assigned staff
            quotationItems,
            additionalCharges: quotationData.additionalCharges || [],
            discount: quotationData.discount,
            tax: quotationData.tax,
            totalAmount,
            notes: quotationData.notes,
            validTill: quotationData.validTill,
            status: "CREATED"
        });

        // Update lead status to QUOTATION_SENT
        lead.status = "QUOTATION_SENT";
        await lead.save();

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
            .populate({
                path: 'leadId',
                populate: {
                    path: 'customer',
                    model: 'Party'
                }
            })
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit');

        if (!quotation) {
            throw new ApiError(404, "Quotation not found");
        }

        if (quotation.status !== "CREATED") {
            throw new ApiError(400, `Quotation already sent. Current status: ${quotation.status}`);
        }

        // Send email
        const clientEmail = quotation.leadId?.customer?.email;
        if (!clientEmail) {
            throw new ApiError(400, "Customer email not found. Please ensure the customer associated with this lead has a valid email address.");
        }

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
// ... (previous imports)

/**
 * Get quotation by ID
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} - Quotation details
 */
export const getQuotationById = async (quotationId) => {
    try {
        const quotation = await Quotation.findById(quotationId)
            .populate({
                path: 'leadId',
                populate: {
                    path: 'customer',
                    model: 'Party'
                }
            })
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
 * Update quotation details
 * @param {string} quotationId - Quotation ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated quotation
 */
export const updateQuotation = async (quotationId, updateData) => {
    try {
        const quotation = await Quotation.findById(quotationId);
        if (!quotation) {
            throw new ApiError(404, "Quotation not found");
        }

        if (quotation.status !== "CREATED" && quotation.status !== "DRAFT") {
            throw new ApiError(400, `Cannot update quotation. Current status: ${quotation.status}`);
        }

        // Recalculate totals if items or charges change
        let subtotal = 0;
        const quotationItems = updateData.quotationItems ? updateData.quotationItems.map(item => {
            const total = item.quantity * item.UnitPrice;
            subtotal += total;
            return {
                ...item,
                Total: total
            };
        }) : quotation.quotationItems;

        // If items didn't change but we need subtotal for other calcs, recalculate from existing
        if (!updateData.quotationItems) {
            quotation.quotationItems.forEach(item => {
                subtotal += item.Total;
            });
        }

        // Calculate additional charges
        let additionalChargesTotal = 0;
        const additionalCharges = updateData.additionalCharges || quotation.additionalCharges;
        if (additionalCharges && additionalCharges.length > 0) {
            additionalCharges.forEach(charge => {
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
        const discount = updateData.discount || quotation.discount;
        if (discount) {
            if (discount.type === "Fixed") {
                discountAmount = discount.value;
            } else {
                discountAmount = (subtotal * discount.value) / 100;
            }
            discount.amount = discountAmount;
        }

        // Calculate tax
        let taxAmount = 0;
        const amountBeforeTax = subtotal + additionalChargesTotal - discountAmount;
        const tax = updateData.tax || quotation.tax;
        if (tax) {
            taxAmount = (amountBeforeTax * tax.percentage) / 100;
            tax.amount = taxAmount;
        }

        // Calculate total amount
        const totalAmount = amountBeforeTax + taxAmount;

        // Update fields
        quotation.quotationItems = quotationItems;
        quotation.additionalCharges = additionalCharges;
        quotation.discount = discount;
        quotation.tax = tax;
        quotation.totalAmount = totalAmount;
        if (updateData.notes) quotation.notes = updateData.notes;
        if (updateData.validTill) quotation.validTill = updateData.validTill;
        if (updateData.leadId) quotation.leadId = updateData.leadId; // Should rarely change but possible

        await quotation.save();

        return await Quotation.findById(quotation._id)
            .populate({
                path: 'leadId',
                populate: {
                    path: 'customer',
                    model: 'Party'
                }
            })
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating quotation: ${error.message}`);
    }
};

/**
 * Update quotation status
 // ... (rest of file)
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
                status: "QUOTATION_SENT"
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
/**
 * Get all quotations with filters
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Object>} - Quotations list
 */
export const getAllQuotations = async (filters = {}, pagination = {}, userId, userRole) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        let query = {};

        // Role-based filtering
        if (userRole === "STAFF") {
            query.salesPersonId = userId;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        const quotations = await Quotation.find(query)
            .populate({
                path: 'leadId',
                populate: {
                    path: 'customer',
                    model: 'Party'
                }
            })
            .populate('salesPersonId', 'name email')
            .populate('quotationItems.itemId', 'name description unit')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Quotation.countDocuments(query);

        return {
            quotations,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        };
    } catch (error) {
        throw new ApiError(500, `Error fetching quotations: ${error.message}`);
    }
};
