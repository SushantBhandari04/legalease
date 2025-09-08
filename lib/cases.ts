import { Case } from "@/model/Case";

export interface CasesResponse {
  cases: Case[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface CaseFilters {
  status?: string;
  stage?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Fetch all cases for the current user
export async function fetchCases(filters: CaseFilters = {}): Promise<CasesResponse> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append("status", filters.status);
  if (filters.stage) params.append("stage", filters.stage);
  if (filters.search) params.append("search", filters.search);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());

  const response = await fetch(`/api/cases?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch cases");
  }

  return response.json();
}

// Fetch a specific case by ID
export async function fetchCase(caseId: string): Promise<Case> {
  const response = await fetch(`/api/cases/${caseId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch case");
  }

  return response.json();
}

// Create a new case
export async function createCase(caseData: Partial<Case>): Promise<Case> {
  const response = await fetch("/api/cases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(caseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create case");
  }

  return response.json();
}

// Update an existing case
export async function updateCase(caseId: string, caseData: Partial<Case>): Promise<Case> {
  const response = await fetch(`/api/cases/${caseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(caseData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update case");
  }

  return response.json();
}

// Delete a case
export async function deleteCase(caseId: string): Promise<void> {
  const response = await fetch(`/api/cases/${caseId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete case");
  }
}
