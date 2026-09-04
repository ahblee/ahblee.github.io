const craftHeart = document.querySelector(".heart");
const craftGreeting = document.querySelector(".greeting");
const craftDialog = document.getElementById("craftDialog");
const craftOpenButtons = document.querySelectorAll("[data-craft-open]");
const craftCloseButtons = document.querySelectorAll("[data-close]");
const craftProjects = document.querySelectorAll("[data-craft-project]");
const craftPanel = craftDialog?.querySelector(".dialog-panel");
const craftProjectIds = Array.from(craftProjects, (project) => project.dataset.craftProject);
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let lastFocusedCraftButton = null;
let activeCraftProjectId = craftProjectIds[0];
let closeCraftTimer = null;

function triggerCraftHeart() {
  if (!craftHeart || craftHeart.classList.contains("is-waving")) {
    return;
  }

  craftHeart.classList.add("is-waving");
}

window.addEventListener("load", () => {
  document.body.classList.add("is-opening-ready");

  if (!reducedMotionQuery.matches) {
    craftGreeting?.classList.add("is-hover-preview");
  }
});

craftGreeting?.addEventListener("animationend", (event) => {
  if (event.animationName === "craftHoverTextPreview") {
    craftGreeting.classList.remove("is-hover-preview");
  }
});

craftGreeting?.addEventListener("pointerenter", () => {
  craftGreeting.classList.remove("is-hover-preview");
});

if (craftHeart) {
  craftGreeting?.addEventListener("mouseenter", triggerCraftHeart);
  craftHeart.addEventListener("animationend", () => {
    craftHeart.classList.remove("is-waving");
  });
}

function setActiveCraftProject(projectId) {
  const nextProjectId = craftProjectIds.includes(projectId) ? projectId : craftProjectIds[0];

  craftProjects.forEach((project) => {
    const isActive = project.dataset.craftProject === nextProjectId;

    project.classList.toggle("is-active", isActive);

    if (isActive) {
      const title = project.querySelector("h2");

      if (title) {
        title.id = "craftDialogTitle";
      }
    } else {
      project.querySelector("h2")?.removeAttribute("id");
    }
  });

  activeCraftProjectId = nextProjectId;
  if (craftPanel) {
    craftPanel.scrollTop = 0;
  }
}

function moveCraftProject(offset) {
  if (!craftProjectIds.length) {
    return;
  }

  const currentIndex = craftProjectIds.indexOf(activeCraftProjectId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (safeCurrentIndex + offset + craftProjectIds.length) % craftProjectIds.length;
  setActiveCraftProject(craftProjectIds[nextIndex]);
}

function openCraftProject(projectId, trigger) {
  if (!craftDialog) {
    return;
  }

  lastFocusedCraftButton = trigger;
  window.clearTimeout(closeCraftTimer);
  craftDialog.classList.remove("is-closing");
  setActiveCraftProject(projectId);

  document.body.classList.add("dialog-open");
  craftDialog.showModal();
}

function closeCraftProject() {
  if (!craftDialog?.open) {
    return;
  }

  if (reducedMotionQuery.matches) {
    craftDialog.close();
    return;
  }

  craftDialog.classList.add("is-closing");
  window.clearTimeout(closeCraftTimer);

  closeCraftTimer = window.setTimeout(() => {
    craftDialog.close();
  }, 280);
}

craftOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openCraftProject(button.dataset.craftOpen, button);
  });
});

craftCloseButtons.forEach((button) => {
  button.addEventListener("click", closeCraftProject);
});

craftDialog?.addEventListener("click", (event) => {
  if (event.target === craftDialog) {
    closeCraftProject();
  }
});

craftDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCraftProject();
});

craftDialog?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveCraftProject(-1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveCraftProject(1);
  }
});

craftDialog?.addEventListener("close", () => {
  window.clearTimeout(closeCraftTimer);
  craftDialog.classList.remove("is-closing");
  document.body.classList.remove("dialog-open");
  lastFocusedCraftButton?.focus();
});
