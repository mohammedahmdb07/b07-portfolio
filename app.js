"use strict";

/*
  B07 Portfolio
  Supabase public projects
*/

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


const projectsGrid =
  document.getElementById("projects-grid");


/* =========================
   Helpers
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showMessage(message) {

  if (!projectsGrid) {
    return;
  }

  projectsGrid.innerHTML = `
    <div class="loading-state">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}


/* =========================
   Supabase
========================= */

async function fetchProjects() {

  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY
  ) {

    showMessage(
      "لم يتم إعداد الاتصال بقاعدة البيانات."
    );

    return;
  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/projects` +
        `?select=id,title,description,category,cover_image,project_url,media_urls,sort_order,created_at` +
        `&is_published=eq.true` +
        `&order=sort_order.asc,created_at.desc`,
        {
          method: "GET",

          headers: {
            apikey:
              SUPABASE_PUBLISHABLE_KEY,

            Authorization:
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,

            "Content-Type":
              "application/json"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Supabase request failed: ${response.status}`
      );
    }


    const projects =
      await response.json();


    renderProjects(projects);

  }

  catch (error) {

    console.error(
      "Failed to load projects:",
      error
    );

    showMessage(
      "تعذر تحميل المشاريع حاليًا."
    );
  }
}


/* =========================
   Media
========================= */

function renderMedia(
  project
) {

  let media = [];

if (Array.isArray(project.media_urls)) {

  media = project.media_urls;

} else if (
  typeof project.media_urls === "string" &&
  project.media_urls.trim() !== ""
) {

  try {

    media =
      JSON.parse(
        project.media_urls
      );

  } catch (error) {

    console.error(
      "Invalid media_urls:",
      error
    );

    media = [];
  }
}


  /*
    الصور/الفيديوهات المرفوعة
    من لوحة التحكم.
  */

  if (media.length > 0) {

    return media
      .map(item => {

        if (
          !item ||
          !item.url
        ) {
          return "";
        }


        const url =
          escapeHtml(item.url);


        const title =
          escapeHtml(
            project.title
          );


        if (
          item.type === "video" ||
          (
            item.mime_type &&
            item.mime_type.startsWith(
              "video/"
            )
          )
        ) {

          return `
            <video
              class="project-video"
              src="${url}"
              controls
              preload="metadata"
              playsinline
            >
            </video>
          `;
        }


        return `
          <img
            class="project-image"
            src="${url}"
            alt="${title}"
            loading="lazy"
          >
        `;

      })
      .join("");
  }


  /*
    إذا لم توجد ملفات مرفوعة،
    نستخدم cover_image القديمة.
  */

  if (
    project.cover_image
  ) {

    return `
      <img
        class="project-image"
        src="${escapeHtml(
          project.cover_image
        )}"
        alt="${escapeHtml(
          project.title
        )}"
        loading="lazy"
      >
    `;
  }


  return `
    <div class="project-placeholder">
      B07
    </div>
  `;
}


/* =========================
   Render Projects
========================= */

function renderProjects(
  projects
) {

  if (!projectsGrid) {
    return;
  }


  if (
    !Array.isArray(projects) ||
    projects.length === 0
  ) {

    projectsGrid.innerHTML = `
      <div class="loading-state">
        <p>
          لا توجد مشاريع منشورة حاليًا.
        </p>
      </div>
    `;

    return;
  }


  projectsGrid.innerHTML =
    projects
      .map(project => {

        const title =
          escapeHtml(
            project.title
          );


        const description =
          escapeHtml(
            project.description ||
            "مشروع من أعمال B07."
          );


        const category =
          escapeHtml(
            project.category ||
            "Project"
          );


        const media =
          renderMedia(project);


        const projectLink =
          project.project_url
            ? `
              <a
                href="${escapeHtml(
                  project.project_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="button button-secondary"
              >
                مشاهدة المشروع
              </a>
            `
            : "";


        return `
          <article
            class="project-card"
          >

            <div
              class="project-media"
            >
              ${media}
            </div>

            <div
              class="project-content"
            >

              <p class="eyebrow">
                ${category}
              </p>

              <h3>
                ${title}
              </h3>

              <p>
                ${description}
              </p>

              ${projectLink}

            </div>

          </article>
        `;

      })
      .join("");
}


/* =========================
   Start
========================= */

document.addEventListener(
  "DOMContentLoaded",
  fetchProjects
);    .replaceAll("'", "&#039;");
}


function showMessage(message) {
  if (!projectsGrid) return;

  projectsGrid.innerHTML = `
    <div class="loading-state">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}


/* =========================
   Supabase
========================= */

async function fetchProjects() {

  if (
    !SUPABASE_URL ||
    !SUPABASE_ANON_KEY ||
    SUPABASE_ANON_KEY.includes(
      "PASTE_YOUR"
    )
  ) {
    showMessage(
      "لم يتم إعداد الاتصال بقاعدة البيانات بعد."
    );

    return;
  }

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/projects` +
      `?select=id,title,description,category,cover_image,project_url,sort_order` +
      `&is_published=eq.true` +
      `&order=sort_order.asc,created_at.desc`,
      {
        method: "GET",

        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization":
            `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type":
            "application/json"
        }
      }
    );


    if (!response.ok) {
      throw new Error(
        `Supabase request failed: ${response.status}`
      );
    }


    const projects =
      await response.json();


    renderProjects(projects);

  } catch (error) {

    console.error(
      "Failed to load projects:",
      error
    );

    showMessage(
      "تعذر تحميل المشاريع حاليًا."
    );
  }
}


/* =========================
   Render Projects
========================= */

function renderProjects(projects) {

  if (!projectsGrid) return;


  if (
    !Array.isArray(projects) ||
    projects.length === 0
  ) {

    projectsGrid.innerHTML = `
      <div class="loading-state">
        <p>لا توجد مشاريع منشورة حاليًا.</p>
      </div>
    `;

    return;
  }


  projectsGrid.innerHTML =
    projects
      .map((project) => {

        const title =
          escapeHtml(project.title);

        const description =
          escapeHtml(
            project.description ||
            "مشروع من أعمال B07."
          );

        const category =
          escapeHtml(
            project.category ||
            "Project"
          );


        const image =
          project.cover_image
            ? `
              <img
                src="${escapeHtml(project.cover_image)}"
                alt="${title}"
                loading="lazy"
              >
            `
            : `
              <div class="project-placeholder">
                B07
              </div>
            `;


        const projectLink =
          project.project_url
            ? `
              <a
                href="${escapeHtml(project.project_url)}"
                target="_blank"
                rel="noopener noreferrer"
                class="button button-secondary"
              >
                مشاهدة المشروع
              </a>
            `
            : "";


        return `
          <article class="project-card">

            <div class="project-media">
              ${image}
            </div>

            <div class="project-content">

              <p class="eyebrow">
                ${category}
              </p>

              <h3>
                ${title}
              </h3>

              <p>
                ${description}
              </p>

              ${projectLink}

            </div>

          </article>
        `;

      })
      .join("");
}


/* =========================
   Start
========================= */

document.addEventListener(
  "DOMContentLoaded",
  fetchProjects
);
