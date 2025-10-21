import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  projectId: mongoose.Types.ObjectId;
  roomType: string;
  totalMeters: number;
  trackLength: number;
  trackCost: number;
  makingCharges: number;
  fittingCharges: number;
  hookCharges: number;
  roomTotal: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    roomType: {
      type: String,
      enum: [
        "Living Room",
        "Bedroom",
        "Master Bedroom",
        "Kitchen",
        "Dining",
        "Study",
        "Balcony",
        "Office",
        "Other",
      ],
      required: true,
    },
    totalMeters: {
      type: Number,
      default: 0,
    },
    trackLength: {
      type: Number,
      default: 0,
    },
    trackCost: {
      type: Number,
      default: 0,
    },
    makingCharges: {
      type: Number,
      default: 0,
    },
    fittingCharges: {
      type: Number,
      default: 0,
    },
    hookCharges: {
      type: Number,
      default: 0,
    },
    roomTotal: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
RoomSchema.index({ projectId: 1 });

export default mongoose.models.Room ||
  mongoose.model<IRoom>("Room", RoomSchema);
