"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Calendar, X, Loader2, Plus } from "lucide-react"

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
import { createCase } from "@/lib/cases"
import { Case } from "@/model/Case"

const caseFormSchema = z.object({
  caseNumber: z.string().min(1, "Case number is required"),
  title: z.string().min(1, "Case title is required"),
  court: z.string().min(1, "Court name is required"),
  type: z.string().min(1, "Case type is required"),
  stage: z.enum(["Filed", "Hearing", "Evidence", "Arguments", "Judgment", "Closed"]),
  status: z.enum(["Active", "Pending", "Delayed", "Completed"]),
  progress: z.number().min(0).max(100),
  description: z.string().optional(),
  clientName: z.string().optional(),
  opposingParty: z.string().optional(),
  caseValue: z.number().min(0).default(0),
  filingDate: z.date(),
  nextHearing: z.date().optional(),
  notes: z.string().optional(),
})

type CaseFormValues = z.infer<typeof caseFormSchema>

interface CaseFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editCase?: Case | null
}

export function CaseForm({ isOpen, onClose, onSuccess, editCase }: CaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filingDateOpen, setFilingDateOpen] = useState(false)
  const [nextHearingOpen, setNextHearingOpen] = useState(false)

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      caseNumber: editCase?.caseNumber || "",
      title: editCase?.title || "",
      court: editCase?.court || "",
      type: editCase?.type || "",
      stage: editCase?.stage || "Filed",
      status: editCase?.status || "Active",
      progress: editCase?.progress || 0,
      description: editCase?.description || "",
      clientName: editCase?.clientName || "",
      opposingParty: editCase?.opposingParty || "",
      caseValue: editCase?.caseValue || 0,
      filingDate: editCase?.filingDate ? new Date(editCase.filingDate) : new Date(),
      nextHearing: editCase?.nextHearing ? new Date(editCase.nextHearing) : undefined,
      notes: editCase?.notes || "",
    },
  })

  const onSubmit = async (values: CaseFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare data for API - convert 0 caseValue to undefined
      const apiData = {
        ...values,
        caseValue: values.caseValue === 0 ? undefined : values.caseValue
      }

      if (editCase) {
        // Update existing case
        const { updateCase } = await import("@/lib/cases")
        await updateCase(editCase._id, apiData)
      } else {
        // Create new case
        await createCase(apiData)
      }

      onSuccess()
      onClose()
      form.reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save case")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 border-0 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="space-y-3 pb-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Plus className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-navy-900">
                {editCase ? "Edit Case" : "Add New Case"}
              </DialogTitle>
              <p className="text-slate-600 text-sm mt-1">
                {editCase ? "Update case information and details" : "Create a new legal case entry"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-navy-900">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="caseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Case Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., CWP-1234/2023" 
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Case Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief case description" 
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
                  name="court"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Court *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Delhi High Court" 
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Case Type *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Civil Writ Petition" 
                          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                          {...field} 
                        />
                      </FormControl>
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
                      placeholder="Detailed case description..."
                      className="min-h-[80px] border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                      {...field} 
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Case Details */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-6 bg-navy-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-navy-900">Case Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Client Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Client name" 
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
                  name="opposingParty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Opposing Party</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Opposing party name" 
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
                  name="caseValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Case Value (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Progress (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100"
                          placeholder="0"
                          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Status and Dates */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-6 bg-teal-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-navy-900">Status and Dates</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Current Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-300 focus:border-teal-500 focus:ring-teal-500">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Filed">Filed</SelectItem>
                          <SelectItem value="Hearing">Hearing</SelectItem>
                          <SelectItem value="Evidence">Evidence</SelectItem>
                          <SelectItem value="Arguments">Arguments</SelectItem>
                          <SelectItem value="Judgment">Judgment</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
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
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Delayed">Delayed</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="filingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-slate-700 font-medium">Filing Date</FormLabel>
                      <Popover open={filingDateOpen} onOpenChange={setFilingDateOpen}>
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
                              console.log("Filing date selected:", date)
                              if (date) {
                                field.onChange(date)
                                setFilingDateOpen(false)
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(23, 59, 59, 999) // End of today
                              return date > today || date < new Date("1900-01-01")
                            }}
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-slate-500 mt-1">
                        Select a date on or before today
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextHearing"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-slate-700 font-medium">Next Hearing Date</FormLabel>
                      <Popover open={nextHearingOpen} onOpenChange={setNextHearingOpen}>
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
                              console.log("Next hearing date selected:", date)
                              if (date) {
                                field.onChange(date)
                                setNextHearingOpen(false)
                              }
                            }}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0) // Start of today
                              return date < today || date < new Date("1900-01-01")
                            }}
                            initialFocus
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-slate-500 mt-1">
                        Select a date on or after today
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-2">
                <div className="w-1 h-6 bg-slate-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-navy-900">Additional Notes</h3>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-medium">Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about the case..."
                        className="min-h-[100px] border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editCase ? "Update Case" : "Create Case"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
