import mongoose, { Schema, Document } from "mongoose";

export interface TimelineEvent extends Document {
  caseId: string; // Reference to the case
  title: string;
  description: string;
  eventDate: Date;
  eventType: "filing" | "hearing" | "evidence" | "document" | "status_change" | "custom";
  status: "completed" | "scheduled" | "pending";
  metadata?: {
    stage?: string;
    status?: string;
    progress?: number;
    documentUrl?: string;
    notes?: string;
  };
  userId: string; // Reference to the user who owns this case
  createdAt: Date;
  updatedAt: Date;
}

const TimelineEventSchema: Schema<TimelineEvent> = new mongoose.Schema({
  caseId: {
    type: String,
    required: [true, "Case ID is required"],
    ref: "Case"
  },
  title: {
    type: String,
    required: [true, "Event title is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Event description is required"],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, "Event date is required"]
  },
  eventType: {
    type: String,
    enum: ["filing", "hearing", "evidence", "document", "status_change", "custom"],
    required: [true, "Event type is required"]
  },
  status: {
    type: String,
    enum: ["completed", "scheduled", "pending"],
    default: "completed"
  },
  metadata: {
    stage: String,
    status: String,
    progress: Number,
    documentUrl: String,
    notes: String
  },
  userId: {
    type: String,
    required: [true, "User ID is required"],
    ref: "User"
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Indexes for efficient queries
TimelineEventSchema.index({ caseId: 1, eventDate: -1 });
TimelineEventSchema.index({ userId: 1, eventDate: -1 });
TimelineEventSchema.index({ caseId: 1, eventType: 1 });

const TimelineEventModel =
  (mongoose.models.TimelineEvent as mongoose.Model<TimelineEvent>) ||
  mongoose.model<TimelineEvent>('TimelineEvent', TimelineEventSchema);

export default TimelineEventModel;
