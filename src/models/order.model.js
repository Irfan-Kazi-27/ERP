import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true
    },

    orderDate: {
      type: Date,
      default: Date.now
    },

    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true
    },

    quotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true
    },
    customer: {
      name:{type:String,required:true},
      contact:{type:String,required:true},
      email:{type:String,required:true},
      companyName:{type:String,required:true},
      address:{type:String,required:true}
    },
    salesPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "PO_PENDING",
        "PO_RECEIVED",
        "CONFIRMED",
        "CANCELLED"
      ],
      default: "CREATED"
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  {
    collection: "orders",
    timestamps: true
  }
);

export const Order = mongoose.model("Order", orderSchema);
