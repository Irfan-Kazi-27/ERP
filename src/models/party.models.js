import mongoose from "mongoose";

const partySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        contact: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: false,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        companyName: {
            type: String,
            required: false,
            trim: true
        },
        address: {
            type: String,
            required: false,
            trim: true
        },
        gstin: {
            type: String,
            trim: true,
            uppercase: true
        },
        pan: {
            type: String,
            trim: true,
            uppercase: true
        },
        type: {
            type: String,
            enum: ["PROSPECT", "CUSTOMER"],
            default: "PROSPECT"
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export const Party = mongoose.model("Party", partySchema);
