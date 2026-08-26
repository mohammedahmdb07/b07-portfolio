"use strict";

/* =========================================
   B07 PORTFOLIO
   Admin Dashboard Functionality
   ========================================= */

const SUPABASE_URL = "https://your-supabase-url.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const projectForm = document.getElementById("project-form");
const projectIdInput = document.getElementById("project-id");
const titleInput = document.getElementById("project-title");
const categoryInput = document.getElementById("project-category");
const descriptionInput = document.getElementById("project-description");
const imagesInput = document.getElementById("project-images");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const projectsList = document.getElementById("admin-projects-list");

document.addEventListener("DOMContentLoaded", () => {
  if (supabaseClient) {
    fetchAdminProjects();
  }

  if (projectForm) {
    projectForm.addEventListener("submit", handleFormSubmit);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", resetForm);
  }
});

// جلب المشاريع
async function fetchAdminProjects() {
  if (!projectsList) return;

  const { data: projects, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    projectsList.innerHTML = "<p>حدث خطأ أثناء جلب المشاريع.</p>";
    return;
  }

  if (!projects || projects.length === 0) {
    projectsList.innerHTML = "<p>لا توجد مشاريع مضافة حالياً.</p>";
    return;
  }

  projectsList.innerHTML = projects
    .map(
      (project) => `
    <div class="project-card" style="margin-bottom: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); opacity: ${project.is_hidden ? '0.5' : '1'};">
      <div>
        <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${project.title} ${project.is_hidden ? '(مخفي)' : ''}</h3>
        <p style="font-size: 0.85rem; color: var(--muted);">${project.category}</p>
      </div>
      <div class="admin-project-actions" style="display: flex; gap: 8px;">
        <button type="button" class="button button-secondary" onclick="toggleHideProject('${project.id}', ${project.is_hidden})">
          ${project.is_hidden ? 'إظهار' : 'إخفاء'}
        </button>
        <button type="button" class="button button-secondary" onclick="editProject('${project.id}')">تعديل</button>
        <button type="button" class="button button-secondary" style="border-color: #ff4d4d; color: #ff4d4d;" onclick="deleteProject('${project.id}')">حذف</button>
      </div>
    </div>
  `
    )
    .join("");
}

// حفظ أو تعديل مشروع
async function handleFormSubmit(e) {
  e.preventDefault();

  const rawImages = imagesInput.value;
  const imagesArray = rawImages
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  const id = projectIdInput.value;
  const projectData = {
    title: titleInput.value,
    category: categoryInput.value,
    description: descriptionInput.value,
    images: imagesArray,
    cover_url: imagesArray[0] || ""
  };

  let error;
  if (id) {
    const res = await supabaseClient
      .from("projects")
      .update(projectData)
      .eq("id", id);
    error = res.error;
  } else {
    const res = await supabaseClient.from("projects").insert([projectData]);
    error = res.error;
  }

  if (error) {
    alert("حدث خطأ أثناء حفظ المشروع: " + error.message);
  } else {
    resetForm();
    fetchAdminProjects();
  }
}

// زر إخفاء / إظهار المشروع
window.toggleHideProject = async function (id, currentStatus) {
  const { error } = await supabaseClient
    .from("projects")
    .update({ is_hidden: !currentStatus })
    .eq("id", id);

  if (error) {
    alert("تعذر تغيير حالة إخفاء المشروع.");
  } else {
    fetchAdminProjects();
  }
};

// تهيئة النموذج للتعديل
window.editProject = async function (id) {
  const { data: project, error } = await supabaseClient
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) return;

  projectIdInput.value = project.id;
  titleInput.value = project.title;
  categoryInput.value = project.category;
  descriptionInput.value = project.description;

  const imageList = project.images && project.images.length > 0
    ? project.images
    : [project.cover_url || ""];
  imagesInput.value = imageList.join("\n");

  formTitle.textContent = "تعديل المشروع";
  submitBtn.textContent = "تحديث البيانات";
  cancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// حذف مشروع
window.deleteProject = async function (id) {
  if (!confirm("هل أنت تأكد من رغبتك في حذف هذا المشروع؟")) return;

  const { error } = await supabaseClient
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    alert("تعذر حذف المشروع.");
  } else {
    fetchAdminProjects();
  }
};

// إعادة ضبط النموذج
function resetForm() {
  projectIdInput.value = "";
  projectForm.reset();
  formTitle.textContent = "إضافة مشروع جديد";
  submitBtn.textContent = "حفظ المشروع";
  cancelBtn.hidden = true;
}
