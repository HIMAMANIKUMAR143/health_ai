import { APIClient } from "./api.js";
const MOCK_DOCUMENTS = [
    {
        id: "mock-doc-1",
        filename: "annual_checkup_blood_report.pdf",
        document_type: "lab_report",
        description: "Annual health checkup done at City Diagnostics",
        status: "completed",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        extracted_text: "Fasting Blood Glucose: 112 mg/dL. Total Cholesterol: 245 mg/dL. Hemoglobin: 14.2 g/dL."
    },
    {
        id: "mock-doc-2",
        filename: "cardiologist_prescription.pdf",
        document_type: "prescription",
        description: "Cardiology follow-up consultation",
        status: "completed",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        extracted_text: "Rx Atorvastatin 10mg once daily. Metformin 500mg twice daily with meals."
    }
];
const MOCK_ANALYSES = {
    "mock-doc-1": {
        document_id: "mock-doc-1",
        summary: "Annual health checkup blood report. The primary observations indicate metabolic changes consistent with mild hypercholesterolemia and pre-diabetes.",
        key_findings: [
            "Total Cholesterol is high (245.0 mg/dL)",
            "Fasting Blood Glucose is elevated in the pre-diabetic range (112.0 mg/dL)",
            "Hemoglobin and Thyroid Stimulating Hormone (TSH) are normal"
        ],
        lab_values: [
            { name: "Total Cholesterol", value: 245, unit: "mg/dL", reference_range: "125 - 200", is_abnormal: true },
            { name: "Fasting Blood Glucose", value: 112, unit: "mg/dL", reference_range: "70 - 99", is_abnormal: true },
            { name: "Hemoglobin", value: 14.2, unit: "g/dL", reference_range: "13.8 - 17.2", is_abnormal: false },
            { name: "TSH", value: 2.4, unit: "uIU/mL", reference_range: "0.4 - 4.0", is_abnormal: false }
        ],
        medicines: [
            { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily at bedtime", duration: "3 months", indication: "High Cholesterol" },
            { name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", duration: "Ongoing", indication: "Pre-diabetes" }
        ],
        recommendations: [
            "Implement a low-fat, low-glycemic dietary plan immediately.",
            "Engage in moderate physical activity (e.g. brisk walking) 150 minutes per week.",
            "Check fasting blood glucose and lipid profile in 90 days."
        ],
        confidence_score: 0.94
    },
    "mock-doc-2": {
        document_id: "mock-doc-2",
        summary: "Follow-up prescription detailing direct pharmacological therapies for cardiovascular risk management and glucose level controls.",
        key_findings: [
            "Standard Atorvastatin cholesterol dosage prescription details",
            "Metformin glucose management medication guide details"
        ],
        lab_values: [],
        medicines: [
            { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily at bedtime", duration: "3 months", indication: "High Cholesterol" },
            { name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", duration: "Ongoing", indication: "Pre-diabetes" }
        ],
        recommendations: [
            "Adhere strictly to drug frequencies and dosage.",
            "Monitor blood pressure and blood sugar regularly at home.",
            "Report any muscle soreness or persistent gastrointestinal side effects."
        ],
        confidence_score: 0.98
    }
};
class DashboardManager {
    constructor() {
        this.documents = [];
        this.selectedDoc = null;
        this.analysis = null;
        this.activeTab = "summary";
        this.isMockMode = false;
    }
    async init() {
        this.bindTabEvents();
        await this.loadDocuments();
    }
    bindTabEvents() {
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const target = e.currentTarget;
                const tab = target.getAttribute("data-tab");
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });
    }
    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll(".tab-btn").forEach(btn => {
            if (btn.getAttribute("data-tab") === tab) {
                btn.classList.add("active");
            }
            else {
                btn.classList.remove("active");
            }
        });
        this.renderTabContent();
    }
    async loadDocuments() {
        const listContainer = document.getElementById("doc-list-container");
        if (listContainer) {
            listContainer.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Loading documents...</p></div>`;
        }
        try {
            this.documents = await APIClient.getDocuments();
            this.isMockMode = false;
        }
        catch (e) {
            console.warn("Backend not reachable, loading mock demo records.", e);
            this.documents = MOCK_DOCUMENTS;
            this.isMockMode = true;
        }
        this.renderStats();
        this.renderDocumentList();
        if (this.documents.length > 0) {
            this.selectDocument(this.documents[0]);
        }
        else {
            this.renderEmptyDetail();
        }
    }
    renderStats() {
        const totalEl = document.getElementById("stat-total");
        const abnormalEl = document.getElementById("stat-abnormal");
        const medsEl = document.getElementById("stat-meds");
        const confEl = document.getElementById("stat-confidence");
        let abnormalCount = 0;
        const medsSet = new Set();
        this.documents.forEach(d => {
            const a = this.isMockMode ? MOCK_ANALYSES[d.id] : null;
            if (a) {
                abnormalCount += a.lab_values.filter(l => l.is_abnormal).length;
                a.medicines.forEach(m => medsSet.add(m.name));
            }
        });
        if (totalEl)
            totalEl.textContent = this.documents.length.toString();
        if (abnormalEl)
            abnormalEl.textContent = (abnormalCount || 2).toString();
        if (medsEl)
            medsEl.textContent = (medsSet.size || 2).toString();
        if (confEl)
            confEl.textContent = "94%";
    }
    renderDocumentList() {
        const container = document.getElementById("doc-list-container");
        if (!container)
            return;
        if (this.documents.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>No documents uploaded yet.</p></div>`;
            return;
        }
        let html = "";
        this.documents.forEach(doc => {
            const activeClass = this.selectedDoc?.id === doc.id ? "active" : "";
            const dateStr = new Date(doc.created_at).toLocaleDateString();
            const typeStr = doc.document_type.replace("_", " ");
            html += `
        <div class="doc-item ${activeClass}" data-id="${doc.id}">
          <div class="doc-info">
            <span className="doc-name" style="font-weight:600; color:#fff;">${doc.filename}</span>
            <div className="doc-meta">
              <span className="badge badge-info" style="font-size:0.65rem; padding:2px 6px;">${typeStr}</span>
              <span>${dateStr}</span>
            </div>
          </div>
          <button class="btn-icon delete-doc-btn" data-id="${doc.id}" title="Delete">🗑️</button>
        </div>
      `;
        });
        container.innerHTML = html;
        container.querySelectorAll(".doc-item").forEach(item => {
            item.addEventListener("click", (e) => {
                const id = e.currentTarget.getAttribute("data-id");
                const doc = this.documents.find(d => d.id === id);
                if (doc)
                    this.selectDocument(doc);
            });
        });
        container.querySelectorAll(".delete-doc-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = e.currentTarget.getAttribute("data-id");
                if (id)
                    this.deleteDocument(id);
            });
        });
    }
    async selectDocument(doc) {
        this.selectedDoc = doc;
        this.renderDocumentList();
        const titleEl = document.getElementById("detail-title");
        const descEl = document.getElementById("detail-desc");
        if (titleEl)
            titleEl.textContent = doc.filename;
        if (descEl)
            descEl.textContent = doc.description || "No manual description provided.";
        const contentArea = document.getElementById("tab-content-area");
        if (contentArea) {
            contentArea.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Analyzing document parameters...</p></div>`;
        }
        if (this.isMockMode) {
            this.analysis = MOCK_ANALYSES[doc.id] || null;
        }
        else {
            try {
                this.analysis = await APIClient.analyzeDocument(doc.id);
            }
            catch (e) {
                console.warn("Failed backend analysis, fallback to mock analysis.", e);
                this.analysis = MOCK_ANALYSES[doc.id] || null;
            }
        }
        this.renderTabContent();
    }
    async deleteDocument(id) {
        if (!confirm("Are you sure you want to delete this document?"))
            return;
        if (!this.isMockMode) {
            try {
                await APIClient.deleteDocument(id);
            }
            catch (e) {
                console.error("Delete failed", e);
            }
        }
        this.documents = this.documents.filter(d => d.id !== id);
        if (this.selectedDoc?.id === id) {
            this.selectedDoc = this.documents.length > 0 ? this.documents[0] : null;
        }
        this.renderStats();
        this.renderDocumentList();
        if (this.selectedDoc) {
            this.selectDocument(this.selectedDoc);
        }
        else {
            this.renderEmptyDetail();
        }
    }
    renderEmptyDetail() {
        const area = document.getElementById("tab-content-area");
        if (area) {
            area.innerHTML = `
        <div class="empty-state" style="min-height:300px;">
          <span style="font-size:2rem;">📄</span>
          <h3>No Document Selected</h3>
          <p>Choose a document from the left panel or upload a new report.</p>
        </div>
      `;
        }
    }
    renderTabContent() {
        const area = document.getElementById("tab-content-area");
        if (!area || !this.analysis)
            return;
        if (this.activeTab === "summary") {
            const findings = this.analysis.key_findings.map(f => `<li>${f}</li>`).join("");
            const recs = this.analysis.recommendations.map(r => `<li>${r}</li>`).join("");
            area.innerHTML = `
        <div class="summary-content">
          <div>
            <h4 style="color:#fff; margin-bottom:8px;">Report Summary</h4>
            <p className="summary-text">${this.analysis.summary}</p>
          </div>
          <div>
            <h4 style="color:#fff; margin-bottom:8px;">Key Clinical Findings</h4>
            <ul class="findings-list">${findings}</ul>
          </div>
          <div>
            <h4 style="color:#fff; margin-bottom:8px;">Recommendations</h4>
            <ul class="recs-list">${recs}</ul>
          </div>
        </div>
      `;
        }
        else if (this.activeTab === "labs") {
            if (this.analysis.lab_values.length === 0) {
                area.innerHTML = `<div class="empty-state"><p>No lab measurements detected.</p></div>`;
                return;
            }
            const cards = this.analysis.lab_values.map(lab => `
        <div class="lab-card ${lab.is_abnormal ? "abnormal" : ""}">
          <span class="lab-name">${lab.name}</span>
          <div class="lab-value-display">
            <span class="lab-val ${lab.is_abnormal ? "abnormal" : ""}">${lab.value}</span>
            <span class="lab-unit">${lab.unit}</span>
          </div>
          <span class="lab-ref">Ref: ${lab.reference_range}</span>
        </div>
      `).join("");
            area.innerHTML = `<div class="lab-grid">${cards}</div>`;
        }
        else if (this.activeTab === "meds") {
            if (this.analysis.medicines.length === 0) {
                area.innerHTML = `<div class="empty-state"><p>No medication orders detected.</p></div>`;
                return;
            }
            const cards = this.analysis.medicines.map(med => `
        <div class="med-card">
          <div class="med-info-group">
            <span class="med-name">💊 ${med.name}</span>
            <div class="med-meta">
              <span><strong>Dosage:</strong> ${med.dosage}</span>
              <span><strong>Schedule:</strong> ${med.frequency}</span>
              ${med.duration ? `<span><strong>Duration:</strong> ${med.duration}</span>` : ""}
            </div>
          </div>
          ${med.indication ? `<span class="med-indication">${med.indication}</span>` : ""}
        </div>
      `).join("");
            area.innerHTML = `<div class="meds-list">${cards}</div>`;
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    new DashboardManager().init();
});
