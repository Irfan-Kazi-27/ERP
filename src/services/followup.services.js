import { Followup } from "../models/followsUp.models.js";
import { Lead } from "../models/leads.models.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create follow-up for a lead
 * @param {string} leadId - Lead ID
 * @param {string} remarks - Follow-up remarks
 * @param {Date} nextFollowupDate - Next follow-up date
 * @param {string} orderStatus - Order status (optional)
 * @returns {Promise<Object>} - Created follow-up
 */
export const createFollowup = async (leadId, remarks, nextFollowupDate, orderStatus) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        const followup = await Followup.create({
            lead: leadId,
            remarks,
            nextFollowupDate,
            orderStatus: orderStatus || "PRECLOSED"
        });

        // Update lead status to FOLLOW_UP if not already
        if (lead.status !== "FOLLOW_UP" && lead.status !== "CLIENT_APPROVAL_PENDING") {
            lead.status = "FOLLOW_UP";
            await lead.save();
        }

        return await Followup.findById(followup._id).populate('lead');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error creating follow-up: ${error.message}`);
    }
};

/**
 * Get all follow-ups for a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Array>} - List of follow-ups
 */
export const getFollowupsByLead = async (leadId) => {
    try {
        const followups = await Followup.find({ lead: leadId })
            .sort({ followupDate: -1 });

        return followups;
    } catch (error) {
        throw new ApiError(500, `Error fetching follow-ups: ${error.message}`);
    }
};

/**
 * Get upcoming follow-ups for a sales person
 * @param {string} salesPersonId - Sales person ID (optional)
 * @returns {Promise<Array>} - List of upcoming follow-ups
 */
export const getUpcomingFollowups = async (salesPersonId = null) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Build query
        let query = {
            nextFollowupDate: {
                $gte: today,
                $lte: nextWeek
            }
        };

        const followups = await Followup.find(query)
            .populate({
                path: 'lead',
                populate: {
                    path: 'assignedTo',
                    select: 'name email'
                }
            })
            .sort({ nextFollowupDate: 1 });

        // Filter by sales person if provided
        if (salesPersonId) {
            return followups.filter(f =>
                f.lead.assignedTo && f.lead.assignedTo._id.toString() === salesPersonId
            );
        }

        return followups;

    } catch (error) {
        throw new ApiError(500, `Error fetching upcoming follow-ups: ${error.message}`);
    }
};

/**
 * Update follow-up
 * @param {string} followupId - Follow-up ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} - Updated follow-up
 */
export const updateFollowup = async (followupId, updateData) => {
    try {
        const followup = await Followup.findById(followupId);
        if (!followup) {
            throw new ApiError(404, "Follow-up not found");
        }

        if (updateData.remarks) followup.remarks = updateData.remarks;
        if (updateData.nextFollowupDate) followup.nextFollowupDate = updateData.nextFollowupDate;
        if (updateData.orderStatus) followup.orderStatus = updateData.orderStatus;

        await followup.save();

        return await Followup.findById(followupId).populate('lead');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating follow-up: ${error.message}`);
    }
};
