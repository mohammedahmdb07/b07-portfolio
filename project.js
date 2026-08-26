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
  const errorEl = document.getElementById("project-error");

  const { data: project, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    showError();
    return;
  }

  // تعبئة بيانات النصوص
  const titleEl = document.getElementById("project-title");
  const categoryEl = document.getElementById("project-category");
  const descriptionEl = document.getElementById("project-description");

  if (titleEl) titleEl.textContent = project.title;
  if (categoryEl) categoryEl.textContent = project.category;
  if (descriptionEl) descriptionEl.textContent = project.description;

  // عرض كل الصور المرفوعة
  const mediaContainer = document.getElementById("project-media");
  if (mediaContainer) {
    mediaContainer.innerHTML = "";

    // جلب قائمة الصور (سواء كانت مصفوفة images أو صورة كوفر قديمة)
    const imageList = project.images && project.images.length > 0
      ? project.images
      : [project.cover_url || project.image_url];

    imageList.forEach((imgUrl) => {
      if (!imgUrl) return;

      const imgElement = document.createElement("img");
      imgElement.src = imgUrl;
      imgElement.alt = project.title;
      imgElement.loading = "lazy";
      imgElement.style.cssText = "width: 100%; border-radius: var(--radius); border: 1px solid var(--panel-border); margin-bottom: 24px; display: block;";

      mediaContainer.appendChild(imgElement);
    });
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
