import mongoose from "mongoose"

const emailLogSchema = new mongoose.Schema(
    {
        emailType: {
            type: String,
            enum: ["QUOTATION", "NOTIFICATION", "REMINDER"],
            required: true
        },
        recipient: {
            type: String,
            required: true
        },
        cc: [{
            type: String
        }],
        subject: {
            type: String,
            required: true
        },
        body: {
            type: String
        },
        status: {
            type: String,
            enum: ["SENT", "FAILED"],
            required: true
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        relatedTo: {
            model: {
                type: String,
                enum: ["Lead", "Quotation", "Order"]
            },
            id: {
                type: mongoose.Schema.Types.ObjectId
            }
        },
        error: {
            type: String
        }
    },
    {
        collection: "emaillogs",
        timestamps: true
    }
);

export const EmailLog = mongoose.model("EmailLog", emailLogSchema);
