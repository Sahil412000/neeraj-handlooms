import mongoose, { Schema, Document } from "mongoose";

export interface ITailor extends Document {
  name: string;
  contactNumber: string;
  alternateContact?: string;
  specialization?: string;
  address?: string;
  isActive: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TailorSchema = new Schema<ITailor>(
  {
    name: {
      type: String,
      required: [true, "Tailor name is required"],
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
    specialization: {
      type: String,
      trim: true,
    },
    address: {
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
TailorSchema.index({ userId: 1, name: 1 });
TailorSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Tailor || mongoose.model<ITailor>("Tailor", TailorSchema);
