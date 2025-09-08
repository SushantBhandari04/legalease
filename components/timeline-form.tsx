"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar, X, Loader2, Plus, Gavel, FileText, FileCheck, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { createTimelineEvent } from "@/lib/timeline"

const timelineFormSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string().min(1, "Event description is required"),
  eventDate: z.date({
    required_error: "Event date is required",
  }),
  eventType: z.enum(["filing", "hearing", "evidence", "document", "status_change", "custom"]),
  status: z.enum(["completed", "scheduled", "pending"]),
  notes: z.string().optional(),
})

type TimelineFormValues = z.infer<typeof timelineFormSchema>

interface TimelineFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  caseId: string
  editingEvent?: any | null
}

export function TimelineForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caseId,
  editingEvent 
}: TimelineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [eventDateOpen, setEventDateOpen] = useState(false)

  const form = useForm<TimelineFormValues>({
    resolver: zodResolver(timelineFormSchema),
    defaultValues: {
      title: editingEvent?.title || "",
      description: editingEvent?.description || "",
      eventDate: editingEvent?.eventDate ? new Date(editingEvent.eventDate) : new Date(),
      eventType: editingEvent?.eventType || "custom",
      status: editingEvent?.status || "completed",
      notes: editingEvent?.metadata?.notes || "",
    },
  })

  const onSubmit = async (values: TimelineFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const eventData = {
        title: values.title,
        description: values.description,
        eventDate: values.eventDate,
        eventType: values.eventType,
        status: values.status,
        metadata: {
          notes: values.notes,
        },
      }

      await createTimelineEvent(caseId, eventData)
      
      form.reset()
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error creating timeline event:", err)
      setError(err instanceof Error ? err.message : "Failed to create timeline event")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "filing":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "hearing":
        return <Gavel className="h-4 w-4 text-purple-500" />
      case "evidence":
        return <FileCheck className="h-4 w-4 text-orange-500" />
      case "document":
        return <FileText className="h-4 w-4 text-green-500" />
      case "status_change":
        return <AlertCircle className="h-4 w-4 text-indigo-500" />
      default:
        return <Calendar className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 border-0 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Plus className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-navy-900">
                {editingEvent ? "Edit Timeline Event" : "Add Timeline Event"}
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1">
                {editingEvent ? "Update the timeline event details" : "Add a new event to the case timeline"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-800">Event Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-slate-700 font-medium">Event Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., First Hearing, Evidence Submission"
                          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-300 focus:border-teal-500 focus:ring-teal-500">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="filing">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon("filing")}
                              <span>Filing</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hearing">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon("hearing")}
                              <span>Hearing</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="evidence">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon("evidence")}
                              <span>Evidence</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="document">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon("document")}
                              <span>Document</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="status_change">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon("status_change")}
                              <span>Status Change</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon("custom")}
                              <span>Custom</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-300 focus:border-teal-500 focus:ring-teal-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what happened or will happen in this event..."
                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500 min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-slate-700 font-medium">Event Date</FormLabel>
                    <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal border-slate-300 hover:bg-slate-50 focus:border-teal-500 focus:ring-teal-500 bg-gradient-to-r from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-200",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date)
                              setEventDateOpen(false)
                            }
                          }}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes or details..."
                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500 min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingEvent ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {editingEvent ? "Update Event" : "Add Event"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
