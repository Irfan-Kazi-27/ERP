import mongoose from "mongoose"

const quotationSchema = new mongoose.Schema(
    {
        leadId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            required: true
        },
        quotationNo:{
            type:String,
            required:true
        },
        salesPersonId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        quotationDate: {
            type: Date,
            default: Date.now
        },
        quotationItems:[{
            itemId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item",
                required: true
            },
            quantity:{
                type: Number,
                required: true
            },
            UnitPrice:{
                type: Number,
                required: true
            },
            Total:{
                type: Number,
                required: true
            }
        }],
        additionalCharges:[{
            title:{type:String,required:true},
            type:{type:String,enum:["Fixed","Percentage"]},
            value:{type:Number,required:true},
            amount:{type:Number,required:true}
        }],
        discount:{
            type:{type:String,enum:["Fixed","Percentage"]},
            value:{type:Number,required:true},
            amount:{type:Number,required:true}
        },
        tax:{
            type:{type:String,enum:["GST","OTHER"]},
            percentage:{type:Number,required:true},
            amount:{type:Number,required:true}
        },
        status: {
            type: String,
            enum: ["CREATED", "SENT", "APPROVED", "REJECTED"],
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        notes:{
            type:String,
            trim:true
        },
        validTill:{
            type:Date,
            required:true
        },
    },
    {
        collection: "quotations"
    },
    {timestamps:true}
);

export const Quotation = mongoose.model("Quotation", quotationSchema);
