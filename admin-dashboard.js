"use strict";

/* =========================================
   B07 PORTFOLIO
   Admin Dashboard
========================================= */

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";

const BUCKET_NAME =
  "portfolio-media";

const MAX_FILE_SIZE =
  50 * 1024 * 1024;

const RESUMABLE_LIMIT =
  6 * 1024 * 1024;

const TUS_CHUNK_SIZE =
  6 * 1024 * 1024;


/* =========================================
   ELEMENTS
========================================= */

const form =
  document.getElementById("project-form");

const message =
  document.getElementById("dashboard-message");

const projectsContainer =
  document.getElementById("admin-projects");

const logoutButton =
  document.getElementById("logout-button");


/* =========================================
   MESSAGE
========================================= */

function setMessage(text) {

  if (message) {
    message.textContent = text || "";
  }

}


/* =========================================
   SUPABASE
========================================= */

if (
  !window.supabase ||
  typeof window.supabase.createClient !== "function"
) {

  setMessage(
    "تعذر تحميل Supabase. أعد تحميل الصفحة."
  );

  throw new Error(
    "Supabase library is not loaded."
  );

}


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "b07-supabase-auth"
      }
    }
  );


/* =========================================
   STATE
========================================= */

let editingProjectId = null;


/* =========================================
   HELPERS
========================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function parseMediaUrls(value) {

  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {

    try {

      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch (error) {

      console.error(
        "media_urls parse error:",
        error
      );

    }

  }

  return [];

}


function getElementValue(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";

}


/* =========================================
   AUTH
========================================= */

async function requireAuth() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (!data?.session) {

      window.location.replace(
        "admin.html"
      );

      return false;
    }

    return true;

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    setMessage(
      "تعذر التحقق من جلسة تسجيل الدخول."
    );

    return false;
  }

}


/* =========================================
   FILE HELPERS
========================================= */

function getMediaType(file) {

  if (
    file?.type?.startsWith("image/")
  ) {
    return "image";
  }

  if (
    file?.type?.startsWith("video/")
  ) {
    return "video";
  }

  return null;

}


function createStoragePath(file) {

  const originalName =
    file?.name || "file";

  const extension =
    originalName.includes(".")
      ? originalName
          .split(".")
          .pop()
          .toLowerCase()
      : "bin";

  const id =
    crypto.randomUUID();

  return `projects/${id}.${extension}`;

}


/* =========================================
   STANDARD UPLOAD
========================================= */

async function uploadStandard(
  file,
  path
) {

  const {
    error
  } =
    await supabaseClient
      .storage
      .from(BUCKET_NAME)
      .upload(
        path,
        file,
        {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false
        }
      );

  if (error) {
    throw error;
  }

}


/* =========================================
   RESUMABLE UPLOAD
========================================= */

