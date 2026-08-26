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

  // تعبئة النصوص
  const titleEl = document.getElementById("project-title");
  const categoryEl = document.getElementById("project-category");
  const descriptionEl = document.getElementById("project-description");

  if (titleEl) titleEl.textContent = project.title || "";
  if (categoryEl) categoryEl.textContent = project.category || "";
  if (descriptionEl) descriptionEl.textContent = project.description || "";

  // عرض الصور
  const mediaContainer = document.getElementById("project-media");
  if (mediaContainer) {
    mediaContainer.innerHTML = "";

    // تجميع كل الصور المتاحة
    let imageList = [];
    if (Array.isArray(project.images) && project.images.length > 0) {
      imageList = project.images;
    } else if (project.cover_url) {
      imageList = [project.cover_url];
    } else if (project.image_url) {
      imageList = [project.image_url];
    }

    // تصفية الروابط
    const cleanImages = imageList.filter(url => typeof url === 'string' && url.trim() !== "");

    if (cleanImages.length === 0) {
      mediaContainer.innerHTML = "<p style='color: #888; text-align: center; padding: 20px;'>لا توجد صور مرفوعة لهذا المشروع.</p>";
    } else {
      cleanImages.forEach((imgUrl) => {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.alt = project.title || "Project Image";
        // إجبار الصورة على الظهور وتحديد أبعادها لمنع الشاشة السوداء
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.marginBottom = "20px";
        img.style.borderRadius = "12px";
        img.style.border = "1px solid rgba(255,255,255,0.1)";
        img.style.opacity = "1";
        img.style.visibility = "visible";

        mediaContainer.appendChild(img);
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
