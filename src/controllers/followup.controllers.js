import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as followupService from "../services/followup.services.js";

/**
 * Create follow-up
 * POST /api/followups
 */
export const createFollowup = asyncHandler(async (req, res) => {
    const { leadId, remarks, nextFollowupDate, orderStatus } = req.body;

    if (!leadId) {
        throw new ApiError(400, "Lead ID is required");
    }

    if (!remarks) {
        throw new ApiError(400, "Remarks are required");
    }

    const followup = await followupService.createFollowup(leadId, remarks, nextFollowupDate, orderStatus);

    return res.status(201).json(
        new ApiResponse(201, followup, "Follow-up created successfully")
    );
});

/**
 * Get follow-ups by lead
 * GET /api/followups/lead/:leadId
 */
export const getFollowupsByLead = asyncHandler(async (req, res) => {
    const { leadId } = req.params;

    const followups = await followupService.getFollowupsByLead(leadId);

    return res.status(200).json(
        new ApiResponse(200, followups, "Follow-ups fetched successfully")
    );
});

/**
 * Get upcoming follow-ups
 * GET /api/followups/upcoming
 */
export const getUpcomingFollowups = asyncHandler(async (req, res) => {
    // If user is STAFF, only show their follow-ups
    const salesPersonId = req.user.role === "STAFF" ? req.user._id : null;

    const followups = await followupService.getUpcomingFollowups(salesPersonId);

    return res.status(200).json(
        new ApiResponse(200, followups, "Upcoming follow-ups fetched successfully")
    );
});

/**
 * Update follow-up
 * PATCH /api/followups/:id
 */
export const updateFollowup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const followup = await followupService.updateFollowup(id, updateData);

    return res.status(200).json(
        new ApiResponse(200, followup, "Follow-up updated successfully")
    );
});
