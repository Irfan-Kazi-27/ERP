import { Party } from "../models/party.models.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create new party
 */
export const createParty = async (partyData, createdBy) => {
    try {
        const existingParty = await Party.findOne({ email: partyData.email });
        if (existingParty) {
            throw new ApiError(400, "Party with this email already exists");
        }

        const party = await Party.create({
            ...partyData,
            createdBy
        });

        return party;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error creating party: ${error.message}`);
    }
};

/**
 * Update party
 */
export const updateParty = async (partyId, updateData) => {
    try {
        const party = await Party.findById(partyId);
        if (!party) {
            throw new ApiError(404, "Party not found");
        }

        Object.assign(party, updateData);
        await party.save();

        return party;
    } catch (error) {
        throw new ApiError(500, `Error updating party: ${error.message}`);
    }
};

/**
 * Soft delete party
 */
export const deleteParty = async (partyId) => {
    try {
        const party = await Party.findById(partyId);
        if (!party) {
            throw new ApiError(404, "Party not found");
        }

        party.isActive = false;
        party.status = "INACTIVE";
        await party.save();

        return { message: "Party deleted successfully" };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error deleting party: ${error.message}`);
    }
};

/**
 * Get party by ID
 */
export const getPartyById = async (partyId) => {
    try {
        const party = await Party.findById(partyId).populate('createdBy', 'name email');
        if (!party) {
            throw new ApiError(404, "Party not found");
        }
        return party;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, `Error fetching party: ${error.message}`);
    }
};

/**
 * Get all parties with filters
 */
export const getAllParties = async (filters = {}, pagination = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
        const skip = (page - 1) * limit;

        let query = { isActive: true };

        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { email: { $regex: filters.search, $options: 'i' } },
                { companyName: { $regex: filters.search, $options: 'i' } }
            ];
        }

        if (filters.type) {
            query.type = filters.type;
        }

        const parties = await Party.find(query)
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email');

        const total = await Party.countDocuments(query);

        return {
            parties,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        throw new ApiError(500, `Error fetching parties: ${error.message}`);
    }
};

/**
 * Find existing party or create new one based on company name or contact
 */
export const findOrCreateParty = async (partyData, createdBy) => {
    try {
        let party = null;

        // Primary: Search by company name if provided
        if (partyData.companyName && partyData.companyName.trim()) {
            party = await Party.findOne({
                companyName: { $regex: new RegExp(`^${partyData.companyName.trim()}$`, 'i') },
                isActive: true
            });
        }

        // Fallback: Search by contact number if company name not found
        if (!party && partyData.contact && partyData.contact.trim()) {
            party = await Party.findOne({
                contact: partyData.contact.trim(),
                isActive: true
            });
        }

        if (party) {
            // Return existing party
            return party;
        }

        // Create new party if no match found
        party = await Party.create({
            ...partyData,
            createdBy
        });

        return party;
    } catch (error) {
        throw new ApiError(500, `Error finding or creating party: ${error.message}`);
    }
};
