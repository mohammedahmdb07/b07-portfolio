"use strict";

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";

const BUCKET_NAME = "portfolio-media";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const RESUMABLE_LIMIT = 6 * 1024 * 1024;
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


const form =
  document.getElementById("project-form");

const message =
  document.getElementById("dashboard-message");

const projectsContainer =
  document.getElementById("admin-projects");

const logoutButton =
  document.getElementById("logout-button");


function setMessage(text) {
  if (message) {
    message.textContent = text;
  }
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


async function getCurrentSession() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}


async function requireAuth() {

  const session =
    await getCurrentSession();

  if (!session) {
    window.location.href = "admin.html";
    return false;
  }

  return true;
}


function getMediaType(file) {

  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return null;
}


function createStoragePath(file) {

  const originalName =
    file.name || "file";

  const extension =
    originalName.includes(".")
      ? originalName
          .split(".")
          .pop()
          .toLowerCase()
      : "bin";

  return (
    `projects/${crypto.randomUUID()}.${extension}`
  );
}


async function uploadStandard(file, path) {

  const { error } =
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


async function uploadResumable(file, path) {

  if (
    typeof window.tus === "undefined"
  ) {
    throw new Error(
      "مكتبة رفع الملفات الكبيرة غير متاحة."
    );
  }


  const session =
    await getCurrentSession();


  if (!session) {
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
                `Bearer ${session.access_token}`,

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

              const percent =
                Math.round(
                  (bytesUploaded /
                    bytesTotal) *
                    100
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
            previousUploads.length > 0
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


  if (
    !data ||
    !data.publicUrl
  ) {

    throw new Error(
      "تعذر إنشاء رابط الملف."
    );
  }


  return {
    url: data.publicUrl,
    path: path,
    type: mediaType,
    name: file.name,
    size: file.size,
    mime_type: file.type
  };
}


async function deleteStorageFile(path) {

  if (!path) {
    return;
  }


  const { error } =
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
}


async function loadProjects() {

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

    console.error(error);

    projectsContainer.innerHTML =
      "<p>تعذر تحميل المشاريع.</p>";

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    projectsContainer.innerHTML =
      "<p>لا توجد مشاريع حاليًا.</p>";

    return;
  }


  projectsContainer.innerHTML =
    data.map(project => {

      const media =
        Array.isArray(
          project.media_urls
        )
          ? project.media_urls
          : [];


      const mediaHtml =
        media
          .map(item => {

            if (
              !item ||
              !item.url
            ) {
              return "";
            }


            if (
              item.type === "video"
            ) {

              return `
                <video
                  src="${escapeHtml(item.url)}"
                  controls
                  preload="metadata"
                ></video>
              `;
            }


            return `
              <img
                src="${escapeHtml(item.url)}"
                alt="${escapeHtml(project.title)}"
                loading="lazy"
              >
            `;

          })
          .join("");


      return `
        <article class="project-card">

          ${
            project.cover_image
              ? `
                <img
                  src="${escapeHtml(
                    project.cover_image
                  )}"
                  alt="${escapeHtml(
                    project.title
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
                project.category || ""
              )}
            </p>

            <h3>
              ${escapeHtml(
                project.title
              )}
            </h3>

            <p>
              ${escapeHtml(
                project.description || ""
              )}
            </p>

            <p>
              ${
                project.is_published
                  ? "منشور"
                  : "مخفي"
              }
            </p>

          </div>

        </article>
      `;

    }).join("");
}


if (form) {

  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      let uploadedFile = null;


      try {

        setMessage(
          "جاري تجهيز المشروع..."
        );


        const fileInput =
          document.getElementById(
            "media-file"
          );


        const selectedFile =
          fileInput &&
          fileInput.files &&
          fileInput.files.length > 0
            ? fileInput.files[0]
            : null;


        if (selectedFile) {

          uploadedFile =
            await uploadMedia(
              selectedFile
            );
        }


        const project = {

          title:
            document
              .getElementById("title")
              .value
              .trim(),

          category:
            document
              .getElementById("category")
              .value
              .trim(),

          description:
            document
              .getElementById("description")
              .value
              .trim(),

          project_url:
            document
              .getElementById("project-url")
              .value
              .trim() || null,

          cover_image:
            document
              .getElementById("cover-image")
              .value
              .trim() || null,

          media_urls:
            uploadedFile
              ? [uploadedFile]
              : [],

          sort_order:
            Number(
              document
                .getElementById("sort-order")
                .value
            ) || 0,

          is_published:
            document
              .getElementById(
                "is-published"
              )
              .checked
        };


        setMessage(
          "جاري حفظ المشروع..."
        );


        const {
          error
        } =
          await supabaseClient
            .from("projects")
            .insert(project);


        if (error) {

          if (
            uploadedFile &&
            uploadedFile.path
          ) {

            await deleteStorageFile(
              uploadedFile.path
            );
          }

          throw error;
        }


        setMessage(
          "تم رفع الملف وحفظ المشروع بنجاح."
        );


        form.reset();


        const publishCheckbox =
          document.getElementById(
            "is-published"
          );


        if (publishCheckbox) {
          publishCheckbox.checked = true;
        }


        await loadProjects();

      }

      catch (error) {

        console.error(error);

        setMessage(
          error.message ||
          "حدث خطأ أثناء العملية."
        );
      }

    }
  );
}


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      await supabaseClient
        .auth
        .signOut();

      window.location.href =
        "admin.html";

    }
  );
}


async function startDashboard() {

  try {

    const authenticated =
      await requireAuth();

    if (!authenticated) {
      return;
    }

    await loadProjects();

  }

  catch (error) {

    console.error(error);

    setMessage(
      "حدث خطأ في تحميل لوحة التحكم."
    );
  }
}


startDashboard();
