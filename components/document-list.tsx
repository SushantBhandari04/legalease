"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Download, Trash2, FileText, Eye, Calendar, User, Tag, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CaseDocument } from "@/model/Document"

interface DocumentListProps {
  caseId: string
}

export interface DocumentListRef {
  refreshDocuments: () => Promise<void>
}

export const DocumentList = forwardRef<DocumentListRef, DocumentListProps>(({ caseId }, ref) => {
  const [documents, setDocuments] = useState<CaseDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cases/${caseId}/documents`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch documents")
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error("Error loading documents:", err)
      setError("Failed to load documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (caseId) {
      loadDocuments()
    }
  }, [caseId])

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshDocuments: loadDocuments
  }))

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      setDownloadingDocId(docId)
      console.log("Starting download for:", fileName)
      const response = await fetch(`/api/cases/${caseId}/documents/${docId}`, {
        credentials: "include",
      })

      console.log("Download response status:", response.status)
      console.log("Download response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Download failed:", response.status, errorText)
        throw new Error(`Failed to download document: ${response.status}`)
      }

      const blob = await response.blob()
      console.log("Downloaded blob:", {
        size: blob.size,
        type: blob.type
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
    } catch (err) {
      console.error("Error downloading document:", err)
      setError("Failed to download document")
    } finally {
      setDownloadingDocId(null)
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      setDeletingDocId(docId)
      const response = await fetch(`/api/cases/${caseId}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      // Remove document from list
      setDocuments(docs => docs.filter(doc => doc._id !== docId))
    } catch (err) {
      console.error("Error deleting document:", err)
      setError("Failed to delete document")
    } finally {
      setDeletingDocId(null)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-500" />
    } else if (mimeType.includes('image')) {
      return <FileText className="h-8 w-8 text-green-500" />
    } else {
      return <FileText className="h-8 w-8 text-slate-500" />
    }
  }

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'pleading':
        return 'bg-blue-100 text-blue-800'
      case 'evidence':
        return 'bg-orange-100 text-orange-800'
      case 'correspondence':
        return 'bg-green-100 text-green-800'
      case 'judgment':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-slate-600">Loading documents...</span>
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

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No documents uploaded for this case.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc._id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0">
                  {getFileIcon(doc.mimeType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800 truncate">
                      {doc.originalName}
                    </h3>
                    <Badge className={getDocumentTypeColor(doc.documentType)}>
                      {doc.documentType}
                    </Badge>
                  </div>
                  
                  {doc.description && (
                    <p className="text-sm text-slate-600 mb-3">{doc.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(doc.uploadDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>{doc.downloadCount} downloads</span>
                    </div>
                    
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <span>{doc.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc._id, doc.originalName)}
                  disabled={downloadingDocId === doc._id}
                  className="border-teal-300 text-teal-600 hover:bg-teal-50"
                >
                  {downloadingDocId === doc._id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </>
                  )}
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingDocId === doc._id}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingDocId === doc._id && "Deleting..."}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Document</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{doc.originalName}"? This action cannot be undone.
                        The document will be permanently removed from the case.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(doc._id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Document
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

DocumentList.displayName = "DocumentList"
