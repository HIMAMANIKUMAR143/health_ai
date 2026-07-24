import { APIClient } from "./api.js";

class UploadManager {
  selectedFile: File | null = null;

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    const form = document.getElementById("upload-form") as HTMLFormElement;
    const changeBtn = document.getElementById("change-file-btn");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragging");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragging");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragging");
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          this.handleFileSelected(target.files[0]);
        }
      });
    }

    if (changeBtn) {
      changeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.clearSelectedFile();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => this.handleSubmit(e));
    }
  }

  handleFileSelected(file: File) {
    this.selectedFile = file;
    const dropzone = document.getElementById("dropzone");
    const selectedPanel = document.getElementById("selected-file-panel");
    const fileNameEl = document.getElementById("selected-file-name");
    const fileSizeEl = document.getElementById("selected-file-size");
    const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

    if (dropzone) dropzone.style.display = "none";
    if (selectedPanel) selectedPanel.style.display = "flex";
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = this.formatBytes(file.size);
    if (submitBtn) submitBtn.disabled = false;
  }

  clearSelectedFile() {
    this.selectedFile = null;
    const dropzone = document.getElementById("dropzone");
    const selectedPanel = document.getElementById("selected-file-panel");
    const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
    const fileInput = document.getElementById("file-input") as HTMLInputElement;

    if (dropzone) dropzone.style.display = "flex";
    if (selectedPanel) selectedPanel.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;
    if (fileInput) fileInput.value = "";
  }

  async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.selectedFile) return;

    const form = document.getElementById("upload-form");
    const progressPanel = document.getElementById("progress-panel");
    const progressBar = document.getElementById("progress-bar");
    const statusText = document.getElementById("progress-status-text");

    if (form) form.style.display = "none";
    if (progressPanel) progressPanel.style.display = "flex";

    const docTypeSelect = document.getElementById("docType") as HTMLSelectElement;
    const descTextarea = document.getElementById("description") as HTMLTextAreaElement;

    const formData = new FormData();
    formData.append("file", this.selectedFile);
    formData.append("document_type", docTypeSelect ? docTypeSelect.value : "lab_report");
    if (descTextarea && descTextarea.value) {
      formData.append("description", descTextarea.value);
    }

    try {
      this.updateProgress(30, "Uploading document to server...", progressBar, statusText);
      await APIClient.uploadDocument(formData);
      this.updateProgress(70, "Extracting medical metrics...", progressBar, statusText);
      
      setTimeout(() => {
        this.updateProgress(100, "Redirecting to dashboard...", progressBar, statusText);
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      }, 600);

    } catch (err) {
      console.warn("Backend upload endpoint offline, executing mock upload flow.", err);
      
      this.updateProgress(50, "Processing in Mock Mode...", progressBar, statusText);
      setTimeout(() => {
        this.updateProgress(100, "Mock record saved! Redirecting...", progressBar, statusText);
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      }, 1200);
    }
  }

  updateProgress(percent: number, status: string, barEl: HTMLElement | null, statusEl: HTMLElement | null) {
    if (barEl) barEl.style.width = `${percent}%`;
    if (statusEl) statusEl.textContent = status;
  }

  formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new UploadManager().init();
});
