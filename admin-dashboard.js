"use strict";

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";

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


async function checkAuth() {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.href = "admin.html";
    return false;
  }

  return true;
}


async function loadProjects() {

  const { data, error } =
    await supabaseClient
      .from("projects")
      .select("*")
      .order("sort_order", {
        ascending: true
      })
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(error);

    projectsContainer.innerHTML =
      "<p>تعذر تحميل المشاريع.</p>";

    return;
  }


  if (!data || data.length === 0) {

    projectsContainer.innerHTML =
      "<p>لا توجد مشاريع حاليًا.</p>";

    return;
  }


  projectsContainer.innerHTML =
    data.map(project => `
      <article class="project-card">

        ${
          project.cover_image
            ? `
              <img
                src="${escapeHtml(project.cover_image)}"
                alt="${escapeHtml(project.title)}"
                loading="lazy"
              >
            `
            : ""
        }

        <div class="project-content">

          <p class="eyebrow">
            ${escapeHtml(project.category || "")}
          </p>

          <h3>
            ${escapeHtml(project.title)}
          </h3>

          <p>
            ${escapeHtml(project.description || "")}
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
    `).join("");
}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    message.textContent =
      "جاري إضافة المشروع...";


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

      sort_order:
        Number(
          document
            .getElementById("sort-order")
            .value
        ) || 0,

      is_published:
        document
          .getElementById("is-published")
          .checked
    };


    const { error } =
      await supabaseClient
        .from("projects")
        .insert(project);


    if (error) {

      console.error(error);

      message.textContent =
        "حدث خطأ أثناء إضافة المشروع.";

      return;
    }


    message.textContent =
      "تمت إضافة المشروع بنجاح.";

    form.reset();

    document
      .getElementById("is-published")
      .checked = true;

    await loadProjects();

  }
);


logoutButton.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    window.location.href =
      "admin.html";

  }
);


async function startDashboard() {

  const authenticated =
    await checkAuth();

  if (!authenticated) return;

  await loadProjects();

}


startDashboard();
