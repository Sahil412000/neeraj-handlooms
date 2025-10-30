import mongoose, { Schema, Document } from "mongoose";

export interface IWindow extends Document {
  roomId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  windowNumber: number;
  style: string;
  width: number;
  height: number;
  pannaCount: number;
  meters: number;
  fabricCostPerMeter: number;
  trackCount: number;
  hookCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WindowSchema = new Schema<IWindow>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    windowNumber: {
      type: Number,
      required: true,
    },
    style: {
      type: String,
      required: true,
      trim: true,
    },
    width: {
      type: Number,
      required: [true, "Window width is required"],
    },
    height: {
      type: Number,
      required: [true, "Window height is required"],
    },
    pannaCount: {
      type: Number,
      default: 6,
    },
    meters: {
      type: Number,
      required: true,
    },
    fabricCostPerMeter: {
      type: Number,
      required: true,
    },
    trackCount: {
      type: Number,
      default: 1,
    },
    hookCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
WindowSchema.index({ roomId: 1, projectId: 1 });

export default mongoose.models.Window ||
  mongoose.model<IWindow>("Window", WindowSchema);
