import mongoose from "mongoose"

const leadSchema = new mongoose.Schema(
  {
    leadDate: {
      type: Date,
      default: Date.now
    },
    leadNo:{
      type:String,
      required:true
    },
    customer: {
      name:{type:String,required:true},
      contact:{type:String,required:true},
      email:{type:String,required:true},
      companyName:{type:String,required:true},
      address:{type:String,required:true}
    },
    source: {
      type: String,
      enum: ["WHATSAPP", "EMAIL", "REFERRAL", "WEBSITE","CALL", "OTHER" ],
      required: true
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "APPROVED",
        "REJECTED",
        "ASSIGNED",
        "FOLLOW_UP",
        "CLIENT_APPROVAL_PENDING",
        "APPROVED_BY_CLIENT",
        "CONVERTED_TO_ORDER"
      ],
      default: "NEW"
    },
    interestedIn:[{
      item:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
      }
    }],
    assignedTo:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt:{
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
    assignedTo:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedBy:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedAt:{
      type: Date,
      default: Date.now
    },
    reason:{
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

