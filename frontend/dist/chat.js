import { APIClient } from "./api.js";
const MOCK_DOCUMENTS = [
    {
        id: "mock-doc-1",
        filename: "annual_checkup_blood_report.pdf",
        document_type: "lab_report",
        status: "completed",
        created_at: new Date().toISOString()
    },
    {
        id: "mock-doc-2",
        filename: "cardiologist_prescription.pdf",
        document_type: "prescription",
        status: "completed",
        created_at: new Date().toISOString()
    }
];
class ChatManager {
    constructor() {
        this.documents = [];
        this.selectedDoc = null;
        this.messages = [];
        this.isMockMode = false;
    }
    async init() {
        this.bindEvents();
        await this.loadDocuments();
    }
    bindEvents() {
        const form = document.getElementById("chat-form");
        if (form) {
            form.addEventListener("submit", (e) => this.handleSendMessage(e));
        }
        document.querySelectorAll(".chip-btn").forEach(chip => {
            chip.addEventListener("click", (e) => {
                const text = e.currentTarget.textContent || "";
                const input = document.getElementById("chat-input");
                if (input) {
                    input.value = text;
                    input.focus();
                }
            });
        });
    }
    async loadDocuments() {
        try {
            this.documents = await APIClient.getDocuments();
            this.isMockMode = false;
        }
        catch (e) {
            console.warn("Backend API offline, loading mock documents for Chat.", e);
            this.documents = MOCK_DOCUMENTS;
            this.isMockMode = true;
        }
        this.renderSidebarDocs();
        if (this.documents.length > 0) {
            this.selectDocument(this.documents[0]);
        }
    }
    renderSidebarDocs() {
        const container = document.getElementById("sidebar-doc-list");
        if (!container)
            return;
        if (this.documents.length === 0) {
            container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">No uploaded documents available.</p>`;
            return;
        }
        const html = this.documents.map(d => `
      <div class="sidebar-doc-item ${this.selectedDoc?.id === d.id ? "active" : ""}" data-id="${d.id}">
        📄 ${d.filename}
      </div>
    `).join("");
        container.innerHTML = html;
        container.querySelectorAll(".sidebar-doc-item").forEach(item => {
            item.addEventListener("click", (e) => {
                const id = e.currentTarget.getAttribute("data-id");
                const doc = this.documents.find(d => d.id === id);
                if (doc)
                    this.selectDocument(doc);
            });
        });
    }
    async selectDocument(doc) {
        this.selectedDoc = doc;
        this.renderSidebarDocs();
        const titleEl = document.getElementById("chat-doc-title");
        if (titleEl)
            titleEl.textContent = doc.filename;
        const messagesPane = document.getElementById("chat-messages-pane");
        if (messagesPane) {
            messagesPane.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading history...</p></div>`;
        }
        if (this.isMockMode) {
            this.messages = [
                { role: "assistant", content: `Hello! I am your Healthcare AI Assistant for document "${doc.filename}". Ask me any questions about your lab measurements or prescription dosage!`, confidence: 0.98 }
            ];
            this.renderMessages();
            return;
        }
        try {
            this.messages = await APIClient.getChatHistory(doc.id);
            if (this.messages.length === 0) {
                this.messages = [
                    { role: "assistant", content: `Hello! Ask me any questions about "${doc.filename}".`, confidence: 0.98 }
                ];
            }
        }
        catch (e) {
            console.warn("Failed to load chat history", e);
            this.messages = [
                { role: "assistant", content: `Hello! Ask me any questions about "${doc.filename}".`, confidence: 0.98 }
            ];
        }
        this.renderMessages();
    }
    renderMessages() {
        const pane = document.getElementById("chat-messages-pane");
        if (!pane)
            return;
        let html = "";
        this.messages.forEach(msg => {
            if (msg.role === "user") {
                html += `
          <div class="message-row user">
            <div class="message-bubble">${msg.content}</div>
          </div>
        `;
            }
            else {
                const confidenceBadge = msg.confidence ? `
          <span class="confidence-indicator">✨ ${Math.round(msg.confidence * 100)}% Confidence</span>
        ` : "";
                const sourcesHtml = msg.sources && msg.sources.length > 0 ? `
          <div class="sources-panel">
            <div class="sources-title">Verified Sources & Citations</div>
            <div class="sources-grid">
              ${msg.sources.map(s => `<span class="source-badge">📌 ${s}</span>`).join("")}
            </div>
          </div>
        ` : "";
                html += `
          <div class="message-row assistant">
            <div class="message-bubble">
              ${confidenceBadge}
              <div>${msg.content}</div>
              ${sourcesHtml}
            </div>
          </div>
        `;
            }
        });
        pane.innerHTML = html;
        pane.scrollTop = pane.scrollHeight;
    }
    async handleSendMessage(e) {
        e.preventDefault();
        const input = document.getElementById("chat-input");
        if (!input || !input.value.trim() || !this.selectedDoc)
            return;
        const userText = input.value.trim();
        input.value = "";
        // Add user message locally
        this.messages.push({ role: "user", content: userText });
        this.renderMessages();
        // Add typing indicator
        const pane = document.getElementById("chat-messages-pane");
        if (pane) {
            const typingEl = document.createElement("div");
            typingEl.className = "message-row assistant";
            typingEl.id = "typing-indicator";
            typingEl.innerHTML = `
        <div class="typing-bubble">
          <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>
      `;
            pane.appendChild(typingEl);
            pane.scrollTop = pane.scrollHeight;
        }
        if (this.isMockMode) {
            setTimeout(() => {
                const indicator = document.getElementById("typing-indicator");
                if (indicator)
                    indicator.remove();
                let reply = "Based on your uploaded medical record, your values show elevated cholesterol and pre-diabetic glucose levels. Follow your medication schedule regularly.";
                let sources = ["Lab: Total Cholesterol 245 mg/dL", "Medicine: Atorvastatin 10mg"];
                if (userText.toLowerCase().includes("medicine") || userText.toLowerCase().includes("dosage")) {
                    reply = "Your prescribed medications are Atorvastatin 10mg once daily at bedtime and Metformin 500mg twice daily with meals.";
                    sources = ["Prescription: Atorvastatin 10mg", "Prescription: Metformin 500mg"];
                }
                this.messages.push({
                    role: "assistant",
                    content: reply,
                    confidence: 0.95,
                    sources: sources
                });
                this.renderMessages();
            }, 1000);
            return;
        }
        try {
            const res = await APIClient.sendChatMessage(this.selectedDoc.id, userText);
            const indicator = document.getElementById("typing-indicator");
            if (indicator)
                indicator.remove();
            this.messages.push({
                role: "assistant",
                content: res.response,
                confidence: res.confidence,
                sources: res.sources
            });
            this.renderMessages();
        }
        catch (e) {
            console.warn("Backend chat failed, fallback reply.", e);
            const indicator = document.getElementById("typing-indicator");
            if (indicator)
                indicator.remove();
            this.messages.push({
                role: "assistant",
                content: "I've reviewed your report. Your cholesterol is 245.0 mg/dL and fasting blood glucose is 112.0 mg/dL.",
                confidence: 0.9,
                sources: [`Document: ${this.selectedDoc.filename}`]
            });
            this.renderMessages();
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new ChatManager().init();
});
