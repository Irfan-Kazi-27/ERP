import mongoose from "mongoose"

const leadSchema = new mongoose.Schema(
  {
    leadDate: {
      type: Date,
      default: Date.now
    },
    leadNo: {
      type: String,
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true
    },
    source: {
      type: String,
      enum: ["WHATSAPP", "EMAIL", "REFERRAL", "WEBSITE", "CALL", "OTHER"],
      required: true
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "REJECTED",
        "ASSIGNED",
        "CONTACTED",
        "QUALIFIED",
        "QUOTATION_SENT",
        "FOLLOW_UP",
        "LOST"
      ],
      default: "NEW"
    },
    interestedIn: [{
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
      }
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    remarks: {
      type: String,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    assignmentHistory: [{
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      assignedAt: {
        type: Date,
        default: Date.now
      },
      reason: {
        type: String,
        trim: true
      }
    }]
  },
  {
    timestamps: true
  }
);

export const Lead = mongoose.model("Lead", leadSchema);

