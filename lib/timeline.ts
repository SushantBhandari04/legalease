import { TimelineEvent } from "@/model/TimelineEvent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Fetch timeline events for a case
export async function fetchTimelineEvents(caseId: string): Promise<TimelineEvent[]> {
  try {
    const response = await fetch(`${API_BASE}/api/cases/${caseId}/timeline`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch timeline events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.timelineEvents || [];
  } catch (error) {
    console.error("Error fetching timeline events:", error);
    throw error;
  }
}

// Create a new timeline event
export async function createTimelineEvent(
  caseId: string,
  eventData: {
    title: string;
    description: string;
    eventDate: Date;
    eventType: "filing" | "hearing" | "evidence" | "document" | "status_change" | "custom";
    status?: "completed" | "scheduled" | "pending";
    metadata?: {
      stage?: string;
      status?: string;
      progress?: number;
      documentUrl?: string;
      notes?: string;
    };
  }
): Promise<TimelineEvent> {
  try {
    const response = await fetch(`${API_BASE}/api/cases/${caseId}/timeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create timeline event: ${response.statusText}`);
    }

    const data = await response.json();
    return data.timelineEvent;
  } catch (error) {
    console.error("Error creating timeline event:", error);
    throw error;
  }
}

// Generate initial timeline events when a case is created
export function generateInitialTimelineEvents(caseData: {
  _id: string;
  caseNumber: string;
  title: string;
  filingDate: Date;
  stage: string;
  status: string;
  nextHearing?: Date;
}): Array<{
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
}> {
  const events = [];

  // Always add filing event
  events.push({
    title: "Case Filed",
    description: `Case ${caseData.caseNumber} filed with the court`,
    eventDate: caseData.filingDate,
    eventType: "filing" as const,
    status: "completed" as const,
    metadata: {
      stage: "Filed",
      status: caseData.status,
      progress: 10
    }
  });

  // Add next hearing if scheduled
  if (caseData.nextHearing) {
    events.push({
      title: "Next Hearing Scheduled",
      description: `Next hearing scheduled for ${caseData.nextHearing.toLocaleDateString()}`,
      eventDate: caseData.nextHearing,
      eventType: "hearing" as const,
      status: "scheduled" as const,
      metadata: {
        stage: caseData.stage,
        status: caseData.status,
        progress: 20
      }
    });
  }

  // Add stage-specific events
  if (caseData.stage === "Hearing") {
    events.push({
      title: "First Hearing Completed",
      description: "Preliminary hearing conducted",
      eventDate: new Date(caseData.filingDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after filing
      eventType: "hearing" as const,
      status: "completed" as const,
      metadata: {
        stage: "Hearing",
        status: caseData.status,
        progress: 30
      }
    });
  } else if (caseData.stage === "Evidence") {
    events.push({
      title: "Evidence Phase Started",
      description: "Case moved to evidence collection phase",
      eventDate: new Date(caseData.filingDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days after filing
      eventType: "evidence" as const,
      status: "completed" as const,
      metadata: {
        stage: "Evidence",
        status: caseData.status,
        progress: 50
      }
    });
  } else if (caseData.stage === "Arguments") {
    events.push({
      title: "Arguments Phase Started",
      description: "Case moved to arguments phase",
      eventDate: new Date(caseData.filingDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days after filing
      eventType: "status_change" as const,
      status: "completed" as const,
      metadata: {
        stage: "Arguments",
        status: caseData.status,
        progress: 70
      }
    });
  } else if (caseData.stage === "Judgment") {
    events.push({
      title: "Judgment Reserved",
      description: "Court has reserved judgment",
      eventDate: new Date(caseData.filingDate.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days after filing
      eventType: "status_change" as const,
      status: "completed" as const,
      metadata: {
        stage: "Judgment",
        status: caseData.status,
        progress: 90
      }
    });
  } else if (caseData.stage === "Closed") {
    events.push({
      title: "Case Closed",
      description: "Case has been closed",
      eventDate: new Date(caseData.filingDate.getTime() + 150 * 24 * 60 * 60 * 1000), // 150 days after filing
      eventType: "status_change" as const,
      status: "completed" as const,
      metadata: {
        stage: "Closed",
        status: "Completed",
        progress: 100
      }
    });
  }

  return events;
}