async function uploadResumable(
  file,
  path
) {

  if (
    !window.tus ||
    typeof window.tus.Upload !== "function"
  ) {

    throw new Error(
      "مكتبة رفع الملفات الكبيرة غير متاحة."
    );

  }


  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();

  if (
    error ||
    !data?.session
  ) {

    throw new Error(
      "انتهت جلسة تسجيل الدخول."
    );

  }


  const projectId =
    "vzmrdfyxzjbrgbcgydbb";

  const endpoint =
    `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;


  return new Promise(
    (resolve, reject) => {

      const upload =
        new window.tus.Upload(
          file,
          {

            endpoint,

            retryDelays: [
              0,
              3000,
              5000,
              10000,
              20000
            ],

            headers: {

              authorization:
                `Bearer ${data.session.access_token}`,

              apikey:
                SUPABASE_PUBLISHABLE_KEY

            },

            uploadDataDuringCreation:
              true,

            removeFingerprintOnSuccess:
              true,

            chunkSize:
              TUS_CHUNK_SIZE,

            metadata: {

              bucketName:
                BUCKET_NAME,

              objectName:
                path,

              contentType:
                file.type,

              cacheControl:
                "3600"

            },

            onError(error) {

              console.error(
                "TUS upload error:",
                error
              );

              reject(error);

            },

            onProgress(
              bytesUploaded,
              bytesTotal
            ) {

              if (!bytesTotal) {
                return;
              }

              const percent =
                Math.round(
                  (
                    bytesUploaded /
                    bytesTotal
                  ) * 100
                );

              setMessage(
                `جاري رفع الملف... ${percent}%`
              );

            },

            onSuccess() {
              resolve();
            }

          }
        );


      upload
        .findPreviousUploads()
        .then(previousUploads => {

          if (
            Array.isArray(previousUploads) &&
            previousUploads.length
          ) {

            upload.resumeFromPreviousUpload(
              previousUploads[0]
            );

          }

          upload.start();

        })
        .catch(reject);

    }
  );

}


/* =========================================
   UPLOAD MEDIA
========================================= */

async function uploadMedia(file) {

  if (!file) {
    return null;
  }


  if (
    file.size > MAX_FILE_SIZE
  ) {

    throw new Error(
      "حجم الملف أكبر من 50 MB."
    );

  }


  const mediaType =
    getMediaType(file);

  if (!mediaType) {

    throw new Error(
      "يسمح فقط بالصور والفيديوهات."
    );

  }


  const path =
    createStoragePath(file);


  setMessage(
    "جاري رفع الملف..."
  );


  try {

    if (
      file.size <= RESUMABLE_LIMIT
    ) {

      await uploadStandard(
        file,
        path
      );

    } else {

      await uploadResumable(
        file,
        path
      );

    }


    const {
      data
    } =
      supabaseClient
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(path);


    if (!data?.publicUrl) {

      throw new Error(
        "تعذر إنشاء رابط الملف."
      );

    }


    return {

      url:
        data.publicUrl,

      path,

      type:
        mediaType,

      name:
        file.name,

      size:
        file.size,

      mime_type:
        file.type

    };

  } catch (error) {

    await deleteStorageFile(path);

    throw error;

  }

}


/* =========================================
   DELETE STORAGE FILE
========================================= */

async function deleteStorageFile(path) {

  if (!path) {
    return;
  }

  try {

    const {
      error
    } =
      await supabaseClient
        .storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {

      console.error(
        "Storage cleanup error:",
        error
      );

    }

  } catch (error) {

    console.error(
      "Storage cleanup exception:",
      error
    );

  }

}


/* =========================================
   DELETE PROJECT MEDIA
========================================= */

async function deleteProjectMedia(project) {

  const media =
    parseMediaUrls(
      project?.media_urls
    );

  const paths =
    media
      .map(item => item?.path)
      .filter(Boolean);

  if (!paths.length) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .storage
      .from(BUCKET_NAME)
      .remove(paths);


  if (error) {

    console.error(
      "Failed to delete project media:",
      error
    );

  }

}


/* =========================================
   RESET FORM
========================================= */

function resetProjectForm() {

  editingProjectId =
    null;


  if (form) {
    form.reset();
  }


  const publishCheckbox =
    document.getElementById(
      "is-published"
    );

  if (publishCheckbox) {
    publishCheckbox.checked = true;
  }


  const sortOrder =
    document.getElementById(
      "sort-order"
    );

  if (sortOrder) {
    sortOrder.value = "0";
  }


  const submitButton =
    form?.querySelector(
      'button[type="submit"]'
    );

  if (submitButton) {
    submitButton.textContent =
      "إضافة المشروع";
  }


  const cancelButton =
    document.getElementById(
      "cancel-edit"
    );

  if (cancelButton) {
    cancelButton.remove();
  }


  setMessage("");

}


/* =========================================
   EDIT PROJECT
========================================= */

function startEditing(project) {

  if (!project) {
    return;
  }


  editingProjectId =
    project.id;


  const fields = {

    title:
      project.title || "",

    category:
      project.category || "",

    description:
      project.description || "",

    "project-url":
      project.project_url || "",

    "cover-image":
      project.cover_image || "",

    "sort-order":
      project.sort_order ?? 0

  };


  Object.entries(fields)
    .forEach(([id, value]) => {

      const element =
        document.getElementById(id);

      if (element) {
        element.value = value;
      }

    });


  const publishCheckbox =
    document.getElementById(
      "is-published"
    );

  if (publishCheckbox) {

    publishCheckbox.checked =
      Boolean(
        project.is_published
      );

  }


  const submitButton =
    form?.querySelector(
      'button[type="submit"]'
    );


  if (submitButton) {

    submitButton.textContent =
      "حفظ التعديلات";

  }


  if (
    form &&
    !document.getElementById(
      "cancel-edit"
    )
  ) {

    const cancelButton =
      document.createElement(
        "button"
      );

    cancelButton.type =
      "button";

    cancelButton.id =
      "cancel-edit";

    cancelButton.className =
      "button button-secondary";

    cancelButton.textContent =
      "إلغاء التعديل";


    cancelButton.addEventListener(
      "click",
      resetProjectForm
    );


    submitButton?.parentNode
      ?.insertBefore(
        cancelButton,
        submitButton.nextSibling
      );

  }


  setMessage(
    "أنت الآن تعدّل المشروع."
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================
   RENDER PROJECT
========================================= */

function renderAdminProject(project) {

  const media =
    parseMediaUrls(
      project.media_urls
    );


  const mediaHtml =
    media
      .map(item => {

        if (!item?.url) {
          return "";
        }


        const isVideo =
          item.type === "video" ||
          (
            typeof item.mime_type === "string" &&
            item.mime_type.startsWith("video/")
          );


        if (isVideo) {

          return `
            <video
              src="${escapeHtml(item.url)}"
              controls
              preload="metadata"
              playsinline
            ></video>
          `;

        }


        return `
          <img
            src="${escapeHtml(item.url)}"
            alt="${escapeHtml(
              project.title || "B07 Project"
            )}"
            loading="lazy"
          >
        `;

      })
      .join("");


  return `
    <article
      class="project-card admin-project-card"
      data-project-id="${escapeHtml(project.id)}"
    >

      ${
        project.cover_image
          ? `
            <img
              src="${escapeHtml(project.cover_image)}"
              alt="${escapeHtml(
                project.title || "B07 Project"
              )}"
              loading="lazy"
            >
          `
          : ""
      }

      ${
        mediaHtml
          ? `
            <div class="project-media">
              ${mediaHtml}
            </div>
          `
          : ""
      }

      <div class="project-content">

        <p class="eyebrow">
          ${escapeHtml(
            project.category || "PROJECT"
          )}
        </p>

        <h3>
          ${escapeHtml(
            project.title || "بدون عنوان"
          )}
        </h3>

        <p>
          ${escapeHtml(
            project.description || ""
          )}
        </p>

        <p>
          الحالة:
          ${
            project.is_published
              ? "منشور"
              : "مخفي"
          }
        </p>

        <div class="admin-project-actions">

          <button
            type="button"
            class="button button-secondary edit-project"
            data-id="${escapeHtml(project.id)}"
          >
            تعديل
          </button>

          <button
            type="button"
            class="button button-secondary toggle-project"
            data-id="${escapeHtml(project.id)}"
            data-published="${
              project.is_published
                ? "true"
                : "false"
            }"
          >
            ${
              project.is_published
                ? "إخفاء"
                : "نشر"
            }
          </button>

          <button
            type="button"
            class="button button-secondary delete-project"
            data-id="${escapeHtml(project.id)}"
          >
            حذف
          </button>

        </div>

      </div>

    </article>
  `;

}


/* =========================================
   LOAD PROJECTS
========================================= */

async function loadProjects() {

  if (!projectsContainer) {
    return;
  }


  projectsContainer.innerHTML =
    "<p>جاري تحميل المشاريع...</p>";


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("projects")
        .select("*")
        .order(
          "sort_order",
          {
            ascending: true
          }
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      projectsContainer.innerHTML =
        "<p>لا توجد مشاريع حاليًا.</p>";

      return;
    }


    projectsContainer.innerHTML =
      data
        .map(renderAdminProject)
        .join("");


    setupProjectActions();

  } catch (error) {

    console.error(
      "Load projects error:",
      error
    );


    projectsContainer.innerHTML =
      "<p>تعذر تحميل المشاريع.</p>";


    setMessage(
      error?.message ||
      "تعذر تحميل المشاريع."
    );

  }

}


/* =========================================
   PROJECT ACTIONS
========================================= */

function setupProjectActions() {

  if (!projectsContainer) {
    return;
  }


  projectsContainer
    .querySelectorAll(".edit-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          try {

            const {
              data,
              error
            } =
              await supabaseClient
                .from("projects")
                .select("*")
                .eq(
                  "id",
                  button.dataset.id
                )
                .single();


            if (error) {
              throw error;
            }


            startEditing(data);

          } catch (error) {

            console.error(
              "Edit project error:",
              error
            );

            setMessage(
              error?.message ||
              "تعذر تحميل المشروع للتعديل."
            );

          }

        }
      );

    });


  projectsContainer
    .querySelectorAll(".toggle-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.id;

          const published =
            button.dataset.published ===
            "true";


          button.disabled =
            true;


          try {

            const {
              error
            } =
              await supabaseClient
                .from("projects")
                .update({
                  is_published:
                    !published
                })
                .eq(
                  "id",
                  id
                );


            if (error) {
              throw error;
            }


            setMessage(
              published
                ? "تم إخفاء المشروع."
                : "تم نشر المشروع."
            );


            await loadProjects();

          } catch (error) {

            console.error(
              "Toggle project error:",
              error
            );

            setMessage(
              error?.message ||
              "تعذر تغيير حالة المشروع."
            );

            button.disabled =
              false;

          }

        }
      );

    });


  projectsContainer
    .querySelectorAll(".delete-project")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const confirmed =
            window.confirm(
              "هل أنت متأكد من حذف هذا المشروع؟\n\nسيتم حذف المشروع وملفاته المرفوعة."
            );


          if (!confirmed) {
            return;
          }


          button.disabled =
            true;


          try {

            const {
              data: project,
              error: fetchError
            } =
              await supabaseClient
                .from("projects")
                .select("*")
                .eq(
                  "id",
                  button.dataset.id
                )
                .single();


            if (fetchError) {
              throw fetchError;
            }


            setMessage(
              "جاري حذف ملفات المشروع..."
            );


            await deleteProjectMedia(
              project
            );


            const {
              error
            } =
              await supabaseClient
                .from("projects")
                .delete()
                .eq(
                  "id",
                  button.dataset.id
                );


            if (error) {
              throw error;
            }


            if (
              editingProjectId ===
              button.dataset.id
            ) {

              resetProjectForm();

            }


            setMessage(
              "تم حذف المشروع بنجاح."
            );


            await loadProjects();

          } catch (error) {

            console.error(
              "Delete project error:",
              error
            );

            setMessage(
              error?.message ||
              "تعذر حذف المشروع."
            );

            button.disabled =
              false;

          }

        }
      );

    });

}


/* =========================================
   FORM SUBMIT
========================================= */

if (form) {

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      let uploadedFile =
        null;


      try {

        setMessage(
          editingProjectId
            ? "جاري تحديث المشروع..."
            : "جاري تجهيز المشروع..."
        );


        const fileInput =
          document.getElementById(
            "media-file"
          );


        const selectedFile =
          fileInput?.files?.[0] ||
          null;


        if (selectedFile) {

          uploadedFile =
            await uploadMedia(
              selectedFile
            );

        }


        const projectData = {

          title:
            getElementValue(
              "title"
            ),

          category:
            getElementValue(
              "category"
            ),

          description:
            getElementValue(
              "description"
            ),

          project_url:
            getElementValue(
              "project-url"
            ) || null,

          cover_image:
            getElementValue(
              "cover-image"
            ) || null,

          sort_order:
            Number(
              getElementValue(
                "sort-order"
              )
            ) || 0,

          is_published:
            document.getElementById(
              "is-published"
            )?.checked ?? true

        };


        /* ADD */

        if (!editingProjectId) {

          projectData.media_urls =
            uploadedFile
              ? [uploadedFile]
              : [];


          setMessage(
            "جاري حفظ المشروع..."
          );


          const {
            error
          } =
            await supabaseClient
              .from("projects")
              .insert(
                projectData
              );


          if (error) {

            if (uploadedFile?.path) {

              await deleteStorageFile(
                uploadedFile.path
              );

            }

            throw error;
          }


          setMessage(
            "تم إضافة المشروع بنجاح."
          );

        }


        /* EDIT */

        else {

          const {
            data: oldProject,
            error: oldProjectError
          } =
            await supabaseClient
              .from("projects")
              .select("*")
              .eq(
                "id",
                editingProjectId
              )
              .single();


          if (oldProjectError) {
            throw oldProjectError;
          }


          if (uploadedFile) {

            projectData.media_urls =
              [uploadedFile];

          }


          setMessage(
            "جاري حفظ التعديلات..."
          );


          const {
            error
          } =
            await supabaseClient
              .from("projects")
              .update(
                projectData
              )
              .eq(
                "id",
                editingProjectId
              );


          if (error) {

            if (uploadedFile?.path) {

              await deleteStorageFile(
                uploadedFile.path
              );

            }

            throw error;
          }


          if (
            uploadedFile &&
            oldProject
          ) {

            await deleteProjectMedia(
              oldProject
            );

          }


          setMessage(
            "تم تحديث المشروع بنجاح."
          );

        }


        resetProjectForm();

        await loadProjects();

      } catch (error) {

        console.error(
          "Project submit error:",
          error
        );


        setMessage(
          error?.message ||
          "حدث خطأ أثناء العملية."
        );

      }

    }
  );

}


/* =========================================
   LOGOUT
========================================= */

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      try {

        await supabaseClient
          .auth
          .signOut();

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }


      window.location.replace(
        "admin.html"
      );

    }
  );

}


/* =========================================
   START DASHBOARD
========================================= */

async function startDashboard() {

  setMessage(
    "جاري تحميل لوحة التحكم..."
  );


  const authenticated =
    await requireAuth();


  if (!authenticated) {
    return;
  }


  await loadProjects();

}


startDashboard();
