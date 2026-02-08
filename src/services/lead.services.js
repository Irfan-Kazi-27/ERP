import { Lead } from "../models/leads.models.js";
import { User } from "../models/users.models.js";
import { generateLeadNumber } from "../utils/autoNumber.helper.js";
import { ApiError } from "../utils/ApiError.js";

import { findOrCreateParty } from "./party.services.js";

/**
 * Create new lead
 * @param {Object} leadData - Lead data
 * @param {string} createdBy - User ID who created the lead
 * @returns {Promise<Object>} - Created lead
 */
export const createLead = async (leadData, createdBy) => {
    try {
        let customerId;

        // Handle Party Creation/Lookup
        if (leadData.customerId) {
            customerId = leadData.customerId;
        } else if (leadData.customerData) {
            const party = await findOrCreateParty(leadData.customerData, createdBy);
            customerId = party._id;
        } else {
            throw new ApiError(400, "Customer ID or Customer Data is required");
        }

        // Generate lead number
        const leadNo = await generateLeadNumber();

        // Create lead
        const lead = await Lead.create({
            ...leadData,
            customer: customerId,
            leadNo,
            createdBy,
            status: "NEW"
        });

        return await Lead.findById(lead._id)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email');

    } catch (error) {
        throw new ApiError(500, `Error creating lead: ${error.message}`);
    }
};

/**
 * Update lead details
 * @param {string} leadId - Lead ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated lead
 */
export const updateLead = async (leadId, updateData) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        // Only allow updates for active statuses (not REJECTED or LOST)
        if (["REJECTED", "LOST"].includes(lead.status)) {
            throw new ApiError(400, `Lead cannot be updated in current status: ${lead.status}`);
        }

        if (updateData.customer || updateData.customerId) lead.customer = updateData.customerId || updateData.customer;
        if (updateData.source) lead.source = updateData.source;
        if (updateData.interestedIn) lead.interestedIn = updateData.interestedIn;
        if (updateData.remarks) lead.remarks = updateData.remarks;
        if (updateData.status) lead.status = updateData.status;
        if (updateData.assignedTo) lead.assignedTo = updateData.assignedTo;

        await lead.save();

        return await Lead.findById(leadId)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating lead: ${error.message}`);
    }
};

/**
 * Soft delete lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} - Deleted lead
 */
export const deleteLead = async (leadId) => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        lead.isActive = false;
        await lead.save();

        return { message: "Lead deleted successfully" };

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error deleting lead: ${error.message}`);
    }
};

/**
 * Review lead (Approve/Reject by Team Lead)
 * @param {string} leadId - Lead ID
 * @param {string} status - APPROVED or REJECTED
 * @param {string} remarks - Review remarks
 * @param {string} reviewedBy - User ID who reviewed
 * @returns {Promise<Object>} - Updated lead
 */
export const reviewLead = async (leadId, status, remarks, reviewedBy) => {
    try {
        if (!["APPROVED", "REJECTED"].includes(status)) {
            throw new ApiError(400, "Invalid status. Must be APPROVED or REJECTED");
        }

        if (status === "REJECTED" && !remarks) {
            throw new ApiError(400, "Remarks are required when rejecting a lead");
        }

        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        if (lead.status !== "NEW") {
            throw new ApiError(400, `Lead cannot be reviewed. Current status: ${lead.status}`);
        }

        lead.status = status;
        lead.remarks = remarks;
        lead.reviewedBy = reviewedBy;
        lead.reviewedAt = new Date();

        await lead.save();

        return await Lead.findById(leadId)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error reviewing lead: ${error.message}`);
    }
};

/**
 * Assign sales person to lead
 * @param {string} leadId - Lead ID
 * @param {string} salesPersonId - Sales person user ID
 * @param {string} assignedBy - User ID who assigned
 * @param {string} reason - Assignment reason (optional)
 * @returns {Promise<Object>} - Updated lead
 */
export const assignSalesPerson = async (leadId, salesPersonId, assignedBy, reason = "") => {
    try {
        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        if (lead.status !== "APPROVED") {
            throw new ApiError(400, `Lead must be approved before assignment. Current status: ${lead.status}`);
        }

        // Validate sales person
        const salesPerson = await User.findById(salesPersonId);
        if (!salesPerson) {
            throw new ApiError(404, "Sales person not found");
        }

        // Check if user has correct permissions (STAFF role)
        // Note: You might want to allow other roles too, adjust as needed
        if (salesPerson.role !== "STAFF") {
            throw new ApiError(400, "Assigned user must be a sales person (STAFF role)");
        }

        if (!salesPerson.isActive) {
            throw new ApiError(400, "Cannot assign to inactive user");
        }

        // Add to assignment history
        lead.assignmentHistory.push({
            assignedTo: salesPersonId,
            assignedBy: assignedBy,
            assignedAt: new Date(),
            reason: reason
        });

        lead.assignedTo = salesPersonId;
        lead.status = "ASSIGNED";

        await lead.save();

        return await Lead.findById(leadId)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('assignmentHistory.assignedTo', 'name email')
            .populate('assignmentHistory.assignedBy', 'name email');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error assigning sales person: ${error.message}`);
    }
};

