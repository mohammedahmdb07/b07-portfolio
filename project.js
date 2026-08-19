"use strict";

/* =========================================
   B07 PORTFOLIO
   Single Project Details
========================================= */

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_lMrhyGww4C8LZW9Db4_Puw_35HXrOJC";


/* =========================================
   ELEMENTS
========================================= */

const loadingElement =
  document.getElementById(
    "project-loading"
  );

const errorElement =
  document.getElementById(
    "project-error"
  );

const projectElement =
  document.getElementById(
    "project-details"
  );

const titleElement =
  document.getElementById(
    "project-title"
  );

const categoryElement =
  document.getElementById(
    "project-category"
  );

const descriptionElement =
  document.getElementById(
    "project-description"
  );

const mediaElement =
  document.getElementById(
    "project-media"
  );

const projectLink =
  document.getElementById(
    "project-link"
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
   SHOW / HIDE
========================================= */

function showProject() {

  if (loadingElement) {
    loadingElement.hidden = true;
  }

  if (errorElement) {
    errorElement.hidden = true;
  }

  if (projectElement) {
    projectElement.hidden = false;
  }

}


function showError() {

  if (loadingElement) {
    loadingElement.hidden = true;
  }

  if (projectElement) {
    projectElement.hidden = true;
  }

  if (errorElement) {
    errorElement.hidden = false;
  }

}


/* =========================================
   RENDER MEDIA
========================================= */

function renderProjectMedia(project) {

  if (!mediaElement) {
    return;
  }


  mediaElement.innerHTML = "";


  const media =
    parseMediaUrls(
      project.media_urls
    );


  /* -------------------------
     Multiple uploaded media
  ------------------------- */

  if (media.length > 0) {

    media.forEach(
      (item, index) => {

        if (
          !item ||
          !item.url
        ) {
          return;
        }


        const url =
          escapeHtml(
            item.url
          );


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


        const wrapper =
          document.createElement(
            "div"
          );


        wrapper.className =
          "project-detail-media-item";


        /*
          VIDEO
        */

        if (isVideo) {

          wrapper.innerHTML = `
            <video
              class="project-detail-video"
              src="${url}"
              controls
              preload="metadata"
              playsinline
            ></video>
          `;

        }


        /*
          IMAGE
        */

        else {

          wrapper.innerHTML = `
            <img
              class="project-detail-image"
              src="${url}"
              alt="${title} - ${index + 1}"
              loading="${
                index === 0
                  ? "eager"
                  : "lazy"
              }"
            >
          `;

        }


        mediaElement.appendChild(
          wrapper
        );

      }
    );

  }


  /* -------------------------
     Cover fallback
  ------------------------- */

  else if (
    project.cover_image
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "project-detail-media-item";


    wrapper.innerHTML = `
      <img
        class="project-detail-image"
        src="${escapeHtml(
          project.cover_image
        )}"
        alt="${escapeHtml(
          project.title ||
          "B07 Project"
        )}"
        loading="eager"
      >
    `;


    mediaElement.appendChild(
      wrapper
    );

  }


  /* -------------------------
     Placeholder
  ------------------------- */

  else {

    const placeholder =
      document.createElement(
        "div"
      );


    placeholder.className =
      "project-placeholder";


    placeholder.textContent =
      "B07";


    mediaElement.appendChild(
      placeholder
    );

  }

}


/* =========================================
   LOAD PROJECT
========================================= */

async function fetchProject() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const projectId =
    params.get("id");


  if (!projectId) {

    showError();

    return;
  }


  if (
    !SUPABASE_URL ||
    !SUPABASE_PUBLISHABLE_KEY
  ) {

    showError();

    return;
  }


  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/projects` +
        `?select=id,title,description,category,cover_image,media_urls,project_url,sort_order,created_at,is_published` +
        `&id=eq.${encodeURIComponent(
          projectId
        )}` +
        `&is_published=eq.true` +
        `&limit=1`,
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
        "Supabase project error:",
        errorText
      );

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const projects =
      await response.json();


    if (
      !Array.isArray(projects) ||
      projects.length === 0
    ) {

      showError();

      return;
    }


    const project =
      projects[0];


    /* =========================================
       TITLE
    ========================================= */

    const title =
      project.title ||
      "بدون عنوان";


    if (titleElement) {

      titleElement.textContent =
        title;

    }


    document.title =
      `${title} | محمد أحمد`;


    /* =========================================
       CATEGORY
    ========================================= */

    if (categoryElement) {

      categoryElement.textContent =
        project.category ||
        "PROJECT";

    }


    /* =========================================
       DESCRIPTION
    ========================================= */

    if (descriptionElement) {

      const description =
        project.description ||
        "مشروع من أعمال B07.";


      descriptionElement.textContent =
        description;

    }


    /* =========================================
       MEDIA
    ========================================= */

    renderProjectMedia(
      project
    );


    /* =========================================
       EXTERNAL PROJECT LINK
    ========================================= */

    if (
      projectLink &&
      project.project_url
    ) {

      projectLink.href =
        project.project_url;

      projectLink.hidden =
        false;

    }


    /* =========================================
       SHOW
    ========================================= */

    showProject();


  } catch (error) {

    console.error(
      "Failed to load project:",
      error
    );

    showError();

  }

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
    fetchProject
  );

} else {

  fetchProject();

          }
