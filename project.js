"use strict";

/*
  PROJECT DETAILS PAGE
  Reads the project ID from:
  project.html?id=PROJECT_ID
*/

const loadingElement =
  document.getElementById("project-loading");

const errorElement =
  document.getElementById("project-error");

const projectElement =
  document.getElementById("project-details");

const titleElement =
  document.getElementById("project-title");

const categoryElement =
  document.getElementById("project-category");

const descriptionElement =
  document.getElementById("project-description");

const mediaElement =
  document.getElementById("project-media");

const projectLink =
  document.getElementById("project-link");


/*
  SUPABASE
  نفس المشروع المستخدم في app.js
*/

const SUPABASE_URL =
  "https://vzmrdfyxzjbrgbcgydbb.supabase.co";

const SUPABASE_ANON_KEY =
  "ضع_مفتاح_Supabase_نفسه_الموجود_في_app.js";


/*
  GET PROJECT ID
*/

const params =
  new URLSearchParams(
    window.location.search
  );

const projectId =
  params.get("id");


/*
  HELPERS
*/

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


/*
  CREATE MEDIA
*/

function createMedia(url, type) {

  if (!url) {
    return null;
  }


  const mediaType =
    String(type || "").toLowerCase();


  /*
    VIDEO
  */

  if (
    mediaType.includes("video") ||
    /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)
  ) {

    const video =
      document.createElement("video");

    video.src = url;

    video.controls = true;

    video.playsInline = true;

    video.preload = "metadata";

    video.setAttribute(
      "aria-label",
      "فيديو المشروع"
    );

    return video;

  }


  /*
    IMAGE
  */

  const image =
    document.createElement("img");

  image.src = url;

  image.alt =
    titleElement?.textContent ||
    "صورة المشروع";

  image.loading = "eager";

  return image;

}


/*
  LOAD PROJECT
*/

async function loadProject() {

  if (!projectId) {

    showError();

    return;

  }


  try {

    /*
      Get project from Supabase REST API.

      NOTE:
      The table name is assumed to be "projects".
      If your app.js uses another table name,
      use the same one there.
    */

    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=*`,
        {
          method: "GET",

          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization":
              `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );


    if (!response.ok) {
      throw new Error(
        "Failed to load project."
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


    /*
      TITLE
    */

    const title =
      project.title ||
      project.name ||
      "مشروع بدون عنوان";


    if (titleElement) {
      titleElement.textContent =
        title;
    }


    document.title =
      `${title} | محمد أحمد`;


    /*
      CATEGORY
    */

    const category =
      project.category ||
      project.type ||
      project.project_type ||
      "PROJECT";


    if (categoryElement) {
      categoryElement.textContent =
        category;
    }


    /*
      DESCRIPTION
    */

    const description =
      project.description ||
      project.details ||
      project.content ||
      "";


    if (descriptionElement) {

      descriptionElement.textContent =
        description;

      descriptionElement.hidden =
        !description;

    }


    /*
      PROJECT LINK
    */

    const externalLink =
      project.project_url ||
      project.url ||
      project.link;


    if (
      projectLink &&
      externalLink
    ) {

      projectLink.href =
        externalLink;

      projectLink.hidden =
        false;

    }


    /*
      MEDIA
    */

    mediaElement.innerHTML = "";


    /*
      Possible media fields.
      The first available one is used.
    */

    const mediaUrl =
      project.media_url ||
      project.image_url ||
      project.image ||
      project.thumbnail_url ||
      project.file_url ||
      project.url;


    if (mediaUrl) {

      const media =
        createMedia(
          mediaUrl,
          project.media_type ||
          project.type
        );


      if (media) {

        mediaElement.appendChild(
          media
        );

      }

    }


    /*
      If there is no media,
      show a simple placeholder.
    */

    if (
      !mediaElement.children.length
    ) {

      const placeholder =
        document.createElement("div");

      placeholder.className =
        "project-placeholder";

      placeholder.textContent =
        "B07";

      mediaElement.appendChild(
        placeholder
      );

    }


    /*
      SUCCESS
    */

    showProject();


  } catch (error) {

    console.error(
      "Project loading error:",
      error
    );

    showError();

  }

}


loadProject();
