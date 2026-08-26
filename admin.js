"use strict";

/* =========================================
   B07 PORTFOLIO - Admin Dashboard
   ========================================= */

const SUPABASE_URL = "https://vzmrdfyxzjbrgbcgydbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// عناصر تسجيل الدخول والتحكم بالصفحة
const loginSection = document.getElementById("login-section");
const adminContent = document.getElementById("admin-content");
const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

// عناصر النموذج الأساسي
const projectForm = document.getElementById("project-form");
const projectIdInput = document.getElementById("project-id");
const titleInput = document.getElementById("project-title");
const categoryInput = document.getElementById("project-category");
const descriptionInput = document.getElementById("project-description");
const projectFilesInput = document.getElementById("project-files");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const projectsList = document.getElementById("admin-projects-list");

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabaseClient) return;

  // التحقق من الجلسة الحالية
  const { data: { session } } = await supabaseClient.auth.getSession();
  updateAuthUI(session);

  // الاستماع لتغيرات حالة تسجيل الدخول
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    updateAuthUI(session);
  });

  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (projectForm) projectForm.addEventListener("submit", handleFormSubmit);
  if (cancelBtn) cancelBtn.addEventListener("click", resetForm);
});

// تحديث الواجهة بناءً على حالة تسجيل الدخول
function updateAuthUI(session) {
  if (session) {
    if (loginSection) loginSection.style.display = "none";
    if (adminContent) adminContent.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    fetchAdminProjects();
  } else {
    if (loginSection) loginSection.style.display = "block";
    if (adminContent) adminContent.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

// تسجيل الدخول
async function handleLogin(e) {
  e.preventDefault();
  if (loginError) loginError.style.display = "none";

  const email = loginEmailInput ? loginEmailInput.value : "";
  const password = loginPasswordInput ? loginPasswordInput.value : "";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (loginError) {
      loginError.textContent = "بيانات الدخول غير صحيحة: " + error.message;
      loginError.style.display = "block";
    }
  }
}

// تسجيل الخروج
async function handleLogout() {
  await supabaseClient.auth.signOut();
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

async function fetchAdminProjects() {
  if (!projectsList || !supabaseClient) return;

  const { data: projects, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("id", { ascending: false });

  if (error || !projects || projects.length === 0) {
    projectsList.innerHTML = "<p>لا توجد مشاريع مضافة حالياً.</p>";
    return;
  }

  projectsList.innerHTML = projects
    .map(
      (project) => `
    <div class="project-card" style="margin-bottom: 16px; padding: 16px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); opacity: ${project.is_published ? '1' : '0.5'};">
      <div>
        <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${project.title || 'بدون عنوان'} ${!project.is_published ? '(مخفي)' : ''}</h3>
        <p style="font-size: 0.85rem; color: var(--muted);">${project.category || ''}</p>
      </div>
      <div class="admin-project-actions" style="display: flex; gap: 8px;">
        <button type="button" class="button button-secondary" onclick="togglePublishProject('${project.id}', ${project.is_published})">
          ${project.is_published ? 'إخفاء' : 'إظهار'}
        </button>
        <button type="button" class="button button-secondary" onclick="editProject('${project.id}')">تعديل</button>
        <button type="button" class="button button-secondary" style="border-color: #ff4d4d; color: #ff4d4d;" onclick="deleteProject('${project.id}')">حذف</button>
      </div>
    </div>
  `
    )
    .join("");
}

async function handleFormSubmit(e) {
  e.preventDefault();
  submitBtn.textContent = "جاري الحفظ...";
  submitBtn.disabled = true;

  try {
    let mediaArray = [];
    const id = projectIdInput ? projectIdInput.value : "";

    if (id) {
      const { data: existingProject } = await supabaseClient
        .from("projects")
        .select("media_urls")
        .eq("id", id)
        .single();

      if (existingProject && existingProject.media_urls) {
        mediaArray = Array.isArray(existingProject.media_urls)
          ? existingProject.media_urls
          : [existingProject.media_urls];
      }
    }

    if (projectFilesInput && projectFilesInput.files.length > 0) {
      const newUrls = [];
      for (let i = 0; i < projectFilesInput.files.length; i++) {
        const base64Str = await fileToBase64(projectFilesInput.files[i]);
        newUrls.push(base64Str);
      }
      mediaArray = id ? [...mediaArray, ...newUrls] : newUrls;
    }

    const coverUrl = mediaArray.length > 0 ? mediaArray[0] : null;

    const projectData = {
      title: titleInput ? titleInput.value : "",
      category: categoryInput ? categoryInput.value : "",
      description: descriptionInput ? descriptionInput.value : "",
      media_urls: mediaArray,
      cover_image: coverUrl,
      is_published: true
    };

    let error;
    if (id) {
      const res = await supabaseClient.from("projects").update(projectData).eq("id", id);
      error = res.error;
    } else {
      const res = await supabaseClient.from("projects").insert([projectData]);
      error = res.error;
    }

    if (error) {
      alert("حدث خطأ أثناء الحفظ: " + error.message);
    } else {
      alert("تم حفظ المشروع ونشر الصور بنجاح!");
      resetForm();
      fetchAdminProjects();
    }
  } catch (err) {
    alert("حدث خطأ: " + (err.message || err));
  } finally {
    submitBtn.textContent = "حفظ المشروع";
    submitBtn.disabled = false;
  }
}

window.togglePublishProject = async function (id, currentStatus) {
  const { error } = await supabaseClient
    .from("projects")
    .update({ is_published: !currentStatus })
    .eq("id", id);

  if (!error) fetchAdminProjects();
};

window.editProject = async function (id) {
  const { data: project } = await supabaseClient.from("projects").select("*").eq("id", id).single();
  if (!project) return;

  if (projectIdInput) projectIdInput.value = project.id;
  if (titleInput) titleInput.value = project.title || "";
  if (categoryInput) categoryInput.value = project.category || "";
  if (descriptionInput) descriptionInput.value = project.description || "";

  if (formTitle) formTitle.textContent = "تعديل المشروع";
  if (submitBtn) submitBtn.textContent = "تحديث البيانات";
  if (cancelBtn) cancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.deleteProject = async function (id) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المشروع؟")) return;
  const { error } = await supabaseClient.from("projects").delete().eq("id", id);
  if (!error) fetchAdminProjects();
};

function resetForm() {
  if (projectIdInput) projectIdInput.value = "";
  if (projectForm) projectForm.reset();
  if (formTitle) formTitle.textContent = "إضافة مشروع جديد";
  if (submitBtn) submitBtn.textContent = "حفظ المشروع";
  if (cancelBtn) cancelBtn.hidden = true;
}
