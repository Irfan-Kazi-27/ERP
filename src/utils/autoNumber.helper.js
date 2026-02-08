/**
 * Auto-number generator helper for Lead, Quotation, and Order
 * Format: PREFIX-YYYY-XXX (e.g., LEAD-2026-001, QUO-2026-001, ORD-2026-001)
 */

import { Lead } from "../models/leads.models.js";
import { Quotation } from "../models/quotation.models.js";
import { Order } from "../models/order.model.js";

/**
 * Generate next number for a given model and prefix
 * @param {Model} Model - Mongoose model
 * @param {string} prefix - Prefix for the number (LEAD, QUO, ORD)
 * @param {string} fieldName - Field name to search (leadNo, quotationNo, orderNo)
 * @returns {Promise<string>} - Generated number
 */
const generateAutoNumber = async (Model, prefix, fieldName) => {
    const currentYear = new Date().getFullYear();
    const searchPattern = `${prefix}-${currentYear}-`;

    // Find the last document with the current year pattern
    const lastDoc = await Model.findOne({
        [fieldName]: { $regex: `^${searchPattern}` }
    })
        .sort({ [fieldName]: -1 })
        .select(fieldName);

    let nextNumber = 1;

    if (lastDoc) {
        // Extract the number part from the last document
        const lastNumber = lastDoc[fieldName].split('-')[2];
        nextNumber = parseInt(lastNumber) + 1;
    }

    // Format the number with leading zeros (3 digits)
    const formattedNumber = String(nextNumber).padStart(3, '0');

    return `${prefix}-${currentYear}-${formattedNumber}`;
};

/**
 * Generate Lead Number
 * @returns {Promise<string>} - Lead number (e.g., LEAD-2026-001)
 */
export const generateLeadNumber = async () => {
    return await generateAutoNumber(Lead, 'LEAD', 'leadNo');
};

/**
 * Generate Quotation Number
 * @returns {Promise<string>} - Quotation number (e.g., QUO-2026-001)
 */
export const generateQuotationNumber = async () => {
    return await generateAutoNumber(Quotation, 'QUO', 'quotationNo');
};

/**
 * Generate Order Number
 * @returns {Promise<string>} - Order number (e.g., ORD-2026-001)
 */
export const generateOrderNumber = async () => {
    return await generateAutoNumber(Order, 'ORD', 'orderNo');
};
