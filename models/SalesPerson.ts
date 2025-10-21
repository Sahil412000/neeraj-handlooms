import mongoose, { Schema, Document } from "mongoose";

export interface ISalesPerson extends Document {
  name: string;
  contactNumber: string;
  alternateContact?: string;
  territory?: string;
  email?: string;
  isActive: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SalesPersonSchema = new Schema<ISalesPerson>(
  {
    name: {
      type: String,
      required: [true, "Sales person name is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    alternateContact: {
      type: String,
      trim: true,
    },
    territory: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Index for faster lookups
SalesPersonSchema.index({ userId: 1, name: 1 });
SalesPersonSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.SalesPerson || mongoose.model<ISalesPerson>("SalesPerson", SalesPersonSchema);
