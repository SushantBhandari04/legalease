import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CaseModel from "@/model/Case";

// GET /api/cases/[id] - Fetch a specific case by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const caseId = params.id;

    // Validate ObjectId format
    if (!caseId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid case ID format" },
        { status: 400 }
      );
    }

    const caseData = await CaseModel.findOne({
      _id: caseId,
      userId: session.user._id
    }).lean();

    if (!caseData) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(caseData);

  } catch (error) {
    console.error("Error fetching case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/cases/[id] - Update a specific case
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const caseId = params.id;
    const body = await request.json();

    await dbConnect();

    // Validate ObjectId format
    if (!caseId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid case ID format" },
        { status: 400 }
      );
    }

    // Check if case exists and belongs to user
    const existingCase = await CaseModel.findOne({
      _id: caseId,
      userId: session.user._id
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // If case number is being updated, check for duplicates within the same user
    if (body.caseNumber && body.caseNumber !== existingCase.caseNumber) {
      const duplicateCase = await CaseModel.findOne({
        caseNumber: body.caseNumber,
        userId: session.user._id,
        _id: { $ne: caseId }
      });

      if (duplicateCase) {
        return NextResponse.json(
          { error: "Case number already exists" },
          { status: 400 }
        );
      }
    }

    // Update the case
    const updatedCase = await CaseModel.findByIdAndUpdate(
      caseId,
      {
        ...body,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedCase);

  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id] - Delete a specific case
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const caseId = params.id;

    await dbConnect();

    // Validate ObjectId format
    if (!caseId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid case ID format" },
        { status: 400 }
      );
    }

    // Check if case exists and belongs to user
    const existingCase = await CaseModel.findOne({
      _id: caseId,
      userId: session.user._id
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Delete the case
    await CaseModel.findByIdAndDelete(caseId);

    return NextResponse.json(
      { message: "Case deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
