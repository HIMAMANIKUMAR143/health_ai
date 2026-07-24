export const API_BASE_URL = "http://localhost:8000";

export interface Document {
  id: string;
  filename: string;
  document_type: string;
  description?: string;
  status: string;
  created_at: string;
  extracted_text?: string;
}

export interface LabValue {
  name: string;
  value: number;
  unit: string;
  reference_range: string;
  is_abnormal: boolean;
}

export interface MedicineEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  indication?: string;
}

export interface DocumentAnalysis {
  document_id: string;
  summary: string;
  key_findings: string[];
  lab_values: LabValue[];
  medicines: MedicineEntry[];
  recommendations: string[];
  confidence_score: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: string[];
}

export interface ChatResponse {
  response: string;
  confidence: number;
  sources: string[];
  citations: any[];
}

export interface HealthTrendPoint {
  date: string;
  cholesterol: number;
  glucose: number;
  report: string;
}

export interface ComparisonResult {
  doc1_name: string;
  doc1_date: string;
  doc2_name: string;
  doc2_date: string;
  comparison: Array<{
    test_name: string;
    doc1_value: number | null;
    doc1_unit: string;
    doc1_abnormal: boolean;
    doc2_value: number | null;
    doc2_unit: string;
    doc2_abnormal: boolean;
    reference_range: string;
  }>;
}

export class APIClient {
  static async getDocuments(): Promise<Document[]> {
    const res = await fetch(`${API_BASE_URL}/api/documents`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  }

  static async getDocumentById(id: string): Promise<Document> {
    const res = await fetch(`${API_BASE_URL}/api/documents/${id}`);
    if (!res.ok) throw new Error("Failed to fetch document detail");
    return res.json();
  }

  static async uploadDocument(formData: FormData): Promise<Document> {
    const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  }

  static async deleteDocument(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    return res.json();
  }

  static async analyzeDocument(id: string): Promise<DocumentAnalysis> {
    const res = await fetch(`${API_BASE_URL}/api/documents/${id}/analyze`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Analysis failed");
    return res.json();
  }

  static async sendChatMessage(documentId: string, message: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: documentId, message }),
    });
    if (!res.ok) throw new Error("Chat message failed");
    return res.json();
  }

  static async getChatHistory(documentId: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE_URL}/api/chat/history/${documentId}`);
    if (!res.ok) throw new Error("Chat history failed");
    return res.json();
  }

  static async getHealthTrends(): Promise<HealthTrendPoint[]> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/trends`);
    if (!res.ok) throw new Error("Health trends failed");
    return res.json();
  }

  static async getMedicines(): Promise<MedicineEntry[]> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/medicines`);
    if (!res.ok) throw new Error("Medicines tracker failed");
    return res.json();
  }

  static async getComparison(doc1Id: string, doc2Id: string): Promise<ComparisonResult> {
    const res = await fetch(`${API_BASE_URL}/api/analytics/compare?doc1=${doc1Id}&doc2=${doc2Id}`);
    if (!res.ok) throw new Error("Comparison failed");
    return res.json();
  }
}
