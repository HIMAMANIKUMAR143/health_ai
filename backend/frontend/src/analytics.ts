import { APIClient, HealthTrendPoint, MedicineEntry, Document } from "./api.js";

declare const Chart: any;

const MOCK_TRENDS: HealthTrendPoint[] = [
  { date: "Jan 10, 2026", cholesterol: 245, glucose: 112, report: "Baseline Report" },
  { date: "Mar 15, 2026", cholesterol: 220, glucose: 105, report: "Follow-up Test" },
  { date: "May 20, 2026", cholesterol: 195, glucose: 98, report: "Annual Review" },
  { date: "Jul 24, 2026", cholesterol: 185, glucose: 94, report: "Current Checkup" }
];

const MOCK_MEDS: MedicineEntry[] = [
  { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily (bedtime)", duration: "3 months", indication: "High Cholesterol" },
  { name: "Metformin", dosage: "500mg", frequency: "Twice daily (with meals)", duration: "Ongoing", indication: "Pre-diabetes" }
];

const MOCK_DOCUMENTS: Document[] = [
  { id: "doc-1", filename: "Baseline_Report_Jan.pdf", document_type: "lab_report", status: "completed", created_at: "2026-01-10" },
  { id: "doc-2", filename: "Recent_Report_Jul.pdf", document_type: "lab_report", status: "completed", created_at: "2026-07-24" }
];

class AnalyticsManager {
  trends: HealthTrendPoint[] = [];
  medicines: MedicineEntry[] = [];
  documents: Document[] = [];
  isMockMode = false;

  async init() {
    await this.loadChartJS();
    await this.loadData();
    this.bindComparisonEvents();
  }

  async loadChartJS(): Promise<void> {
    if (typeof Chart !== "undefined") return;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  async loadData() {
    try {
      this.trends = await APIClient.getHealthTrends();
      this.medicines = await APIClient.getMedicines();
      this.documents = await APIClient.getDocuments();
      this.isMockMode = false;
    } catch (e) {
      console.warn("Backend API offline, loading mock Analytics data.", e);
      this.trends = MOCK_TRENDS;
      this.medicines = MOCK_MEDS;
      this.documents = MOCK_DOCUMENTS;
      this.isMockMode = true;
    }

    this.renderTrendsChart();
    this.renderMedicinesList();
    this.populateComparisonSelectors();
  }

  renderTrendsChart() {
    const ctx = (document.getElementById("trends-chart") as HTMLCanvasElement)?.getContext("2d");
    if (!ctx || typeof Chart === "undefined") return;

    const labels = this.trends.map(t => t.date);
    const cholData = this.trends.map(t => t.cholesterol);
    const glucData = this.trends.map(t => t.glucose);

    new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Total Cholesterol (mg/dL)",
            data: cholData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.3,
            fill: true
          },
          {
            label: "Fasting Blood Glucose (mg/dL)",
            data: glucData,
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.1)",
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#f8fafc", font: { family: "Outfit" } }
          }
        },
        scales: {
          x: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255, 255, 255, 0.05)" } },
          y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255, 255, 255, 0.05)" } }
        }
      }
    });
  }

  renderMedicinesList() {
    const container = document.getElementById("analytics-meds-container");
    if (!container) return;

    if (this.medicines.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No active medications tracked.</p>`;
      return;
    }

    const html = this.medicines.map(m => `
      <div class="med-card">
        <div class="med-info-group">
          <span class="med-name">💊 ${m.name}</span>
          <div class="med-meta">
            <span><strong>Dosage:</strong> ${m.dosage}</span>
            <span><strong>Frequency:</strong> ${m.frequency}</span>
            ${m.duration ? `<span><strong>Duration:</strong> ${m.duration}</span>` : ""}
          </div>
        </div>
        ${m.indication ? `<span class="med-indication">${m.indication}</span>` : ""}
      </div>
    `).join("");

    container.innerHTML = html;
  }

  populateComparisonSelectors() {
    const sel1 = document.getElementById("compare-doc1") as HTMLSelectElement;
    const sel2 = document.getElementById("compare-doc2") as HTMLSelectElement;

    if (!sel1 || !sel2) return;

    const opts = this.documents.map(d => `<option value="${d.id}">${d.filename}</option>`).join("");
    sel1.innerHTML = opts;
    sel2.innerHTML = opts;

    if (this.documents.length >= 2) {
      sel2.selectedIndex = 1;
    }

    this.runComparison();
  }

  bindComparisonEvents() {
    const btn = document.getElementById("run-compare-btn");
    if (btn) {
      btn.addEventListener("click", () => this.runComparison());
    }
  }

  async runComparison() {
    const sel1 = document.getElementById("compare-doc1") as HTMLSelectElement;
    const sel2 = document.getElementById("compare-doc2") as HTMLSelectElement;
    const tableContainer = document.getElementById("comparison-table-container");

    if (!sel1 || !sel2 || !tableContainer) return;

    const id1 = sel1.value;
    const id2 = sel2.value;

    tableContainer.innerHTML = `<div class="empty-state"><div class="spinner"></div><p>Calculating comparative delta matrix...</p></div>`;

    if (this.isMockMode || id1 === id2) {
      setTimeout(() => {
        tableContainer.innerHTML = `
          <table class="compare-table">
            <thead>
              <tr>
                <th>Measurement Name</th>
                <th>Baseline Report (Jan 10)</th>
                <th>Recent Report (Jul 24)</th>
                <th>Standard Range</th>
                <th>Delta Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Total Cholesterol</strong></td>
                <td><span class="badge badge-danger">245.0 mg/dL</span></td>
                <td><span class="badge badge-success">185.0 mg/dL</span></td>
                <td>125 - 200 mg/dL</td>
                <td><span style="color:var(--success); font-weight:bold;">↓ -60.0 mg/dL (Normal)</span></td>
              </tr>
              <tr>
                <td><strong>Fasting Glucose</strong></td>
                <td><span class="badge badge-warning">112.0 mg/dL</span></td>
                <td><span class="badge badge-success">94.0 mg/dL</span></td>
                <td>70 - 99 mg/dL</td>
                <td><span style="color:var(--success); font-weight:bold;">↓ -18.0 mg/dL (Normal)</span></td>
              </tr>
              <tr>
                <td><strong>Hemoglobin</strong></td>
                <td><span class="badge badge-success">14.2 g/dL</span></td>
                <td><span class="badge badge-success">14.5 g/dL</span></td>
                <td>13.8 - 17.2 g/dL</td>
                <td><span style="color:var(--text-muted);">Stable</span></td>
              </tr>
            </tbody>
          </table>
        `;
      }, 500);
      return;
    }

    try {
      const comp = await APIClient.getComparison(id1, id2);
      let rows = comp.comparison.map(c => `
        <tr>
          <td><strong>${c.test_name}</strong></td>
          <td>${c.doc1_value !== null ? `<span class="badge ${c.doc1_abnormal ? "badge-danger" : "badge-success"}">${c.doc1_value} ${c.doc1_unit}</span>` : "N/A"}</td>
          <td>${c.doc2_value !== null ? `<span class="badge ${c.doc2_abnormal ? "badge-danger" : "badge-success"}">${c.doc2_value} ${c.doc2_unit}</span>` : "N/A"}</td>
          <td>${c.reference_range}</td>
          <td>${c.doc1_value && c.doc2_value ? `${c.doc2_value - c.doc1_value > 0 ? "+" : ""}${(c.doc2_value - c.doc1_value).toFixed(1)} ${c.doc1_unit}` : "N/A"}</td>
        </tr>
      `).join("");

      tableContainer.innerHTML = `
        <table class="compare-table">
          <thead>
            <tr>
              <th>Measurement Name</th>
              <th>${comp.doc1_name} (${comp.doc1_date})</th>
              <th>${comp.doc2_name} (${comp.doc2_date})</th>
              <th>Reference Range</th>
              <th>Delta Difference</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    } catch (e) {
      console.warn("Comparison call failed", e);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AnalyticsManager().init();
});
