import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CaseModel from "@/model/Case";
import TimelineEventModel from "@/model/TimelineEvent";

// DELETE /api/cases/[id]/timeline/[eventId] - Delete a timeline event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Validate ObjectId format
    if (!params.id.match(/^[0-9a-fA-F]{24}$/) || !params.eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Verify case exists and belongs to user
    const caseData = await CaseModel.findOne({
      _id: params.id,
      userId: session.user._id
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Find and delete the timeline event
    const timelineEvent = await TimelineEventModel.findOneAndDelete({
      _id: params.eventId,
      caseId: params.id,
      userId: session.user._id
    });

    if (!timelineEvent) {
      return NextResponse.json({ error: "Timeline event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Timeline event deleted successfully" });
  } catch (error) {
    console.error("Error deleting timeline event:", error);
    return NextResponse.json(
      { error: "Failed to delete timeline event" },
      { status: 500 }
    );
  }
}

// PUT /api/cases/[id]/timeline/[eventId] - Update a timeline event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Validate ObjectId format
    if (!params.id.match(/^[0-9a-fA-F]{24}$/) || !params.eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    // Verify case exists and belongs to user
    const caseData = await CaseModel.findOne({
      _id: params.id,
      userId: session.user._id
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, eventDate, eventType, status, metadata } = body;

    // Validate required fields
    if (!title || !description || !eventDate || !eventType) {
      return NextResponse.json(
        { error: "Title, description, event date, and event type are required" },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ["filing", "hearing", "evidence", "document", "status_change", "custom"];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ["completed", "scheduled", "pending"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
    }

    // Update the timeline event
    const updatedEvent = await TimelineEventModel.findOneAndUpdate(
      {
        _id: params.eventId,
        caseId: params.id,
        userId: session.user._id
      },
      {
        title,
        description,
        eventDate: new Date(eventDate),
        eventType,
        status: status || "completed",
        metadata,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return NextResponse.json({ error: "Timeline event not found" }, { status: 404 });
    }

    return NextResponse.json({ timelineEvent: updatedEvent });
  } catch (error) {
    console.error("Error updating timeline event:", error);
    return NextResponse.json(
      { error: "Failed to update timeline event" },
      { status: 500 }
    );
  }
}
