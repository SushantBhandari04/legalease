import mongoose, { Schema, Document } from "mongoose";

export interface Case extends Document {
  caseNumber: string;
  title: string;
  court: string;
  type: string;
  stage: "Filed" | "Hearing" | "Evidence" | "Arguments" | "Judgment" | "Closed";
  status: "Active" | "Pending" | "Delayed" | "Completed";
  progress: number;
  description?: string;
  clientName?: string;
  opposingParty?: string;
  caseValue?: number;
  filingDate: Date;
  lastUpdated: Date;
  nextHearing?: Date;
  documents?: string[]; // Array of document URLs or IDs
  notes?: string;
  userId: string; // Reference to the user who owns this case
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema: Schema<Case> = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: [true, "Case number is required"],
    trim: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, "Case title is required"],
    trim: true
  },
  court: {
    type: String,
    required: [true, "Court name is required"],
    trim: true
  },
  type: {
    type: String,
    required: [true, "Case type is required"],
    trim: true
  },
  stage: {
    type: String,
    enum: ["Filed", "Hearing", "Evidence", "Arguments", "Judgment", "Closed"],
    default: "Filed"
  },
  status: {
    type: String,
    enum: ["Active", "Pending", "Delayed", "Completed"],
    default: "Active"
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  clientName: {
    type: String,
    trim: true
  },
  opposingParty: {
    type: String,
    trim: true
  },
  caseValue: {
    type: Number,
    min: 0
  },
  filingDate: {
    type: Date,
    required: [true, "Filing date is required"],
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  nextHearing: {
    type: Date
  },
  documents: [{
    type: String
  }],
  notes: {
    type: String,
    trim: true
  },
  userId: {
    type: String,
    required: [true, "User ID is required"],
    ref: "User"
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Index for efficient queries
CaseSchema.index({ userId: 1, caseNumber: 1 });
CaseSchema.index({ userId: 1, status: 1 });
CaseSchema.index({ userId: 1, stage: 1 });

const CaseModel =
  (mongoose.models.Case as mongoose.Model<Case>) ||
  mongoose.model<Case>('Case', CaseSchema);

export default CaseModel;
