"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, X, Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const documentUploadSchema = z.object({
  documentType: z.enum(["pleading", "evidence", "correspondence", "judgment", "other"]),
  description: z.string().optional(),
  tags: z.string().optional(),
})

type DocumentUploadValues = z.infer<typeof documentUploadSchema>

interface DocumentUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  caseId: string
}

export function DocumentUpload({ 
  isOpen, 
  onClose, 
  onSuccess, 
  caseId 
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const form = useForm<DocumentUploadValues>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      documentType: "other",
      description: "",
      tags: "",
    },
  })

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadedFile(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'doc':
      case 'docx':
        return <FileText className="h-8 w-8 text-blue-500" />
      case 'txt':
        return <FileText className="h-8 w-8 text-gray-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText className="h-8 w-8 text-green-500" />
      default:
        return <FileText className="h-8 w-8 text-slate-500" />
    }
  }

  const onSubmit = async (values: DocumentUploadValues) => {
    if (!uploadedFile) {
      setError("Please select a file to upload")
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("documentType", values.documentType)
      formData.append("description", values.description || "")
      formData.append("tags", values.tags || "")

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload document")
      }

      // Reset form and close dialog
      form.reset()
      setUploadedFile(null)
      setUploadProgress(0)
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error uploading document:", err)
      setError(err instanceof Error ? err.message : "Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50 border-0 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Upload className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-navy-900">
                Upload Document
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1">
                Upload a document for this case
              </p>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* File Upload Area */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-800">File Selection</h3>
              </div>

              {!uploadedFile ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    isDragOver
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-300 hover:border-slate-400"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-700 mb-2">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-sm text-slate-500 mb-4">
                    Supports PDF, DOC, DOCX, TXT, JPG, PNG, GIF (max 10MB)
                  </p>
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="border-teal-300 text-teal-600 hover:bg-teal-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadedFile.name)}
                      <div>
                        <p className="font-medium text-slate-700">{uploadedFile.name}</p>
                        <p className="text-sm text-slate-500">{formatFileSize(uploadedFile.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {isUploading && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document Details */}
            <div className="space-y-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-800">Document Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-300 focus:border-teal-500 focus:ring-teal-500">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pleading">Pleading</SelectItem>
                          <SelectItem value="evidence">Evidence</SelectItem>
                          <SelectItem value="correspondence">Correspondence</SelectItem>
                          <SelectItem value="judgment">Judgment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., urgent, confidential, draft"
                          className="border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-slate-500">Separate multiple tags with commas</p>
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
                    <FormLabel className="text-slate-700 font-medium">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the document content or purpose..."
                        className="border-slate-300 focus:border-teal-500 focus:ring-teal-500 min-h-[100px]"
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
                disabled={isUploading}
                className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !uploadedFile}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
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
