import mongoose, { Schema, Document } from "mongoose";

export interface IConfiguration extends Document {
  userId: mongoose.Types.ObjectId;
  defaultMakingRate: number;
  defaultFittingRate: number;
  defaultTrackRate: number;
  defaultHookRate: number;
  termsAndConditions: string;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyContact?: string;
  gstNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConfigurationSchema = new Schema<IConfiguration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    defaultMakingRate: {
      type: Number,
      required: true,
      default: 180,
    },
    defaultFittingRate: {
      type: Number,
      required: true,
      default: 300,
    },
    defaultTrackRate: {
      type: Number,
      required: true,
      default: 180,
    },
    defaultHookRate: {
      type: Number,
      required: true,
      default: 200,
    },
    termsAndConditions: {
      type: String,
      default: `1) Order once placed cannot be cancelled
2) Advance paid will not be refunded
3) Delivery will be done after full bill is cleared at the Shop
4) Shop Closed on TUESDAY`,
    },
    companyName: {
      type: String,
      trim: true,
    },
    companyLogo: {
      type: String,
    },
    companyAddress: {
      type: String,
      trim: true,
    },
    companyContact: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
ConfigurationSchema.index({ userId: 1 });

export default mongoose.models.Configuration ||
  mongoose.model<IConfiguration>("Configuration", ConfigurationSchema);
