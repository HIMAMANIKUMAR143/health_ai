export const API_BASE_URL = "http://localhost:8000";
export class APIClient {
    static async getDocuments() {
        const res = await fetch(`${API_BASE_URL}/api/documents`);
        if (!res.ok)
            throw new Error("Failed to fetch documents");
        return res.json();
    }
    static async getDocumentById(id) {
        const res = await fetch(`${API_BASE_URL}/api/documents/${id}`);
        if (!res.ok)
            throw new Error("Failed to fetch document detail");
        return res.json();
    }
    static async uploadDocument(formData) {
        const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
            method: "POST",
            body: formData,
        });
        if (!res.ok)
            throw new Error("Upload failed");
        return res.json();
    }
    static async deleteDocument(id) {
        const res = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
            method: "DELETE",
        });
        if (!res.ok)
            throw new Error("Delete failed");
        return res.json();
    }
    static async analyzeDocument(id) {
        const res = await fetch(`${API_BASE_URL}/api/documents/${id}/analyze`, {
            method: "POST",
        });
        if (!res.ok)
            throw new Error("Analysis failed");
        return res.json();
    }
    static async sendChatMessage(documentId, message) {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ document_id: documentId, message }),
        });
        if (!res.ok)
            throw new Error("Chat message failed");
        return res.json();
    }
    static async getChatHistory(documentId) {
        const res = await fetch(`${API_BASE_URL}/api/chat/history/${documentId}`);
        if (!res.ok)
            throw new Error("Chat history failed");
        return res.json();
    }
    static async getHealthTrends() {
        const res = await fetch(`${API_BASE_URL}/api/analytics/trends`);
        if (!res.ok)
            throw new Error("Health trends failed");
        return res.json();
    }
    static async getMedicines() {
        const res = await fetch(`${API_BASE_URL}/api/analytics/medicines`);
        if (!res.ok)
            throw new Error("Medicines tracker failed");
        return res.json();
    }
    static async getComparison(doc1Id, doc2Id) {
        const res = await fetch(`${API_BASE_URL}/api/analytics/compare?doc1=${doc1Id}&doc2=${doc2Id}`);
        if (!res.ok)
            throw new Error("Comparison failed");
        return res.json();
    }
}
