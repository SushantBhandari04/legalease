import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import DocumentModel from "@/model/Document";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

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

    // Find document and verify ownership
    const document = await DocumentModel.findOne({
      _id: params.docId,
      caseId: params.id,
      userId: session.user._id
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if file exists
    if (!existsSync(document.filePath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(document.filePath);

    // Update download count and last accessed
    await DocumentModel.findByIdAndUpdate(params.docId, {
      $inc: { downloadCount: 1 },
      lastAccessed: new Date()
    });

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.originalName}"`,
        "Content-Length": document.fileSize.toString(),
      },
    });
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

    // Find document and verify ownership
    const document = await DocumentModel.findOne({
      _id: params.docId,
      caseId: params.id,
      userId: session.user._id
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete file from disk
    if (existsSync(document.filePath)) {
      const { unlink } = await import("fs/promises");
      await unlink(document.filePath);
    }

    // Delete document record
    await DocumentModel.findByIdAndDelete(params.docId);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
