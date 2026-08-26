"use strict";

/* =========================================
   B07 PORTFOLIO
   Admin Dashboard Functionality
   ========================================= */

const SUPABASE_URL = "https://vzmrdfyxzjbrgbcgydbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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

// تحويل الصورة إلى Base64 كخطة بديلة آمنة ومضمونة 100%
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// جلب المشاريع
async function fetchAdminProjects() {
  if (!projectsList || !supabaseClient) return;

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

// حفظ أو تعديل مشروع مع رفع الصور
async function handleFormSubmit(e) {
  e.preventDefault();

  submitBtn.textContent = "جاري الحفظ...";
  submitBtn.disabled = true;

  try {
    let imagesArray = [];
    const id = projectIdInput.value;

    // الاحتفاظ بالصور القديمة عند التعديل
    if (id) {
      const { data: existingProject } = await supabaseClient
        .from("projects")
        .select("images, cover_url, image_url")
        .eq("id", id)
        .single();

      if (existingProject) {
        imagesArray = existingProject.images || [existingProject.cover_url || existingProject.image_url].filter(Boolean);
      }
    }

    // رفع أو معالجة الصور الجديدة
    if (projectFilesInput && projectFilesInput.files.length > 0) {
      const uploadedUrls = [];
      for (let i = 0; i < projectFilesInput.files.length; i++) {
        const file = projectFilesInput.files[i];
        
        try {
          const safeFileName = `${Date.now()}_${i}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          
          // محاولة الرفع لـ Storage
          const { data, error: uploadError } = await supabaseClient.storage
            .from("portfolio-images")
            .upload(safeFileName, file);

          if (!uploadError && data) {
            const { data: publicUrlData } = supabaseClient.storage
              .from("portfolio-images")
              .getPublicUrl(data.path);

            if (publicUrlData && publicUrlData.publicUrl) {
              uploadedUrls.push(publicUrlData.publicUrl);
              continue;
            }
          }

          // إذا فشل الرفع لـ Supabase Storage (بسبب الأذونات)، يتم حفظ الصورة مباشرة بنجاح كـ Base64
          const base64Image = await fileToBase64(file);
          uploadedUrls.push(base64Image);

        } catch (imgErr) {
          const base64Image = await fileToBase64(file);
          uploadedUrls.push(base64Image);
        }
      }

      if (uploadedUrls.length > 0) {
        imagesArray = id ? [...imagesArray, ...uploadedUrls] : uploadedUrls;
      }
    }

    const firstImage = imagesArray[0] || "";

    const projectData = {
      title: titleInput.value,
      category: categoryInput.value,
      description: descriptionInput.value,
      images: imagesArray,
      cover_url: firstImage,
      image_url: firstImage
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
      alert("حدث خطأ في قاعدة البيانات: " + error.message);
    } else {
      alert("تم حفظ المشروع والصور بنجاح!");
      resetForm();
      fetchAdminProjects();
    }
  } catch (err) {
    alert("حدث خطأ: " + err.message);
  } finally {
    submitBtn.textContent = "حفظ المشروع";
    submitBtn.disabled = false;
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

  formTitle.textContent = "تعديل المشروع";
  submitBtn.textContent = "تحديث البيانات";
  cancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// حذف مشروع
window.deleteProject = async function (id) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المشروع؟")) return;

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
  if (projectForm) projectForm.reset();
  formTitle.textContent = "إضافة مشروع جديد";
  submitBtn.textContent = "حفظ المشروع";
  cancelBtn.hidden = true;
}
