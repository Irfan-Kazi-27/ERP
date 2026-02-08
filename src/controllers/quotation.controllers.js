import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as quotationService from "../services/quotation.services.js";

/**
 * Create quotation
 * POST /api/quotations
 */
export const createQuotation = asyncHandler(async (req, res) => {
    const { leadId, quotationItems, additionalCharges, discount, tax, notes, validTill } = req.body;

    // Validation
    if (!leadId) {
        throw new ApiError(400, "Lead ID is required");
    }

    if (!quotationItems || quotationItems.length === 0) {
        throw new ApiError(400, "At least one quotation item is required");
    }

    if (!validTill) {
        throw new ApiError(400, "Valid till date is required");
    }

    const quotationData = {
        quotationItems,
        additionalCharges,
        discount,
        tax,
        notes,
        validTill
    };

    const quotation = await quotationService.createQuotation(leadId, quotationData, req.user._id);

    return res.status(201).json(
        new ApiResponse(201, quotation, "Quotation created successfully")
    );
});

/**
 * Send quotation email
 * POST /api/quotations/:id/send
 */
export const sendQuotationEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { ccEmails } = req.body;

    const quotation = await quotationService.sendQuotation(id, ccEmails || []);

    return res.status(200).json(
        new ApiResponse(200, quotation, "Quotation sent successfully")
    );
});

/**
 * Get quotation by ID
 * GET /api/quotations/:id
 */
export const getQuotationById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const quotation = await quotationService.getQuotationById(id);

    // Check access - STAFF can only view their own quotations
    if (req.user.role === "STAFF" && quotation.salesPersonId._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only view your own quotations");
    }

    return res.status(200).json(
        new ApiResponse(200, quotation, "Quotation fetched successfully")
    );
});

/**
 * Get quotations by lead
 * GET /api/quotations/lead/:leadId
 */
export const getQuotationsByLead = asyncHandler(async (req, res) => {
    const { leadId } = req.params;

    const quotations = await quotationService.getQuotationsByLead(leadId);

    return res.status(200).json(
        new ApiResponse(200, quotations, "Quotations fetched successfully")
    );
});

/**
 * Update quotation status
 * PATCH /api/quotations/:id/status
 */
export const updateQuotationStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const quotation = await quotationService.updateQuotationStatus(id, status);

    return res.status(200).json(
        new ApiResponse(200, quotation, "Quotation status updated successfully")
    );
});
