import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CaseModel from "@/model/Case";
import TimelineEventModel from "@/model/TimelineEvent";

// GET /api/cases/[id]/timeline - Get timeline events for a case
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Verify case exists and belongs to user
    const caseData = await CaseModel.findOne({
      _id: params.id,
      userId: session.user._id
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Get timeline events for this case
    const timelineEvents = await TimelineEventModel.find({
      caseId: params.id,
      userId: session.user._id
    }).sort({ eventDate: 1 }); // Sort from oldest to newest (ascending order)

    return NextResponse.json({ timelineEvents });
  } catch (error) {
    console.error("Error fetching timeline events:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline events" },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/timeline - Create a new timeline event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

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

    // Create new timeline event
    const timelineEvent = new TimelineEventModel({
      caseId: params.id,
      title,
      description,
      eventDate: new Date(eventDate),
      eventType,
      status: status || "completed",
      metadata,
      userId: session.user._id
    });

    await timelineEvent.save();

    return NextResponse.json({ timelineEvent }, { status: 201 });
  } catch (error) {
    console.error("Error creating timeline event:", error);
    return NextResponse.json(
      { error: "Failed to create timeline event" },
      { status: 500 }
    );
  }
}
