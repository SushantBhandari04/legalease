import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import DocumentModel from "@/model/Document";
import { deleteFromCloudinary, isCloudinaryConfigured, getCloudinaryFileBuffer } from "@/lib/cloudinary";

// GET /api/cases/[id]/documents/[docId] - Download a document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, docId } =  await params;

    // Find document and verify ownership
    const document = await DocumentModel.findOne({
      _id: docId,
      caseId: id,
      userId: session.user._id
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured. Please set up CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables." },
        { status: 500 }
      );
    }

    // Update download count and last accessed
    await DocumentModel.findByIdAndUpdate(docId, {
      $inc: { downloadCount: 1 },
      lastAccessed: new Date()
    });

    // Get file buffer directly from Cloudinary using API
    console.log("Fetching file from Cloudinary using API:", document.cloudinaryPublicId);
    
    try {
      // Determine resource type based on file type
      // const resourceType = document.mimeType === 'application/pdf' ? 'raw' : 'image';
      const resourceType = document.mimeType?.startsWith('image/') ? 'image' : 'raw';
      const fileBuffer = await getCloudinaryFileBuffer(document.cloudinaryPublicId, resourceType);
      console.log("Downloaded file:", {
        fileName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        bufferSize: fileBuffer.length
      });

      // Return file with appropriate headers
      // Properly encode filename for HTTP headers to handle Unicode characters
      const encodedFilename = encodeURIComponent(document.originalName);
      const contentDisposition = `attachment; filename*=UTF-8''${encodedFilename}`;
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": document.mimeType,
          "Content-Disposition": contentDisposition,
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "no-cache",
        },
      });
    } catch (error) {
      console.error("Failed to fetch file from Cloudinary:", error);
      return NextResponse.json({ 
        error: "Failed to fetch file from Cloudinary. Please check file permissions." 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/documents/[docId] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, docId } =  await params;

    // Find document and verify ownership
    const document = await DocumentModel.findOne({
      _id: docId,
      caseId: id,
      userId: session.user._id
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete file from Cloudinary
    try {
      await deleteFromCloudinary(document.cloudinaryPublicId);
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete document record
    await DocumentModel.findByIdAndDelete(docId);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
