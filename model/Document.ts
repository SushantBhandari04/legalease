import mongoose, { Schema, Document } from "mongoose";

export interface CaseDocument extends Document {
  caseId: string; // Reference to the case
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  cloudinaryUrl: string; // Cloudinary URL where file is stored
  cloudinaryPublicId: string; // Cloudinary public ID for file management
  uploadedBy: string; // User ID who uploaded the file
  uploadDate: Date;
  documentType: "pleading" | "evidence" | "correspondence" | "judgment" | "other";
  description?: string;
  tags?: string[]; // For categorization
  isPublic: boolean; // Whether document is public or private
  downloadCount: number;
  lastAccessed?: Date;
  userId: string; // Reference to the user who owns this case
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema<CaseDocument> = new mongoose.Schema({
  caseId: {
    type: String,
    required: [true, "Case ID is required"],
    ref: "Case"
  },
  fileName: {
    type: String,
    required: [true, "File name is required"],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, "Original file name is required"],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, "File size is required"],
    min: 0
  },
  mimeType: {
    type: String,
    required: [true, "MIME type is required"],
    trim: true
  },
  cloudinaryUrl: {
    type: String,
    required: [true, "Cloudinary URL is required"],
    trim: true
  },
  cloudinaryPublicId: {
    type: String,
    required: [true, "Cloudinary public ID is required"],
    trim: true
  },
  uploadedBy: {
    type: String,
    required: [true, "Uploader ID is required"],
    ref: "User"
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  documentType: {
    type: String,
    enum: ["pleading", "evidence", "correspondence", "judgment", "other"],
    default: "other"
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
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
DocumentSchema.index({ caseId: 1, uploadDate: -1 });
DocumentSchema.index({ userId: 1, uploadDate: -1 });
DocumentSchema.index({ caseId: 1, documentType: 1 });
DocumentSchema.index({ fileName: "text", originalName: "text", description: "text" }); // Text search

const DocumentModel =
  (mongoose.models.Document as mongoose.Model<CaseDocument>) ||
  mongoose.model<CaseDocument>('Document', DocumentSchema);

export default DocumentModel;