/**
 * Get lead by ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<Object>} - Lead details
 */
export const getLeadById = async (leadId) => {
    try {
        const lead = await Lead.findById(leadId)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('assignmentHistory.assignedTo', 'name email')
            .populate('assignmentHistory.assignedBy', 'name email');

        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        return lead;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error fetching lead: ${error.message}`);
    }
};

/**
 * Get all leads with filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @param {string} userId - Current user ID
 * @param {string} userRole - Current user role
 * @returns {Promise<Object>} - Leads list with pagination
 */
export const getAllLeads = async (filters = {}, pagination = {}, userId, userRole) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        // Build query
        let query = { isActive: true };

        // Role-based filtering
        if (userRole === "STAFF") {
            // Sales person can see assigned leads OR leads created by them
            query.$or = [
                { assignedTo: userId },
                { createdBy: userId }
            ];
        }

        // Apply filters
        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.source) {
            query.source = filters.source;
        }

        if (filters.assignedTo) {
            query.assignedTo = filters.assignedTo;
        }

        if (filters.dateFrom || filters.dateTo) {
            query.leadDate = {};
            if (filters.dateFrom) {
                query.leadDate.$gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                query.leadDate.$lte = new Date(filters.dateTo);
            }
        }

        if (filters.search) {
            query.$or = [
                { 'customer.name': { $regex: filters.search, $options: 'i' } },
                { 'customer.companyName': { $regex: filters.search, $options: 'i' } },
                { 'customer.email': { $regex: filters.search, $options: 'i' } },
                { leadNo: { $regex: filters.search, $options: 'i' } }
            ];
        }

        // Execute query
        const leads = await Lead.find(query)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Lead.countDocuments(query);

        return {
            leads,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        throw new ApiError(500, `Error fetching leads: ${error.message}`);
    }
};

/**
 * Update lead status
 * @param {string} leadId - Lead ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated lead
 */
export const updateLeadStatus = async (leadId, status) => {
    try {
        const validStatuses = [
            "NEW", "APPROVED", "REJECTED", "ASSIGNED",
            "FOLLOW_UP", "CLIENT_APPROVAL_PENDING",
            "APPROVED_BY_CLIENT", "CONVERTED_TO_ORDER"
        ];

        if (!validStatuses.includes(status)) {
            throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const lead = await Lead.findById(leadId);
        if (!lead) {
            throw new ApiError(404, "Lead not found");
        }

        // Validate Status Transitions
        const VALID_TRANSITIONS = {
            NEW: ["APPROVED", "REJECTED"],
            APPROVED: ["ASSIGNED", "REJECTED"], // Added REJECTED just in case
            ASSIGNED: ["FOLLOW_UP", "CLIENT_APPROVAL_PENDING", "REJECTED"],
            FOLLOW_UP: ["CLIENT_APPROVAL_PENDING", "REJECTED", "CONVERTED_TO_ORDER"],
            CLIENT_APPROVAL_PENDING: ["APPROVED_BY_CLIENT", "FOLLOW_UP", "REJECTED"],
            APPROVED_BY_CLIENT: ["CONVERTED_TO_ORDER", "REJECTED"],
            REJECTED: [], // Terminal state
            CONVERTED_TO_ORDER: [] // Terminal state
        };

        // Allow admin override or strict validation? 
        // For now, strict validation helps prevent logic errors
        if (!VALID_TRANSITIONS[lead.status]?.includes(status)) {
            // Optional: bypass for ADMIN if needed, but safer to enforce flow
            throw new ApiError(400, `Invalid status transition from ${lead.status} to ${status}`);
        }

        lead.status = status;
        await lead.save();

        return await Lead.findById(leadId)
            .populate('interestedIn.item', 'name description basePrice')
            .populate('customer', 'name email contact companyName address')
            .populate('createdBy', 'name email')
            .populate('reviewedBy', 'name email')
            .populate('assignedTo', 'name email');

    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error updating lead status: ${error.message}`);
    }
};
/**
 * Get lead stats (counts)
 * @param {string} userId - User ID
 * @param {string} userRole - User Role
 * @returns {Promise<Object>} - Lead stats
 */
export const getLeadStats = async (userId, userRole) => {
    try {
        let query = { isActive: true };

        if (userRole === "STAFF") {
            query.assignedTo = userId;
        }

        const stats = await Lead.aggregate([
            { $match: query },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalLeads = await Lead.countDocuments(query);

        // Convert stats array to object
        const statusCounts = stats.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        return {
            totalLeads,
            statusCounts
        };
    } catch (error) {
        throw new ApiError(500, `Error fetching lead stats: ${error.message}`);
    }
};
