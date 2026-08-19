"use strict";

/*
  B07 Portfolio
  Supabase connection + public projects

  IMPORTANT:
  - Never put the Supabase service_role key here.
  - Only the public/publishable key belongs in frontend code.
*/

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


/* =========================
   DOM
========================= */

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
