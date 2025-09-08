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

// Delete a timeline event
export async function deleteTimelineEvent(
  caseId: string,
  eventId: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/cases/${caseId}/timeline/${eventId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete timeline event: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting timeline event:", error);
    throw error;
  }
}

// Update a timeline event
export async function updateTimelineEvent(
  caseId: string,
  eventId: string,
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
    const response = await fetch(`${API_BASE}/api/cases/${caseId}/timeline/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update timeline event: ${response.statusText}`);
    }

    const data = await response.json();
    return data.timelineEvent;
  } catch (error) {
    console.error("Error updating timeline event:", error);
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
  try {
    // Validate required fields
    if (!caseData.caseNumber || !caseData.filingDate) {
      console.error("Missing required fields for timeline generation:", caseData);
      return [];
    }

    // Ensure filingDate is a valid Date object
    const filingDate = new Date(caseData.filingDate);
    if (isNaN(filingDate.getTime())) {
      console.error("Invalid filing date:", caseData.filingDate);
      return [];
    }

    const events = [];

    // Always add filing event
    events.push({
      title: "Case Filed",
      description: `Case ${caseData.caseNumber} filed with the court`,
      eventDate: filingDate,
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
      const nextHearingDate = new Date(caseData.nextHearing);
      if (!isNaN(nextHearingDate.getTime())) {
        events.push({
          title: "Next Hearing Scheduled",
          description: `Next hearing scheduled for ${nextHearingDate.toLocaleDateString()}`,
          eventDate: nextHearingDate,
          eventType: "hearing" as const,
          status: "scheduled" as const,
          metadata: {
            stage: caseData.stage,
            status: caseData.status,
            progress: 20
          }
        });
      }
    }

    // Add stage-specific events based on current stage
    const currentStage = caseData.stage?.toLowerCase();
    
    // if (currentStage === "filed") {
    //   // Case is newly filed, no additional events needed
    //   return events;
    // } else if (currentStage === "hearing") {
    //   events.push({
    //     title: "First Hearing Completed",
    //     description: "Preliminary hearing conducted",
    //     eventDate: new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after filing
    //     eventType: "hearing" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Hearing",
    //       status: caseData.status,
    //       progress: 30
    //     }
    //   });
    // } else if (currentStage === "evidence") {
    //   // Add hearing completion event
    //   events.push({
    //     title: "First Hearing Completed",
    //     description: "Preliminary hearing conducted",
    //     eventDate: new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    //     eventType: "hearing" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Hearing",
    //       status: caseData.status,
    //       progress: 30
    //     }
    //   });
      
    //   // Add evidence phase event
    //   events.push({
    //     title: "Evidence Phase Started",
    //     description: "Case moved to evidence collection phase",
    //     eventDate: new Date(filingDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days after filing
    //     eventType: "evidence" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Evidence",
    //       status: caseData.status,
    //       progress: 50
    //     }
    //   });
    // } else if (currentStage === "arguments") {
    //   // Add previous stage events
    //   events.push({
    //     title: "First Hearing Completed",
    //     description: "Preliminary hearing conducted",
    //     eventDate: new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    //     eventType: "hearing" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Hearing",
    //       status: caseData.status,
    //       progress: 30
    //     }
    //   });
      
    //   events.push({
    //     title: "Evidence Phase Started",
    //     description: "Case moved to evidence collection phase",
    //     eventDate: new Date(filingDate.getTime() + 60 * 24 * 60 * 60 * 1000),
    //     eventType: "evidence" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Evidence",
    //       status: caseData.status,
    //       progress: 50
    //     }
    //   });
      
    //   // Add arguments phase event
    //   events.push({
    //     title: "Arguments Phase Started",
    //     description: "Case moved to arguments phase",
    //     eventDate: new Date(filingDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 90 days after filing
    //     eventType: "status_change" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Arguments",
    //       status: caseData.status,
    //       progress: 70
    //     }
    //   });
    // } else if (currentStage === "judgment") {
    //   // Add all previous stage events
    //   events.push({
    //     title: "First Hearing Completed",
    //     description: "Preliminary hearing conducted",
    //     eventDate: new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    //     eventType: "hearing" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Hearing",
    //       status: caseData.status,
    //       progress: 30
    //     }
    //   });
      
    //   events.push({
    //     title: "Evidence Phase Started",
    //     description: "Case moved to evidence collection phase",
    //     eventDate: new Date(filingDate.getTime() + 60 * 24 * 60 * 60 * 1000),
    //     eventType: "evidence" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Evidence",
    //       status: caseData.status,
    //       progress: 50
    //     }
    //   });
      
    //   events.push({
    //     title: "Arguments Phase Started",
    //     description: "Case moved to arguments phase",
    //     eventDate: new Date(filingDate.getTime() + 90 * 24 * 60 * 60 * 1000),
    //     eventType: "status_change" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Arguments",
    //       status: caseData.status,
    //       progress: 70
    //     }
    //   });
      
    //   // Add judgment event
    //   events.push({
    //     title: "Judgment Reserved",
    //     description: "Court has reserved judgment",
    //     eventDate: new Date(filingDate.getTime() + 120 * 24 * 60 * 60 * 1000), // 120 days after filing
    //     eventType: "status_change" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Judgment",
    //       status: caseData.status,
    //       progress: 90
    //     }
    //   });
    // } else if (currentStage === "closed") {
    //   // Add all previous stage events
    //   events.push({
    //     title: "First Hearing Completed",
    //     description: "Preliminary hearing conducted",
    //     eventDate: new Date(filingDate.getTime() + 30 * 24 * 60 * 60 * 1000),
    //     eventType: "hearing" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Hearing",
    //       status: caseData.status,
    //       progress: 30
    //     }
    //   });
      
    //   events.push({
    //     title: "Evidence Phase Started",
    //     description: "Case moved to evidence collection phase",
    //     eventDate: new Date(filingDate.getTime() + 60 * 24 * 60 * 60 * 1000),
    //     eventType: "evidence" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Evidence",
    //       status: caseData.status,
    //       progress: 50
    //     }
    //   });
      
    //   events.push({
    //     title: "Arguments Phase Started",
    //     description: "Case moved to arguments phase",
    //     eventDate: new Date(filingDate.getTime() + 90 * 24 * 60 * 60 * 1000),
    //     eventType: "status_change" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Arguments",
    //       status: caseData.status,
    //       progress: 70
    //     }
    //   });
      
    //   events.push({
    //     title: "Judgment Reserved",
    //     description: "Court has reserved judgment",
    //     eventDate: new Date(filingDate.getTime() + 120 * 24 * 60 * 60 * 1000),
    //     eventType: "status_change" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Judgment",
    //       status: caseData.status,
    //       progress: 90
    //     }
    //   });
      
    //   // Add case closed event
    //   events.push({
    //     title: "Case Closed",
    //     description: "Case has been closed",
    //     eventDate: new Date(filingDate.getTime() + 150 * 24 * 60 * 60 * 1000), // 150 days after filing
    //     eventType: "status_change" as const,
    //     status: "completed" as const,
    //     metadata: {
    //       stage: "Closed",
    //       status: "Completed",
    //       progress: 100
    //     }
    //   });
    // }

    return events;
  } catch (error) {
    console.error("Error generating initial timeline events:", error);
    // Return at least the filing event if possible
    try {
      const filingDate = new Date(caseData.filingDate);
      if (!isNaN(filingDate.getTime())) {
        return [{
          title: "Case Filed",
          description: `Case ${caseData.caseNumber} filed with the court`,
          eventDate: filingDate,
          eventType: "filing" as const,
          status: "completed" as const,
          metadata: {
            stage: "Filed",
            status: caseData.status,
            progress: 10
          }
        }];
      }
    } catch (fallbackError) {
      console.error("Error creating fallback timeline event:", fallbackError);
    }
    return [];
  }
}
