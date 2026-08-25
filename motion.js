"use strict";

/* =========================================
   B07 PORTFOLIO
   Smooth Page Motion System
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     PAGE ENTER
     ========================= */
  requestAnimationFrame(() => {
    document.body.classList.add("page-ready");
  });

  /* =========================
     PAGE TRANSITION
     ========================= */
  const pageLinks = document.querySelectorAll(
    'a[href$=".html"], a[href^="./"]'
  );

  pageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      ) {
        return;
      }

      const currentPage =
        window.location.pathname.split("/").pop() || "index.html";
      const targetPage = href.split("/").pop().split("?")[0];

      if (targetPage === currentPage || targetPage === "") {
        return;
      }

      event.preventDefault();
      document.body.classList.add("page-leaving");

      setTimeout(() => {
        window.location.href = href;
      }, 320);
    });
  });

  /* =========================
     SCROLL REVEAL
     ========================= */
  const revealElements = document.querySelectorAll(
    ".section-heading, .about-content, .about-image, .project-card, .contact-card"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observerInstance.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    revealElements.forEach((element) => {
      element.classList.add("reveal-element");
      observer.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  /* =========================
     DYNAMIC PROJECT CARDS
     ========================= */
  const projectsGrid = document.getElementById("projects-grid");

  if (projectsGrid) {
    const projectObserver = new MutationObserver(() => {
      const cards = projectsGrid.querySelectorAll(".project-card");

      cards.forEach((card, index) => {
        if (card.classList.contains("motion-ready")) return;

        card.classList.add("motion-ready");
        card.style.setProperty(
          "--motion-delay",
          `${Math.min(index * 70, 350)}ms`
        );

        requestAnimationFrame(() => {
          card.classList.add("is-visible");
        });
      });
    });

    projectObserver.observe(projectsGrid, {
      childList: true,
      subtree: true
    });
  }
});
