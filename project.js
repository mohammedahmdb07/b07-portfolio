"use strict";

/* =========================================
   B07 PORTFOLIO
   Single Project View Functionality
   ========================================= */

const SUPABASE_URL = "https://vzmrdfyxzjbrgbcgydbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  if (projectId && supabaseClient) {
    loadProjectDetails(projectId);
  } else {
    showError();
  }
});

async function loadProjectDetails(projectId) {
  const loadingEl = document.getElementById("project-loading");
  const detailsEl = document.getElementById("project-details");

  const { data: project, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    showError();
    return;
  }

  // تعبئة البيانات النصية
  const titleEl = document.getElementById("project-title");
  const categoryEl = document.getElementById("project-category");
  const descriptionEl = document.getElementById("project-description");

  if (titleEl) titleEl.textContent = project.title || "";
  if (categoryEl) categoryEl.textContent = project.category || "";
  if (descriptionEl) descriptionEl.textContent = project.description || "";

  // عرض الصور المرفوعة من حقل media_urls
  const mediaContainer = document.getElementById("project-media");
  if (mediaContainer) {
    mediaContainer.innerHTML = "";

    let rawImages = [];
    if (Array.isArray(project.media_urls)) {
      rawImages = project.media_urls;
    } else if (typeof project.media_urls === "string" && project.media_urls.trim() !== "") {
      rawImages = [project.media_urls];
    }

    const cleanImages = rawImages.filter(
      (url) => typeof url === "string" && url.trim().length > 0
    );

    if (cleanImages.length === 0) {
      mediaContainer.innerHTML =
        "<p style='color: #888; text-align: center; padding: 20px;'>لا توجد صور معروضة لهذا المشروع.</p>";
    } else {
      cleanImages.forEach((imgUrl) => {
        const imgElement = document.createElement("img");
        imgElement.src = imgUrl;
        imgElement.alt = project.title || "صورة المشروع";
        imgElement.loading = "lazy";
        imgElement.style.cssText =
          "width: 100%; height: auto; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; display: block; opacity: 1 !important; visibility: visible !important;";

        mediaContainer.appendChild(imgElement);
      });
    }
  }

  if (loadingEl) loadingEl.hidden = true;
  if (detailsEl) detailsEl.hidden = false;
}

function showError() {
  const loadingEl = document.getElementById("project-loading");
  const errorEl = document.getElementById("project-error");

  if (loadingEl) loadingEl.hidden = true;
  if (errorEl) errorEl.hidden = false;
}
