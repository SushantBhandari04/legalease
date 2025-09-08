import { CheckCircle2, Clock, FileText, Calendar, Gavel, FileCheck, AlertCircle, Plus } from "lucide-react"
import { Case } from "@/model/Case"
import { TimelineEvent } from "@/model/TimelineEvent"
import { fetchTimelineEvents } from "@/lib/timeline"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { TimelineForm } from "@/components/timeline-form"

type TimelineEventDisplay = {
  date: string
  title: string
  description: string
  status: "completed" | "current" | "upcoming"
  eventType: string
  icon: React.ReactNode
}

export function CaseTimeline({ caseData }: { caseData: Case }) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTimelineFormOpen, setIsTimelineFormOpen] = useState(false)

  useEffect(() => {
    const loadTimelineEvents = async () => {
      try {
        setLoading(true)
        const events = await fetchTimelineEvents(caseData._id)
        setTimelineEvents(events)
      } catch (err) {
        console.error("Error loading timeline events:", err)
        setError("Failed to load timeline events")
      } finally {
        setLoading(false)
      }
    }

    if (caseData._id) {
      loadTimelineEvents()
    }
  }, [caseData._id])

  // Get icon for event type
  const getEventIcon = (eventType: string, status: string) => {
    const iconClass = "h-5 w-5"
    
    switch (eventType) {
      case "filing":
        return <FileText className={`${iconClass} text-blue-500`} />
      case "hearing":
        return <Gavel className={`${iconClass} text-purple-500`} />
      case "evidence":
        return <FileCheck className={`${iconClass} text-orange-500`} />
      case "document":
        return <FileText className={`${iconClass} text-green-500`} />
      case "status_change":
        return <AlertCircle className={`${iconClass} text-indigo-500`} />
      default:
        return <Calendar className={`${iconClass} text-slate-500`} />
    }
  }

  // Convert timeline events to display format
  const displayEvents: TimelineEventDisplay[] = timelineEvents.map(event => {
    const eventDate = new Date(event.eventDate)
    const isValidDate = !isNaN(eventDate.getTime())
    
    return {
      date: isValidDate ? eventDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      title: event.title,
      description: event.description,
      status: event.status === "completed" ? "completed" : 
              event.status === "scheduled" ? "upcoming" : "current",
      eventType: event.eventType,
      icon: getEventIcon(event.eventType, event.status)
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-slate-600">Loading timeline...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const handleTimelineFormSuccess = () => {
    // Reload timeline events after adding a new one
    const loadTimelineEvents = async () => {
      try {
        const events = await fetchTimelineEvents(caseData._id)
        setTimelineEvents(events)
      } catch (err) {
        console.error("Error loading timeline events:", err)
        setError("Failed to load timeline events")
      }
    }
    loadTimelineEvents()
  }

  if (displayEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Timeline Events</h3>
          <Button
            onClick={() => setIsTimelineFormOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No timeline events found for this case.</p>
          <Button
            onClick={() => setIsTimelineFormOpen(true)}
            variant="outline"
            className="border-teal-300 text-teal-600 hover:bg-teal-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Event
          </Button>
        </div>
        <TimelineForm
          isOpen={isTimelineFormOpen}
          onClose={() => setIsTimelineFormOpen(false)}
          onSuccess={handleTimelineFormSuccess}
          caseId={caseData._id}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Timeline Events</h3>
        <Button
          onClick={() => setIsTimelineFormOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-8">
        {displayEvents.map((event, index) => (
          <div key={index} className="relative flex items-start gap-4">
            <div className="absolute left-7 top-7 bottom-0 w-0.5 bg-slate-200" />

            <div className="flex flex-col items-center">
              <div className="w-14 text-xs text-slate-500 text-center">
                {new Date(event.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
              <div
                className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border ${
                  event.status === "completed"
                    ? "bg-green-100 border-green-500"
                    : event.status === "current"
                      ? "bg-blue-100 border-blue-500"
                      : "bg-slate-100 border-slate-300"
                }`}
              >
                {event.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : event.status === "current" ? (
                  <Clock className="h-5 w-5 text-blue-500" />
                ) : (
                  event.icon
                )}
              </div>
            </div>

            <div
              className={`flex-1 rounded-lg border p-4 ${
                event.status === "completed"
                  ? "bg-green-50 border-green-100"
                  : event.status === "current"
                    ? "bg-blue-50 border-blue-100"
                    : "bg-slate-50 border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-medium ${
                    event.status === "completed"
                      ? "text-green-800"
                      : event.status === "current"
                        ? "text-blue-800"
                        : "text-slate-800"
                  }`}
                >
                  {event.title}
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-200 text-slate-600">
                  {event.eventType}
                </span>
              </div>
              <p className="text-sm text-slate-600">{event.description}</p>
            </div>
          </div>
        ))}
        </div>
      </div>

      <TimelineForm
        isOpen={isTimelineFormOpen}
        onClose={() => setIsTimelineFormOpen(false)}
        onSuccess={handleTimelineFormSuccess}
        caseId={caseData._id}
      />
    </div>
  )
}
