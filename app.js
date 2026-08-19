"use strict";

/* =========================================
   B07 PORTFOLIO
   Public Projects
========================================= */

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


const projectsGrid =
  document.getElementById(
    "projects-grid"
  );


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


function showMessage(text) {

  if (!projectsGrid) {
    return;
  }

  projectsGrid.innerHTML = `
    <div class="loading-state">
      <p>${escapeHtml(text)}</p>
    </div>
  `;

}


/* =========================================
   MEDIA PARSER
========================================= */

function parseMediaUrls(value) {

  if (Array.isArray(value)) {
    return value;
  }


  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {

    try {

      const parsed =
        JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [];

    } catch (error) {

      console.error(
        "media_urls JSON error:",
        error
      );

      return [];
    }
  }


  return [];

}


/* =========================================
   MEDIA RENDERER
========================================= */

function renderProjectMedia(project) {

  const media =
    parseMediaUrls(
      project.media_urls
    );


  /* -------------------------
     Uploaded media
  ------------------------- */

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
            project.title ||
            "B07 Project"
          );


        const isVideo =
          item.type === "video" ||
          (
            typeof item.mime_type ===
            "string" &&
            item.mime_type.startsWith(
              "video/"
            )
          );


        if (isVideo) {

          return `
            <video
              class="project-video"
              src="${url}"
              controls
              preload="metadata"
              playsinline
            ></video>
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


  /* -------------------------
     Cover image fallback
  ------------------------- */

  if (project.cover_image) {

    return `
      <img
        class="project-image"
        src="${escapeHtml(
          project.cover_image
        )}"
        alt="${escapeHtml(
          project.title ||
          "B07 Project"
        )}"
        loading="lazy"
      >
    `;

  }


  /* -------------------------
     Placeholder
  ------------------------- */

  return `
    <div
      class="project-placeholder"
      aria-label="B07"
    >
      B07
    </div>
  `;

}


/* =========================================
   OPEN PROJECT DETAILS
========================================= */

function openProject(projectId) {

  if (!projectId) {
    return;
  }


  window.location.href =
    `project.html?id=${encodeURIComponent(
      projectId
    )}`;

}


/* =========================================
   PROJECT CARD INTERACTION
========================================= */

function setupProjectCards() {

  if (!projectsGrid) {
    return;
  }


  const cards =
    projectsGrid.querySelectorAll(
      ".project-card[data-project-id]"
    );


  cards.forEach(card => {

    /* -------------------------
       Mouse / Touch
    ------------------------- */

    card.addEventListener(
      "click",
      event => {

        /*
          Keep external links working.
        */

        if (
          event.target.closest(
            ".project-external-link"
          )
        ) {

          return;
        }


        /*
          Don't navigate when using
          video controls.
        */

        if (
          event.target.closest(
            "video"
          )
        ) {

          return;
        }


        openProject(
          card.dataset.projectId
        );

      }
    );


    /* -------------------------
       Keyboard
    ------------------------- */

    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();


          openProject(
            card.dataset.projectId
          );

        }

      }
    );

  });

}


/* =========================================
   LOAD PROJECTS
========================================= */

async function fetchProjects() {

  if (!projectsGrid) {
    return;
  }


  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY
  ) {

    showMessage(
      "لم يتم إعداد الاتصال بقاعدة البيانات."
    );

    return;
  }


  projectsGrid.innerHTML = `
    <div class="loading-state">
      <p>جاري تحميل المشاريع...</p>
    </div>
  `;


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/projects` +
        `?select=id,title,description,category,cover_image,media_urls,project_url,sort_order,created_at` +
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

      const errorText =
        await response.text();


      console.error(
        "Supabase error:",
        errorText
      );


      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const projects =
      await response.json();


    renderProjects(
      Array.isArray(projects)
        ? projects
        : []
    );

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


/* =========================================
   RENDER PROJECTS
========================================= */

function renderProjects(projects) {

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

        const projectId =
          escapeHtml(
            project.id
          );


        const title =
          escapeHtml(
            project.title ||
            "بدون عنوان"
          );


        const category =
          escapeHtml(
            project.category ||
            "Project"
          );


        const description =
          escapeHtml(
            project.description ||
            "مشروع من أعمال B07."
          );


        const media =
          renderProjectMedia(
            project
          );


        /*
          External project link
        */

        const projectLink =
          project.project_url
            ? `
              <a
                href="${escapeHtml(
                  project.project_url
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="button button-secondary project-external-link"
              >
                مشاهدة المشروع
              </a>
            `
            : "";


        return `
          <article
            class="project-card"
            data-project-id="${projectId}"
            tabindex="0"
            role="link"
            aria-label="فتح مشروع ${title}"
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


  /*
    Activate cards
  */

  setupProjectCards();

}


/* =========================================
   START
========================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    fetchProjects
  );

} else {

  fetchProjects();

           }
