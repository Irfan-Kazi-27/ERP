import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as partyService from "../services/party.services.js";

/**
 * Create new party
 * POST /api/parties
 */
export const createParty = asyncHandler(async (req, res) => {
    const { name, email, contact, companyName, address } = req.body;

    if (!name || !email || !contact || !companyName || !address) {
        throw new ApiError(400, "All fields are required");
    }

    const party = await partyService.createParty(req.body, req.user._id);

    return res.status(201).json(
        new ApiResponse(201, party, "Party created successfully")
    );
});

/**
 * Update party
 * PATCH /api/parties/:id
 */
export const updateParty = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const party = await partyService.updateParty(id, updateData);

    return res.status(200).json(
        new ApiResponse(200, party, "Party updated successfully")
    );
});

/**
 * Delete party
 * DELETE /api/parties/:id
 */
export const deleteParty = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await partyService.deleteParty(id);

    return res.status(200).json(
        new ApiResponse(200, result, "Party deleted successfully")
    );
});

/**
 * Get party by ID
 * GET /api/parties/:id
 */
export const getPartyById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const party = await partyService.getPartyById(id);

    return res.status(200).json(
        new ApiResponse(200, party, "Party fetched successfully")
    );
});

/**
 * Get all parties with search/filter
 * GET /api/parties
 */
export const getAllParties = asyncHandler(async (req, res) => {
    const { search, type, page, limit, sortBy, sortOrder } = req.query;

    const filters = { search, type };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await partyService.getAllParties(filters, pagination);

    return res.status(200).json(
        new ApiResponse(200, result, "Parties fetched successfully")
    );
});
