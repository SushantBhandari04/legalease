"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Filter, Search, SortAsc, SortDesc, Plus, Loader2, Upload } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaseTimeline } from "@/components/case-timeline"
import { DocumentList } from "@/components/document-list"
import { DocumentUpload } from "@/components/document-upload"
import { CaseForm } from "@/components/case-form"
import { fetchCases, CaseFilters } from "@/lib/cases"
import { Case } from "@/model/Case"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCaseFormOpen, setIsCaseFormOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  })

  // Fetch cases from API
  const loadCases = async (filters: CaseFilters = {}) => {
    if (status !== "authenticated") return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetchCases({
        status: filterStatus === "all" ? undefined : filterStatus,
        search: searchQuery || undefined,
        sortBy: "lastUpdated",
        sortOrder,
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      })
      
      setCases(response.cases)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases")
      console.error("Error loading cases:", err)
    } finally {
      setLoading(false)
    }
  }

  // Load cases on component mount and when filters change
  useEffect(() => {
    if (status === "authenticated") {
      loadCases()
    }
  }, [status, filterStatus, searchQuery, sortOrder, pagination.currentPage])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (status === "authenticated") {
        setPagination(prev => ({ ...prev, currentPage: 1 }))
        loadCases()
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Handle filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilterStatus(newFilter)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleSortChange = (newSort: "asc" | "desc") => {
    setSortOrder(newSort)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  // Handle case form
  const handleOpenCaseForm = (caseToEdit?: Case) => {
    setEditingCase(caseToEdit || null)
    setIsCaseFormOpen(true)
  }

  const handleCloseCaseForm = () => {
    setIsCaseFormOpen(false)
    setEditingCase(null)
  }

  const handleCaseFormSuccess = () => {
    loadCases() // Refresh the cases list
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Pending":
        return "bg-yellow-500"
      case "Delayed":
        return "bg-red-500"
      case "Completed":
        return "bg-blue-500"
      default:
        return "bg-slate-500"
    }
  }

  // Get stage color
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Filed":
        return "bg-purple-100 text-purple-800"
      case "Hearing":
        return "bg-blue-100 text-blue-800"
      case "Evidence":
        return "bg-yellow-100 text-yellow-800"
      case "Arguments":
        return "bg-orange-100 text-orange-800"
      case "Judgment":
        return "bg-green-100 text-green-800"
      case "Closed":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Case Tracker Dashboard</h1>
            <p className="text-slate-600">Track and manage your legal cases</p>
          </div>

          <Button 
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => handleOpenCaseForm()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Case
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search cases..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select value={filterStatus} onValueChange={handleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            {sortOrder === "asc" ? (
              <SortAsc className="h-4 w-4 text-slate-500" />
            ) : (
              <SortDesc className="h-4 w-4 text-slate-500" />
            )}
            <Select value={sortOrder} onValueChange={(value) => handleSortChange(value as "asc" | "desc")}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2 text-slate-600">Loading cases...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => loadCases()}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Case Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.length > 0 ? (
              cases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id || caseItem._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="h-full cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{caseItem.caseNumber}</CardTitle>
                        <p className="text-sm text-slate-600">{caseItem.court}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStageColor(caseItem.stage)}`}>
                        {caseItem.stage}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{caseItem.type}</span>
                        <span className="flex items-center">
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${getStatusColor(caseItem.status)}`}
                          />
                          {caseItem.status}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className={`bg-teal-600 h-2.5 rounded-full`} style={{ width: `${caseItem.progress}%` }} />
                      </div>

                      {/* Next hearing date if available */}
                      {caseItem.nextHearing && (
                        <div className="flex items-center text-xs text-slate-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          Next hearing: {new Date(caseItem.nextHearing).toLocaleDateString()}
                        </div>
                      )}

                      <div className="text-xs text-slate-500">
                        Last updated: {new Date(caseItem.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-slate-500">No cases found. Create your first case to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        )}

        {/* Case Timeline View */}
        {selectedCase && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Case Timeline: {selectedCase.caseNumber}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="timeline">
                  <TabsList className="mb-4">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="details">Case Details</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline">
                    <CaseTimeline caseData={selectedCase} />
                  </TabsContent>

                  <TabsContent value="details">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Case Number</h3>
                          <p>{selectedCase.caseNumber}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Court</h3>
                          <p>{selectedCase.court}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Case Type</h3>
                          <p>{selectedCase.type}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Status</h3>
                          <p>{selectedCase.status}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Current Stage</h3>
                          <p>{selectedCase.stage}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Last Updated</h3>
                          <p>{new Date(selectedCase.lastUpdated).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800">Case Documents</h3>
                        <Button
                          onClick={() => setIsDocumentUploadOpen(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                      <DocumentList caseId={selectedCase._id} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Case Form Modal */}
        <CaseForm
          isOpen={isCaseFormOpen}
          onClose={handleCloseCaseForm}
          onSuccess={handleCaseFormSuccess}
          editCase={editingCase}
        />

        {/* Document Upload Modal */}
        {selectedCase && (
          <DocumentUpload
            isOpen={isDocumentUploadOpen}
            onClose={() => setIsDocumentUploadOpen(false)}
            onSuccess={() => {
              // Documents will refresh automatically via DocumentList component
            }}
            caseId={selectedCase._id}
          />
        )}
      </div>
    </div>
  )
}
