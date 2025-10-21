import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  contactNumber: string;
  alternateContact?: string;
  address: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
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
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
CustomerSchema.index({ name: 1, contactNumber: 1 });

export default mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
