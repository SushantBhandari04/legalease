import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CaseModel from "@/model/Case";
import TimelineEventModel from "@/model/TimelineEvent";
import { generateInitialTimelineEvents } from "@/lib/timeline";

// GET /api/cases - Fetch all cases for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "lastUpdated";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build filter object
    const filter: any = { userId: session.user._id };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (stage && stage !== "all") {
      filter.stage = stage;
    }

    if (search) {
      filter.$or = [
        { caseNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { court: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Fetch cases with pagination
    const cases = await CaseModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await CaseModel.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      cases,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?._id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ["caseNumber", "title", "court", "type"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    await dbConnect();

    // Check if case number already exists
    const existingCase = await CaseModel.findOne({ 
      caseNumber: body.caseNumber,
      userId: session.user._id
    });

    if (existingCase) {
      return NextResponse.json(
        { error: "Case number already exists" },
        { status: 400 }
      );
    }

    // Create new case
    const newCase = new CaseModel({
      ...body,
      userId: session.user._id,
      lastUpdated: new Date()
    });

    const savedCase = await newCase.save();

    // Generate initial timeline events
    try {
      const initialEvents = generateInitialTimelineEvents({
        _id: savedCase._id.toString(),
        caseNumber: savedCase.caseNumber,
        title: savedCase.title,
        filingDate: savedCase.filingDate,
        stage: savedCase.stage,
        status: savedCase.status,
        nextHearing: savedCase.nextHearing
      });

      // Create timeline events
      const timelineEvents = initialEvents.map(event => ({
        ...event,
        caseId: savedCase._id.toString(),
        userId: session.user._id
      }));

      await TimelineEventModel.insertMany(timelineEvents);
    } catch (timelineError) {
      console.error("Error creating initial timeline events:", timelineError);
      // Don't fail the case creation if timeline events fail
    }

    return NextResponse.json(savedCase, { status: 201 });

  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
