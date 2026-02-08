import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as leadService from "../services/lead.services.js";

/**
 * Create new lead
 * POST /api/leads
 */
export const createLead = asyncHandler(async (req, res) => {
    const { customer, source, interestedIn, remarks } = req.body;

    // Validation
    if (!customer || !customer.name || !customer.contact || !customer.email || !customer.companyName || !customer.address) {
        throw new ApiError(400, "All customer fields are required");
    }

    if (!source) {
        throw new ApiError(400, "Lead source is required");
    }

    if (!interestedIn || interestedIn.length === 0) {
        throw new ApiError(400, "At least one interested item is required");
    }

    const leadData = {
        customer,
        source,
        interestedIn,
        remarks
    };

    const lead = await leadService.createLead(leadData, req.user._id);

    return res.status(201).json(
        new ApiResponse(201, lead, "Lead created successfully")
    );
});

/**
 * Review lead (Approve/Reject)
 * PATCH /api/leads/:id/review
 */
export const reviewLead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // Only ADMIN, SUB_ADMIN, SUPER_ADMIN can review leads
    if (!["ADMIN", "SUB_ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        throw new ApiError(403, "Only team leads can review leads");
    }

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const lead = await leadService.reviewLead(id, status, remarks, req.user._id);

    return res.status(200).json(
        new ApiResponse(200, lead, `Lead ${status.toLowerCase()} successfully`)
    );
});

/**
 * Assign sales person to lead
 * PATCH /api/leads/:id/assign
 */
export const assignSalesPerson = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { salesPersonId, reason } = req.body;

    // Only ADMIN, SUB_ADMIN, SUPER_ADMIN can assign leads
    if (!["ADMIN", "SUB_ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        throw new ApiError(403, "Only team leads can assign leads");
    }

    if (!salesPersonId) {
        throw new ApiError(400, "Sales person ID is required");
    }

    const lead = await leadService.assignSalesPerson(id, salesPersonId, req.user._id, reason);

    return res.status(200).json(
        new ApiResponse(200, lead, "Sales person assigned successfully")
    );
});

/**
 * Get lead by ID
 * GET /api/leads/:id
 */
export const getLeadById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const lead = await leadService.getLeadById(id);

    // Check access - STAFF can only view assigned leads
    if (req.user.role === "STAFF" && lead.assignedTo?._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only view leads assigned to you");
    }

    return res.status(200).json(
        new ApiResponse(200, lead, "Lead fetched successfully")
    );
});

/**
 * Get all leads with filters
 * GET /api/leads
 */
export const getAllLeads = asyncHandler(async (req, res) => {
    const { status, source, assignedTo, dateFrom, dateTo, search, page, limit, sortBy, sortOrder } = req.query;

    const filters = {
        status,
        source,
        assignedTo,
        dateFrom,
        dateTo,
        search
    };

    const pagination = {
        page,
        limit,
        sortBy,
        sortOrder
    };

    const result = await leadService.getAllLeads(filters, pagination, req.user._id, req.user.role);

    return res.status(200).json(
        new ApiResponse(200, result, "Leads fetched successfully")
    );
});

/**
 * Update lead status
 * PATCH /api/leads/:id/status
 */
export const updateLeadStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const lead = await leadService.updateLeadStatus(id, status);

    return res.status(200).json(
        new ApiResponse(200, lead, "Lead status updated successfully")
    );
});
