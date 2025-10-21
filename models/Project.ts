import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  quotationNumber: string;
  customerId: mongoose.Types.ObjectId;
  projectType: string;
  salesPersonId: mongoose.Types.ObjectId;
  projectNotes?: string;
  status: "draft" | "quotation_sent" | "confirmed" | "completed" | "cancelled";
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  probableDeliveryDate?: Date;
  tailorId?: mongoose.Types.ObjectId;
  termsAndConditions?: string;
  discount?: number;
  discountType?: "percentage" | "fixed";
  defaultMakingRate: number;
  defaultFittingRate: number;
  defaultTrackRate: number;
  defaultHookRate: number;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    projectType: {
      type: String,
      required: true,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Villa", "Office", "Other"],
    },
    salesPersonId: {
      type: Schema.Types.ObjectId,
      ref: "SalesPerson",
      required: true,
    },
    projectNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "quotation_sent", "confirmed", "completed", "cancelled"],
      default: "draft",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    probableDeliveryDate: {
      type: Date,
    },
    tailorId: {
      type: Schema.Types.ObjectId,
      ref: "Tailor",
    },
    termsAndConditions: {
      type: String,
    },
    discount: {
      type: Number,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    defaultMakingRate: {
      type: Number,
      required: true,
    },
    defaultFittingRate: {
      type: Number,
      required: true,
    },
    defaultTrackRate: {
      type: Number,
      required: true,
    },
    defaultHookRate: {
      type: Number,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
ProjectSchema.index({ quotationNumber: 1, status: 1, userId: 1 });
ProjectSchema.index({ customerId: 1 });

export default mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
