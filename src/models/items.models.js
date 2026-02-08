import mongoose from "mongoose"

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    // unit: {
    //     type: String,
    //     required: true
    // },
    isActive: {
        type: Boolean,
        default: true
    }
})

export const Item = mongoose.model("Item", itemSchema)