window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-opening-ready");
  });
});

document.querySelectorAll(".media-wrap").forEach((wrap) => {
  const video = wrap.querySelector("video");
  const toggle = wrap.querySelector(".video-toggle");
  const replay = wrap.querySelector(".video-replay");

  if (!video || !toggle || !replay) return;

  toggle.addEventListener("click", () => {
    if (video.paused) {
      video.play();
      toggle.textContent = "Pause";
      toggle.setAttribute("aria-label", "Pause video");
    } else {
      video.pause();
      toggle.textContent = "Play";
      toggle.setAttribute("aria-label", "Play video");
    }
  });

  replay.addEventListener("click", () => {
    video.currentTime = 0;
    video.play();
    toggle.textContent = "Pause";
    toggle.setAttribute("aria-label", "Pause video");
  });
});

const depData = [
  ["Kia", 152, true],
  ["Buick", 159],
  ["Chevrolet", 162],
  ["Mitsubishi", 167],
  ["Toyota", 168],
  ["Hyundai", 170],
  ["MINI", 170],
  ["Nissan", 170],
  ["Dodge", 172],
  ["Mazda", 174],
  ["GMC", 175],
  ["Ram", 189],
  ["Jeep", 196],
  ["Honda", 205],
  ["Subaru", 215],
  ["Volkswagen", 216],
  ["Chrysler", 226],
  ["Ford", 249]
];

const satData = [
  ["Buick", 824],
  ["GMC", 821],
  ["Chevrolet", 812],
  ["Mitsubishi", 812],
  ["Subaru", 808],
  ["Jeep", 805],
  ["Dodge", 802],
  ["MINI", 802],
  ["Nissan", 799],
  ["Ford", 794],
  ["Mazda", 793],
  ["Ram", 792],
  ["Volkswagen", 792],
  ["Hyundai", 779],
  ["Chrysler", 773],
  ["Toyota", 773],
  ["Honda", 771],
  ["Kia", 766, true]
];

function buildBars(targetId, data, min, max, suffix, invert = false) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const range = max - min;

  data.forEach(([name, value, isKia], index) => {
    const column = document.createElement("div");
    const bar = document.createElement("div");
    const tip = document.createElement("span");
    const normalized = invert ? (max - value) / range : (value - min) / range;
    const height = Math.max(normalized * 100, 4);

    column.className = "bar-column";
    column.style.setProperty("--bar-height", `${height}%`);
    bar.className = `chart-bar${isKia ? " is-kia" : ""}`;
    bar.style.height = `${height}%`;
    bar.style.animationDelay = `${index * 18}ms`;
    tip.className = "bar-tip";
    tip.textContent = `${name}: ${value} ${suffix}`;

    column.append(bar, tip);
    target.appendChild(column);
  });
}

buildBars("depBars", depData, 130, 255, "PP100", true);
buildBars("satBars", satData, 760, 827, "pts");

const hero = document.querySelector(".case-hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (hero && !reduceMotion.matches) {
  let heroTicking = false;
  const firstSection = document.querySelector(".case-section");

  const updateHeroProgress = () => {
    const heroRect = hero.getBoundingClientRect();
    const firstSectionTop = firstSection
      ? firstSection.getBoundingClientRect().top
      : heroRect.bottom;
    const transitionStart = window.innerHeight * 0.82;
    const transitionEnd = window.innerHeight * 0.34;
    const rawProgress =
      (transitionStart - firstSectionTop) / (transitionStart - transitionEnd);
    const progress = Math.min(Math.max(rawProgress, 0), 1);
    const eased = progress * progress * (3 - 2 * progress);
    const styles = getComputedStyle(document.documentElement);
    const pagePadding =
      parseFloat(styles.getPropertyValue("--page-padding")) || 40;
    const heroMax =
      parseFloat(styles.getPropertyValue("--case-hero-max")) || hero.offsetWidth;
    const availableWidth = Math.max(window.innerWidth - pagePadding * 2, 320);
    const startWidth = Math.min(heroMax, availableWidth);
    const shrinkAmount = Math.min(startWidth * 0.022, 28);
    const heroWidth = startWidth - shrinkAmount * eased;

    document.documentElement.style.setProperty(
      "--hero-scroll",
      eased.toFixed(3)
    );
    document.documentElement.style.setProperty(
      "--case-hero-width",
      `${heroWidth.toFixed(2)}px`
    );
    document.documentElement.style.setProperty(
      "--hero-card-y",
      "0px"
    );
    document.documentElement.style.setProperty(
      "--hero-card-scale",
      "1"
    );
    document.documentElement.style.setProperty(
      "--hero-cover-y",
      `${(-3 * eased).toFixed(2)}px`
    );
    document.documentElement.style.setProperty(
      "--hero-cover-scale",
      (1 + eased * 0.003).toFixed(4)
    );
    document.documentElement.style.setProperty(
      "--hero-content-y",
      "0px"
    );
    document.documentElement.style.setProperty(
      "--hero-content-opacity",
      "1"
    );

    heroTicking = false;
  };

  updateHeroProgress();

  window.addEventListener(
    "scroll",
    () => {
      if (heroTicking) return;
      heroTicking = true;
      requestAnimationFrame(updateHeroProgress);
    },
    { passive: true }
  );

  window.addEventListener("resize", updateHeroProgress);
}

const sectionLinks = document.querySelectorAll("[data-section-link]");
const sections = document.querySelectorAll("[data-section]");
const sideNav = document.querySelector(".case-side-nav");
const projectSwitchers = document.querySelectorAll(".project-switcher");
const firstContentSection = document.querySelector(".case-section");

const updateSideNavVisibility = () => {
  if (!sideNav) return;

  const contentTop = firstContentSection
    ? firstContentSection.getBoundingClientRect().top
    : 0;
  const sideTop = Math.max(40, contentTop);
  const revealPoint = window.innerHeight * 0.64;

  sideNav.style.setProperty("--case-side-top", `${sideTop}px`);
  sideNav.classList.toggle("is-visible", contentTop <= revealPoint);
};

if (projectSwitchers.length) {
  document.addEventListener("click", (event) => {
    projectSwitchers.forEach((switcher) => {
      if (!switcher.contains(event.target)) {
        switcher.removeAttribute("open");
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    projectSwitchers.forEach((switcher) => {
      switcher.removeAttribute("open");
    });
  });
}

if (sectionLinks.length && sections.length) {
  updateSideNavVisibility();

  window.addEventListener("scroll", updateSideNavVisibility, { passive: true });
  window.addEventListener("resize", updateSideNavVisibility);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const sectionName = entry.target.dataset.section;

        sectionLinks.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.dataset.sectionLink === sectionName
          );
        });
      });
    },
    {
      rootMargin: "-86% 0px -8% 0px",
      threshold: 0
    }
  );

  sections.forEach((section) => observer.observe(section));
}

document.querySelectorAll(".next-grid video").forEach((video) => {
  const link = video.closest("a");
  if (!link) return;

  link.addEventListener("pointerenter", () => video.play());
  link.addEventListener("pointerleave", () => {
    video.pause();
    video.currentTime = 0;
  });
});


