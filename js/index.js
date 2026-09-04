const helloWave = document.querySelector(".hello-wave");

const helloGreeting = document.querySelector(".hello-greeting");

const pageLoader = document.getElementById("pageLoader");

const loaderFacts = document.getElementById("loaderFacts");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const shouldSkipLoader = window.location.hash === "#work";

function playHelloWave() {
  if (
    !helloWave ||
    helloWave.classList.contains(
      "is-waving"
    )
  ) {
    return;
  }

  helloWave.classList.add(
    "is-waving"
  );
}

function startOpeningAnimation() {
  requestAnimationFrame(() => {
    document.body.classList.add(
      "is-opening-ready"
    );

    if (!prefersReducedMotion) {
      helloGreeting?.classList.add(
        "is-hover-preview"
      );
    }
  });

  setTimeout(
    playHelloWave,
    850
  );
}

function completePageLoader() {
  document.body.classList.add(
    "is-loader-finished"
  );

  pageLoader?.classList.add(
    "is-done"
  );

  window.setTimeout(
    () => {
      document.body.classList.remove(
        "is-loader-running"
      );
    },
    560
  );

  window.setTimeout(
    startOpeningAnimation,
    540
  );
}

function finishPageLoader() {
  document.body.classList.remove(
    "is-loading"
  );

  window.setTimeout(
    completePageLoader,
    80
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForMediaReady() {
  const media =
    [
      ...document.querySelectorAll("[data-loader-media]")
    ];

  if (!media.length) {
    return Promise.resolve();
  }

  const mediaReady =
    media.map((item) => {
      if (item.tagName === "IMG") {
        if (item.complete && item.naturalWidth > 0) {
          return Promise.resolve();
        }

        if (item.decode) {
          return item.decode().catch(() => {});
        }

        return new Promise((resolve) => {
          item.addEventListener("load", resolve, { once: true });
          item.addEventListener("error", resolve, { once: true });
        });
      }

      if (item.readyState >= 2) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        item.addEventListener("loadeddata", resolve, { once: true });
        item.addEventListener("canplay", resolve, { once: true });
        item.addEventListener("error", resolve, { once: true });
      });
    });

  return Promise.race([
    Promise.allSettled(mediaReady),
    wait(6500)
  ]);
}

document.body.classList.add("is-loading");

window.addEventListener(
  "DOMContentLoaded",
  () => {
    if (
      prefersReducedMotion ||
      shouldSkipLoader ||
      !pageLoader ||
      !loaderFacts
    ) {
      document.body.classList.add(
        "is-loader-finished"
      );

      pageLoader?.classList.add(
        "is-done"
      );

      document.body.classList.remove(
        "is-loading",
        "is-loader-running"
      );

      startOpeningAnimation();
      return;
    }

    document.body.classList.add(
      "is-loader-running"
    );

    const loaderMessagePool = [
      "rolling into the playground",
      "packing a few tiny details",
      "warming up the tiny interactions",
      "making room for experiments",
      "checking the little corners",
      "getting the work ready"
    ];

    const loaderWelcomePool = [
      "done, welcome",
      "come on in",
      "you made it",
      "welcome in"
    ];

    const loaderMessages =
      [...loaderMessagePool]
        .sort(() => Math.random() - 0.5)
        .slice(
          0,
          Math.random() > 0.48 ? 3 : 2
        );

    loaderFacts.textContent =
      loaderMessages[0];

    window.setTimeout(() => {
      pageLoader.classList.add(
        "is-complete"
      );
    }, 720);

    loaderMessages
      .slice(1)
      .forEach((message, index) => {
        window.setTimeout(() => {
          loaderFacts.classList.add(
            "is-switching"
          );

          window.setTimeout(() => {
            loaderFacts.textContent =
              message;

            loaderFacts.classList.remove(
              "is-switching"
            );
          }, 220);
        }, 1450 + index * 760);
      });

    Promise
      .all([
        wait(3400),
        waitForMediaReady()
      ])
      .then(() => {
      loaderFacts.classList.add(
        "is-switching"
      );

      window.setTimeout(() => {
        loaderFacts.textContent =
          [...loaderWelcomePool]
            .sort(() => Math.random() - 0.5)
            [0];

        pageLoader.classList.add(
          "is-welcome"
        );

        loaderFacts.classList.remove(
          "is-switching"
        );
      }, 220);

      window.setTimeout(
        finishPageLoader,
        950
      );
    });
  }
);

const revealPieces =
  document.querySelectorAll(".reveal-piece");

if (revealPieces.length) {
  if (prefersReducedMotion) {
    revealPieces.forEach((piece) => {
      piece.classList.add("is-visible");
    });
  } else {
    const revealObserver =
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px"
        }
      );

    revealPieces.forEach((piece) => {
      revealObserver.observe(piece);
    });
  }
}

if (helloWave) {
  helloGreeting?.addEventListener(
    "pointerenter",
    () => {
      helloGreeting.classList.remove(
        "is-hover-preview"
      );

      playHelloWave();
    }
  );

  helloWave.addEventListener(
    "animationend",
    () => {
      helloWave.classList.remove(
        "is-waving"
      );
    }
  );

}

helloGreeting?.addEventListener(
  "animationend",
  (event) => {
    if (
      event.animationName === "introHoverTextPreview"
    ) {
      helloGreeting.classList.remove(
        "is-hover-preview"
      );
    }
  }
);

/* --- GRASS --- */

if (window.__grassAnimationFrame) { cancelAnimationFrame(window.__grassAnimationFrame); }
if (window.__grassResizeObserver) { window.__grassResizeObserver.disconnect(); }

const grassCard = document.querySelector(".grass-card");
const grassCanvas = document.getElementById("grassParticles");
const grassRange = document.getElementById("grassRange");
const grassModes = document.querySelectorAll(".grass-mode");

if ( grassCard && grassCanvas && grassRange && grassModes.length) {
  const ctx = grassCanvas.getContext("2d", { alpha: true });
  const grassSettings = { wind: 30, shine: 60 };

  let currentWind = grassSettings.wind;
  let currentShine = grassSettings.shine;
  let activeGrassMode = "wind";

  grassModes.forEach((button) => {
    button.addEventListener("click", () => {
      activeGrassMode = button.dataset.mode;

      grassModes.forEach((item) => {
        const isActive =
          item.dataset.mode === activeGrassMode;

        item.classList.toggle("is-active", isActive);

        item.setAttribute(
          "aria-pressed",
          String(isActive)
        );
      });

      grassRange.value =
        grassSettings[activeGrassMode];

      grassRange.setAttribute(
        "aria-label",
        `${activeGrassMode} strength`
      );
    });
  });
  grassRange.addEventListener("input", () => {
    grassSettings[activeGrassMode] =
      Number(grassRange.value);
  });

  function random(min, max) {
    return min + Math.random() * (max - min);
  }
  function smoothTo(current, target, speed, dt) {
    const amount =
      1 - Math.pow(1 - speed, dt);

    return current + (target - current) * amount;
  }

  const seedImage = new Image();
  let seedImageReady = false;

  seedImage.onload = () => { seedImageReady = true; };
  seedImage.onerror = () => {
    console.warn(
      "Could not load dandelion-seed.png"
    );
  };
  seedImage.src =  "assets/img/index/dandelion-seed.png";

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];

  function createPollenSprite({
    size = 32,
    centerAlpha = 0.9,
    middleAlpha = 0.3
  }) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const spriteCtx = canvas.getContext("2d");
    const center = size / 2;

    const gradient =
      spriteCtx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        center
      );

    gradient.addColorStop(
      0,
      `rgba(250,248,215,${centerAlpha})`
    );

    gradient.addColorStop(
      0.28,
      `rgba(247,245,205,${middleAlpha})`
    );

    gradient.addColorStop(
      1,
      "rgba(247,245,205,0)"
    );

    spriteCtx.fillStyle = gradient;
    spriteCtx.fillRect(0, 0, size, size);

    return canvas;
  }
  const tinyPollenSprite =
    createPollenSprite({
      size: 28,
      centerAlpha: 0.88,
      middleAlpha: 0.28
    });
  const mediumPollenSprite =
    createPollenSprite({
      size: 38,
      centerAlpha: 0.95,
      middleAlpha: 0.34
    });
  const brightPollenSprite =
    createPollenSprite({
      size: 48,
      centerAlpha: 1,
      middleAlpha: 0.42
    });

  function createShineSprite() {
    const size = 78;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const shineCtx = canvas.getContext("2d");
    const center = size / 2;

    const gradient =
      shineCtx.createRadialGradient(
        center,
        center,
        0,
        center,
        center,
        center
      );

    gradient.addColorStop(
      0,
      "rgba(255,255,236,1)"
    );

    gradient.addColorStop(
      0.12,
      "rgba(255,251,214,0.72)"
    );

    gradient.addColorStop(
      0.34,
      "rgba(255,244,180,0.28)"
    );

    gradient.addColorStop(
      1,
      "rgba(255,244,180,0)"
    );

    shineCtx.fillStyle = gradient;
    shineCtx.fillRect(0, 0, size, size);

    return canvas;
  }
  const shineSprite = createShineSprite();

  function createTinyPollen(randomStart = true) {
    const depth = random(0.35, 0.9);

    return {
      type: "tiny",

      x: randomStart
        ? random(0, width)
        : random(-30, -5),

      y: random(
        5,
        Math.max(height - 5, 6)
      ),

      depth,

      /* BIGGER */
      size: random(3.2, 5.4) * depth,

      baseSpeed: random(0.14, 0.3),

      phase: random(0, Math.PI * 2),

      phaseSpeed: random(0.0025, 0.007),

      verticalDrift: random(-0.012, 0.012),

      /* MORE VISIBLE */
      opacity: random(0.22, 0.38),

      shineAffinity: Math.random(),

      twinkleOffset: random(0, Math.PI * 2)
    };
  }

  function createMediumPollen(randomStart = true) {
    const depth = random(0.55, 1.08);

    return {
      type: "medium",

      x: randomStart
        ? random(0, width)
        : random(-35, -5),

      y: random(
        8,
        Math.max(height - 8, 9)
      ),

      depth,

      /* BIGGER */
      size: random(5.2, 8.4) * depth,

      baseSpeed: random(0.17, 0.33),

      phase: random(0, Math.PI * 2),

      phaseSpeed: random(0.0025, 0.007),

      verticalDrift: random(-0.016, 0.016),

      /* MORE VISIBLE */
      opacity: random(0.24, 0.4),

      shineAffinity: random(0.35, 1),

      twinkleOffset: random(0, Math.PI * 2)
    };
  }

  function createGlowPollen(randomStart = true) {
    const depth = random(0.78, 1.16);

    return {
      type: "glow",

      x: randomStart
        ? random(0, width)
        : random(-40, -10),

      y: random(
        12,
        Math.max(height - 12, 13)
      ),

      depth,

      /* BIGGER */
      size: random(7.2, 10.6) * depth,

      baseSpeed: random(0.15, 0.28),

      phase: random(0, Math.PI * 2),

      phaseSpeed: random(0.0025, 0.006),

      verticalDrift: random(-0.012, 0.012),

      /* MORE VISIBLE */
      opacity: random(0.28, 0.7),

      shineAffinity: random(0.82, 1.5),

      twinkleOffset: random(0, Math.PI * 2)
    };
  }

  function createSeed(randomStart = true) {
    const depth = random(0.8, 1.06);

    return {
      type: "seed",

      x: randomStart
        ? random(width * 0.08, width * 0.92)
        : random(-60, -25),

      y: random(height * 0.1, height * 0.9),

      depth,

      /* SLIGHTLY BIGGER */
      size: random(44, 56) * depth,

      baseSpeed: random(0.11, 0.2),

      phase: random(0, Math.PI * 2),

      phaseSpeed: random(0.0025, 0.006),

      verticalDrift: random(-0.015, 0.015),

      angle: random(-0.65, 0.65),

      rotationSpeed: random(-0.0007, 0.0007),

      /* MORE VISIBLE */
      opacity: random(0.72, 0.88)
    };
  }

  function buildParticles() {
    particles = [];

    /* MORE PARTICLES */
    const tinyCount = 56;
    const mediumCount = 14;
    const glowCount = 6;
    const seedCount = 3;

    for (let i = 0; i < tinyCount; i++) {
      particles.push(createTinyPollen(true));
    }

    for (let i = 0; i < mediumCount; i++) {
      particles.push(createMediumPollen(true));
    }

    for (let i = 0; i < glowCount; i++) {
      particles.push(createGlowPollen(true));
    }

    for (let i = 0; i < seedCount; i++) {
      particles.push(createSeed(true));
    }
  }

  function resizeGrassCanvas() {
    const rect =
      grassCard.getBoundingClientRect();

    const newWidth = rect.width;
    const newHeight = rect.height;

    if (
      Math.abs(newWidth - width) < 0.5 &&
      Math.abs(newHeight - height) < 0.5
    ) {
      return;
    }

    width = newWidth;
    height = newHeight;

    dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    grassCanvas.width =
      Math.round(width * dpr);

    grassCanvas.height =
      Math.round(height * dpr);

    grassCanvas.style.width = `${width}px`;
    grassCanvas.style.height = `${height}px`;

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    buildParticles();
  }

  function drawPollen(particle) {
    let sprite;

    if (particle.type === "tiny") {
      sprite = tinyPollenSprite;
    } else if (particle.type === "medium") {
      sprite = mediumPollenSprite;
    } else {
      sprite = brightPollenSprite;
    }

    const size = particle.size;

    ctx.save();
    ctx.globalAlpha = particle.opacity;

    ctx.drawImage(
      sprite,
      particle.x - size / 2,
      particle.y - size / 2,
      size,
      size
    );

    ctx.restore();
  }

  function drawShine(particle, shine, time) {
    const startThreshold = 0.18;

    const normalizedShine =
      Math.max(
        0,
        (shine - startThreshold) /
          (1 - startThreshold)
      );

    if (normalizedShine <= 0) {
      return;
    }

    const wave =
      (
        Math.sin(
          time * 0.0013 +
            particle.twinkleOffset
        ) + 1
      ) / 2;

    const intensity =
      normalizedShine *
      particle.shineAffinity *
      (0.18 + wave * 0.82);

    if (intensity < 0.12) {
      return;
    }

    const bloomSize =
      Math.max(
        12,
        particle.size * (3 + intensity * 3.6)
      );

    ctx.save();

    /* stronger but still soft */
    ctx.globalAlpha =
      Math.min(intensity * 0.68, 0.76);

    ctx.drawImage(
      shineSprite,
      particle.x - bloomSize / 2,
      particle.y - bloomSize / 2,
      bloomSize,
      bloomSize
    );

    if (intensity > 0.26) {
      ctx.globalAlpha =
        Math.min(
          (intensity - 0.14) * 0.95,
          0.86
        );

      ctx.fillStyle = "rgba(255,255,238,1)";
      ctx.beginPath();

      ctx.arc(
        particle.x,
        particle.y,
        Math.max(0.5, particle.size * 0.18),
        0,
        Math.PI * 2
      );

      ctx.fill();
    }

    if (
      intensity > 0.62 &&
      particle.shineAffinity > 0.72
    ) {
      const glint = 1.8 + intensity * 2.8;

      ctx.globalAlpha =
        (intensity - 0.5) * 0.62;

      ctx.strokeStyle = "rgba(255,255,238,1)";
      ctx.lineWidth = 0.5;

      ctx.beginPath();

      ctx.moveTo(particle.x - glint, particle.y);
      ctx.lineTo(particle.x + glint, particle.y);

      ctx.moveTo(particle.x, particle.y - glint);
      ctx.lineTo(particle.x, particle.y + glint);

      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSeed(particle) {
    if (!seedImageReady) {
      return;
    }

    const ratio =
      seedImage.naturalWidth /
      seedImage.naturalHeight;

    const drawHeight = particle.size;
    const drawWidth = drawHeight * ratio;

    ctx.save();

    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.angle);
    ctx.globalAlpha = particle.opacity;

    ctx.filter = "brightness(1.08)";

    ctx.drawImage(
      seedImage,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }

  function resetParticle(particle) {
    let replacement;

    switch (particle.type) {
      case "tiny":
        replacement = createTinyPollen(false);
        break;

      case "medium":
        replacement = createMediumPollen(false);
        break;

      case "glow":
        replacement = createGlowPollen(false);
        break;

      case "seed":
        replacement = createSeed(false);
        break;
    }

    Object.assign(particle, replacement);
  }

  let lastFrameTime = performance.now();

  function animateGrass(time) {
    const deltaMs =
      Math.min(
        Math.max(time - lastFrameTime, 0),
        33.334
      );

    const dt = deltaMs / 16.667;
    lastFrameTime = time;

    ctx.clearRect(0, 0, width, height);

    currentWind = smoothTo(
      currentWind,
      grassSettings.wind,
      0.075,
      dt
    );

    currentShine = smoothTo(
      currentShine,
      grassSettings.shine,
      0.075,
      dt
    );

    const wind =
      0.18 + (currentWind / 100) * 2.3;

    const shine = currentShine / 100;

    particles.forEach((particle) => {
      particle.phase +=
        particle.phaseSpeed *
        (0.7 + wind * 0.4) *
        dt;

      particle.x +=
        particle.baseSpeed *
        wind *
        particle.depth *
        dt;

      particle.y +=
        (
          Math.sin(particle.phase) *
            0.09 *
            (0.5 + wind) +
          particle.verticalDrift
        ) * dt;

      if (particle.type === "seed") {
        particle.y +=
          Math.cos(particle.phase * 0.72) *
          0.065 *
          wind *
          dt;

        particle.angle +=
          particle.rotationSpeed *
          (0.6 + wind) *
          dt;
      }

      if (
        particle.x > width + 65 ||
        particle.y < -55 ||
        particle.y > height + 55
      ) {
        resetParticle(particle);
      }

      if (particle.type === "seed") {
        drawSeed(particle);
      } else {
        drawPollen(particle);
        drawShine(particle, shine, time);
      }
    });

    window.__grassAnimationFrame =
      requestAnimationFrame(animateGrass);
  }

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        lastFrameTime = performance.now();
      }
    }
  );

  window.addEventListener("focus", () => { lastFrameTime = performance.now(); });
  window.__grassResizeObserver = new ResizeObserver(() => { resizeGrassCanvas();  });  
  window.__grassResizeObserver.observe(grassCard);
  grassRange.value = grassSettings.wind;

  resizeGrassCanvas();
  lastFrameTime = performance.now();
  window.__grassAnimationFrame = requestAnimationFrame(animateGrass);

}

const grassStatus = document.getElementById("grassStatus");
const grassStatusText = document.getElementById("grassStatusText");

if (grassStatus && grassStatusText) {

  const grassMessages = [
    "Based in Vancouver, B.C.",
    "Fueled by coffee and Figma",
    "AI experiments in progress",
    "Probably fixing 2px of spacings"
  ];

  let grassMessageIndex = 0;
  let grassStatusChanging = false;

  grassStatus.addEventListener("click", () => {

    if (grassStatusChanging) return;

    grassStatusChanging = true;

    grassStatusText.classList.add("is-fading");


    setTimeout(() => {

      grassMessageIndex =
        (grassMessageIndex + 1) %
        grassMessages.length;

      grassStatusText.textContent =
        grassMessages[grassMessageIndex];

      grassStatusText.classList.remove("is-fading");


      setTimeout(() => {
        grassStatusChanging = false;
      }, 400);

    }, 400);

  });

}



/* --- OBJECT --- */

const objectStage = document.getElementById("objectStage");
const objectSwitcher = document.getElementById("objectSwitcher");
const objectPosition = document.getElementById("objectPosition");
const objectLook = document.getElementById("objectLook");
const objectImg = document.getElementById("objectImg");
const objectShadow = document.getElementById("objectShadow");

if ( objectStage && objectSwitcher && objectPosition && objectLook && objectImg && objectShadow) {
  
  const objects = [
    {
      src: "assets/img/index/camera.png",

      width: "100%",
      height: "100%",

      motion: "sway",

      glow:
        "rgba(221, 158, 88, 0.23)",

      shadowWidth: "82px",

      spring: 0.065,
      damping: 0.82
    },

    {
      src: "assets/img/index/tanghulu.png",

      width: "98%",
      height: "98%",

      motion: "bob",

      glow:
        "rgba(255, 126, 132, 0.20)",

      shadowWidth: "48px",

      spring: 0.085,
      damping: 0.77
    },

    {
      src: "assets/img/index/coffee.png",

      width: "98%",
      height: "98%",

      motion: "float",

      glow:
        "rgba(189, 123, 66, 0.19)",

      shadowWidth: "72px",

      spring: 0.07,
      damping: 0.81
    }
  ];

  let currentObject = 0;

  let x = 0;
  let y = 0;

  let targetX = 0;
  let targetY = 0;

  let velocityX = 0;
  let velocityY = 0;

  let pointerVelocityX = 0;
  let pointerVelocityY = 0;

  let dragging = false;
  let didDrag = false;
  let settling = false;
  let switching = false;
  let suppressClick = false;

  let startPointerX = 0;
  let startPointerY = 0;

  let startObjectX = 0;
  let startObjectY = 0;

  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerTime = 0;

  const dragThreshold = 5;

  objects.forEach((object) => {
    const image = new Image();
    image.src = object.src;
  });

  function clamp(
    value,
    min,
    max
  ) {
    return Math.min(
      Math.max(value, min),
      max
    );
  }
  function getCurrentObject() { return objects[currentObject]; }

  function applyObject(object) {
    objectImg.src = object.src;

    objectImg.style.setProperty(
      "--object-width",
      object.width
    );

    objectImg.style.setProperty(
      "--object-height",
      object.height
    );

    objectStage.dataset.motion =
      object.motion;

    objectStage.style.setProperty(
      "--object-glow",
      object.glow
    );

    objectStage.style.setProperty(
      "--shadow-width",
      object.shadowWidth
    );
  }

  function updateLook(
    moveX = 0,
    moveY = 0,
    rotate = 0,
    scale = 1
  ) {
    objectLook.style.setProperty(
      "--look-x",
      `${moveX}px`
    );

    objectLook.style.setProperty(
      "--look-y",
      `${moveY}px`
    );

    objectLook.style.setProperty(
      "--look-rotate",
      `${rotate}deg`
    );

    objectLook.style.setProperty(
      "--look-scale",
      scale
    );
  }

  function resetLook() {
    updateLook(
      0,
      0,
      0,
      1
    );
  }

  function updateHover(event) {
    if (
      dragging ||
      switching
    ) {
      return;
    }

    const rect =
      objectStage.getBoundingClientRect();

    const px =
      (
        event.clientX -
        rect.left
      ) / rect.width;

    const py =
      (
        event.clientY -
        rect.top
      ) / rect.height;

    const nx =
      clamp(
        px - 0.5,
        -0.5,
        0.5
      );

    const ny =
      clamp(
        py - 0.5,
        -0.5,
        0.5
      );

    updateLook(
      nx * 6,
      ny * 4,
      nx * 2.5,
      1.025
    );
  }

  function updateShadow() {
    const shadowX =
      x * 0.32;

    const shadowY =
      y * 0.08;

    const vertical =
      clamp(
        y,
        -80,
        80
      );

    const scale =
      clamp(
        1 +
        vertical * 0.0022,
        0.8,
        1.18
      );

    const opacity =
      clamp(
        0.42 +
        vertical * 0.0018,
        0.24,
        0.58
      );

    objectShadow.style.transform =
      `
        translateX(-50%)
        translate(
          ${shadowX}px,
          ${shadowY}px
        )
        scale(${scale})
      `;

    objectShadow.style.opacity =
      opacity;
  }

  function render() {
    const object =
      getCurrentObject();

    if (dragging) {
      x +=
        (targetX - x) *
        0.38;

      y +=
        (targetY - y) *
        0.38;
    }

    else if (settling) {
      velocityX +=
        -x * object.spring;

      velocityY +=
        -y * object.spring;

      velocityX *=
        object.damping;

      velocityY *=
        object.damping;

      x += velocityX;
      y += velocityY;

      if (
        Math.abs(x) < 0.15 &&
        Math.abs(y) < 0.15 &&
        Math.abs(velocityX) < 0.15 &&
        Math.abs(velocityY) < 0.15
      ) {
        x = 0;
        y = 0;

        velocityX = 0;
        velocityY = 0;

        settling = false;

        objectStage.classList.remove(
          "is-interacting"
        );
      }
    }

    objectPosition.style.transform =
      `
        translate3d(
          ${x}px,
          ${y}px,
          0
        )
      `;

    updateShadow();

    requestAnimationFrame(render);
  }
  
  function startDrag(event) {
    if (switching) return;

    dragging = true;
    didDrag = false;
    settling = false;

    objectStage.classList.add(
      "is-interacting",
      "is-dragging"
    );

    startPointerX =
      event.clientX;

    startPointerY =
      event.clientY;

    startObjectX = x;
    startObjectY = y;

    lastPointerX =
      event.clientX;

    lastPointerY =
      event.clientY;

    lastPointerTime =
      event.timeStamp;

    pointerVelocityX = 0;
    pointerVelocityY = 0;

    objectLook.setPointerCapture(
      event.pointerId
    );

    updateLook(
      0,
      0,
      0,
      1.035
    );
  }

  function dragObject(event) {
    if (!dragging) return;

    const rect =
      objectStage.getBoundingClientRect();

    const deltaX =
      event.clientX -
      startPointerX;

    const deltaY =
      event.clientY -
      startPointerY;

    if (
      Math.hypot(
        deltaX,
        deltaY
      ) > dragThreshold
    ) {
      didDrag = true;
    }

    const maxX =
      Math.max(
        18,
        rect.width / 2 - 80
      );

    const maxY =
      Math.max(
        18,
        rect.height / 2 - 76
      );

    targetX =
      clamp(
        startObjectX +
        deltaX,
        -maxX,
        maxX
      );

    targetY =
      clamp(
        startObjectY +
        deltaY,
        -maxY,
        maxY
      );

    const deltaTime =
      Math.max(
        event.timeStamp -
        lastPointerTime,
        8
      );

    pointerVelocityX =
      (
        event.clientX -
        lastPointerX
      ) /
      deltaTime *
      16;

    pointerVelocityY =
      (
        event.clientY -
        lastPointerY
      ) /
      deltaTime *
      16;

    lastPointerX =
      event.clientX;

    lastPointerY =
      event.clientY;

    lastPointerTime =
      event.timeStamp;

    const dragRotate =
      clamp(
        pointerVelocityX *
        0.35,
        -3.5,
        3.5
      );

    updateLook(
      0,
      0,
      dragRotate,
      1.035
    );
  }

  function endDrag(event) {
    if (!dragging) return;

    dragging = false;

    objectStage.classList.remove(
      "is-dragging"
    );

    if (
      objectLook.hasPointerCapture(
        event.pointerId
      )
    ) {
      objectLook.releasePointerCapture(
        event.pointerId
      );
    }

    resetLook();

    if (didDrag) {
      suppressClick = true;

      velocityX =
        pointerVelocityX *
        0.7;

      velocityY =
        pointerVelocityY *
        0.7;

      settling = true;

      setTimeout(() => {
        suppressClick = false;
      }, 100);
    }

    else {
      x = 0;
      y = 0;

      targetX = 0;
      targetY = 0;

      objectStage.classList.remove(
        "is-interacting"
      );
    }
  }

  function cycleObject() {
    if (
      switching ||
      suppressClick
    ) {
      return;
    }

    switching = true;

    objectStage.classList.add(
      "is-switching"
    );

    objectImg.classList.add(
      "is-leaving"
    );

    setTimeout(() => {
      currentObject =
        (
          currentObject + 1
        ) %
        objects.length;

      applyObject(
        objects[currentObject]
      );

      objectImg.classList.remove(
        "is-leaving"
      );

      objectImg.classList.add(
        "is-entering"
      );

      setTimeout(() => {
        objectImg.classList.remove(
          "is-entering"
        );

        objectStage.classList.remove(
          "is-switching"
        );

        switching = false;
      }, 600);

    }, 230);
  }

  objectStage.addEventListener( "pointermove", updateHover );
  objectStage.addEventListener( "pointerleave", () => { if (!dragging) {resetLook();} } );
  objectLook.addEventListener( "pointerdown", startDrag );
  objectLook.addEventListener( "pointermove", dragObject );
  objectLook.addEventListener( "pointerup", endDrag );
  objectLook.addEventListener( "pointercancel", endDrag );
  objectSwitcher.addEventListener( "click", () => { cycleObject(); } );
  applyObject( objects[currentObject] );
  render();

}

/* --- SKILLS ORBIT --- */
document.addEventListener("DOMContentLoaded", () => {
  const orbitCard =
    document.getElementById("skillsOrbitCard");

  const orbitStage =
    document.getElementById("skillsOrbitStage");

  const orbitMe =
    document.getElementById("orbitMe");

  const orbitHint =
    document.getElementById("skillsOrbitHint");

  const objectHint =
    document.querySelector(".object-hint");

  const mobileHintQuery =
    window.matchMedia("(max-width: 520px)");

  if (
    !orbitCard ||
    !orbitStage ||
    !orbitMe ||
    !window.Matter
  ) {
    return;
  }

  const skills = [
    ...orbitStage.querySelectorAll(
      ".orbit-skill"
    )
  ];

  if (!skills.length) {
    return;
  }

  const {
    Engine,
    Runner,
    Bodies,
    Body,
    Composite
  } = Matter;


  const skillConfigs = {
    "Product Design": {
      ring: "inner",
      angle: 0
    },

    "Systems": {
      ring: "inner",
      angle: Math.PI / 2
    },

    "Design System": {
      ring: "inner",
      angle: Math.PI / 2
    },

    "UX Research": {
      ring: "inner",
      angle: Math.PI
    },

    "Front-end": {
      ring: "inner",
      angle: Math.PI * 1.5
    },

    "Visual Craft": {
      ring: "outer",
      angle: Math.PI * 0.2
    },

    "Visual Design": {
      ring: "outer",
      angle: Math.PI * 0.2
    },

    "Prototyping": {
      ring: "outer",
      angle: Math.PI * 0.7
    },

    "Interaction Design": {
      ring: "outer",
      angle: Math.PI * 1.2
    },

    "Accessibility": {
      ring: "outer",
      angle: Math.PI * 1.7
    }
  };


  const mobileSkillConfigs = {
    "Interaction Design": {
      ring: "outer",
      angle: Math.PI
    },

    "Accessibility": {
      ring: "outer",
      angle: Math.PI * 1.45
    },

    "Product Design": {
      ring: "outer",
      angle: Math.PI * 0.12
    },

    "Prototyping": {
      ring: "outer",
      angle: Math.PI * 0.55
    },

    "UX Research": {
      ring: "inner",
      angle: Math.PI * 1.08
    },

    "Front-end": {
      ring: "inner",
      angle: Math.PI * 1.65
    },

    "Systems": {
      ring: "inner",
      angle: Math.PI * 0.58
    },

    "Design System": {
      ring: "inner",
      angle: Math.PI * 0.58
    },

    "Visual Craft": {
      ring: "inner",
      angle: Math.PI * 0.02
    },

    "Visual Design": {
      ring: "inner",
      angle: Math.PI * 0.02
    }
  };


  let mode = "orbit";

  let animationFrame = null;

  let engine = null;
  let runner = null;

  let skillBodies = [];
  let meBody = null;
  let walls = [];

  let draggedBody = null;
  let draggedElement = null;

  let lastPointerX = 0;
  let lastPointerY = 0;

  let throwVelocityX = 0;
  let throwVelocityY = 0;

  let meDragStartX = 0;
  let meDragStartY = 0;
  let meWasDragged = false;


  function setOrbitHint(text) {
    if (!orbitHint) {
      return;
    }

    orbitHint.textContent =
      text;
  }


  function getOrbitIdleHint() {
    return mobileHintQuery.matches
      ? "Tap me to play"
      : "Click me to play";
  }


  function getGravityHint() {
    return mobileHintQuery.matches
      ? "Drag + throw · Tap me to reset"
      : "Drag + throw · Click me to reset";
  }


  function getObjectHint() {
    return mobileHintQuery.matches
      ? "Tap or drag to play"
      : "Click or drag to play";
  }


  function updateHintCopy() {
    if (mode === "gravity") {
      setOrbitHint(
        getGravityHint()
      );
    } else {
      setOrbitHint(
        getOrbitIdleHint()
      );
    }

    if (objectHint) {
      objectHint.textContent =
        getObjectHint();
    }
  }


  function getSkillName(skill) {
    return skill.textContent.trim();
  }


  function getOrbitSize() {
    const width =
      orbitStage.clientWidth;

    const height =
      orbitStage.clientHeight;

    const isMobile =
      width <= 520;

    const maxSkillWidth =
      Math.max(
        ...skills.map(
          (skill) =>
            skill.offsetWidth
        )
      );


    if (isMobile) {
      return {
        width,
        height,

        centerX:
          width / 2,

        centerY:
          height / 2,

        innerX:
          width * 0.27,

        innerY:
          height * 0.24,

        outerX:
          width * 0.41,

        outerY:
          height * 0.37,

        isMobile: true
      };
    }


    const horizontalSafety =
      maxSkillWidth / 2 + 28;

    const verticalSafety = 34;


    const maxRadiusX =
      Math.max(
        80,
        width / 2 -
          horizontalSafety
      );


    const maxRadiusY =
      Math.max(
        60,
        height / 2 -
          verticalSafety
      );


    return {
      width,
      height,

      centerX:
        width / 2,

      centerY:
        height / 2,

      innerX:
        Math.min(
          width * 0.24,
          maxRadiusX * 0.68
        ),

      innerY:
        Math.min(
          height * 0.21,
          maxRadiusY * 0.64
        ),

      outerX:
        Math.min(
          width * 0.40,
          maxRadiusX
        ),

      outerY:
        Math.min(
          height * 0.38,
          maxRadiusY
        ),

      isMobile: false
    };
  }


  function getOrbitTarget(
    skill,
    index,
    time
  ) {
    const orbit =
      getOrbitSize();

    const name =
      getSkillName(skill);

    const configs =
      orbit.isMobile
        ? mobileSkillConfigs
        : skillConfigs;

    const config =
      configs[name] || {
        ring:
          index < 4
            ? "inner"
            : "outer",

        angle:
          (
            Math.PI *
            2 *
            index
          ) /
          skills.length
      };


    const isOuter =
      config.ring === "outer";


    const radiusX =
      isOuter
        ? orbit.outerX
        : orbit.innerX;


    const radiusY =
      isOuter
        ? orbit.outerY
        : orbit.innerY;


    const speed =
      orbit.isMobile
        ? (
            isOuter
              ? -0.000035
              : 0.000045
          )
        : (
            isOuter
              ? -0.00007
              : 0.00010
          );


    const angle =
      config.angle +
      time * speed;


    let x =
      orbit.centerX +
      Math.cos(angle) *
      radiusX;


    let y =
      orbit.centerY +
      Math.sin(angle) *
      radiusY;


    if (orbit.isMobile) {
      const halfWidth =
        skill.offsetWidth / 2;

      const halfHeight =
        skill.offsetHeight / 2;

      const safety = 12;


      x =
        Math.max(
          halfWidth + safety,
          Math.min(
            orbit.width -
              halfWidth -
              safety,
            x
          )
        );


      y =
        Math.max(
          halfHeight + safety,
          Math.min(
            orbit.height -
              halfHeight -
              safety,
            y
          )
        );
    }


    const rotation =
      orbit.isMobile
        ? Math.sin(
            angle * 1.3
          ) * 0.35
        : Math.sin(
            angle * 1.3
          ) * 0.7;


    return {
      x,
      y,
      rotation
    };
  }


  function positionMe() {
    const orbit =
      getOrbitSize();

    orbitMe.style.left = "0";
    orbitMe.style.top = "0";

    orbitMe.style.transform =
      `
        translate3d(
          ${orbit.centerX}px,
          ${orbit.centerY}px,
          0
        )
        translate(
          -50%,
          -50%
        )
      `;
  }


  function positionSkills(time) {
    skills.forEach(
      (skill, index) => {
        const target =
          getOrbitTarget(
            skill,
            index,
            time
          );

        skill.style.transform =
          `
            translate3d(
              ${target.x}px,
              ${target.y}px,
              0
            )
            translate(
              -50%,
              -50%
            )
            rotate(
              ${target.rotation}deg
            )
          `;
      }
    );
  }


  function animateOrbit(time) {
    if (mode !== "orbit") {
      return;
    }

    positionMe();
    positionSkills(time);

    animationFrame =
      requestAnimationFrame(
        animateOrbit
      );
  }


  function createWalls() {
    const width =
      orbitStage.clientWidth;

    const height =
      orbitStage.clientHeight;

    const thickness = 160;


    walls = [
      Bodies.rectangle(
        width / 2,
        -thickness / 2,
        width + thickness * 2,
        thickness,
        {
          isStatic: true
        }
      ),

      Bodies.rectangle(
        width / 2,
        height + thickness / 2,
        width + thickness * 2,
        thickness,
        {
          isStatic: true
        }
      ),

      Bodies.rectangle(
        -thickness / 2,
        height / 2,
        thickness,
        height + thickness * 2,
        {
          isStatic: true
        }
      ),

      Bodies.rectangle(
        width + thickness / 2,
        height / 2,
        thickness,
        height + thickness * 2,
        {
          isStatic: true
        }
      )
    ];


    Composite.add(
      engine.world,
      walls
    );
  }


  function createPhysicsBodies() {
    const stageRect =
      orbitStage.getBoundingClientRect();


    skillBodies =
      skills.map((skill) => {
        const rect =
          skill.getBoundingClientRect();

        const width =
          skill.offsetWidth;

        const height =
          skill.offsetHeight;


        const x =
          rect.left -
          stageRect.left +
          rect.width / 2;


        const y =
          rect.top -
          stageRect.top +
          rect.height / 2;


        const body =
          Bodies.rectangle(
            x,
            y,
            width,
            height,
            {
              restitution: 0.55,

              friction: 0.12,

              frictionStatic: 0.18,

              frictionAir: 0.012,

              density: 0.0015,

              chamfer: {
                radius:
                  height / 2
              }
            }
          );


        body.element =
          skill;

        return body;
      });


    const meRect =
      orbitMe.getBoundingClientRect();


    const meX =
      meRect.left -
      stageRect.left +
      meRect.width / 2;


    const meY =
      meRect.top -
      stageRect.top +
      meRect.height / 2;


    const meRadius =
      Math.min(
        orbitMe.offsetWidth,
        orbitMe.offsetHeight
      ) / 2;


    meBody =
      Bodies.circle(
        meX,
        meY,
        meRadius,
        {
          restitution: 0.6,

          friction: 0.1,

          frictionStatic: 0.16,

          frictionAir: 0.01,

          density: 0.0017
        }
      );


    meBody.element =
      orbitMe;


    Composite.add(
      engine.world,
      [
        ...skillBodies,
        meBody
      ]
    );
  }


  function startGravity() {
    if (mode !== "orbit") {
      return;
    }


    mode = "gravity";


    cancelAnimationFrame(
      animationFrame
    );


    orbitCard.classList.add(
      "is-gravity-on"
    );


    setOrbitHint(
      getGravityHint()
    );


    engine =
      Engine.create();


    engine.gravity.x = 0;
    engine.gravity.y = 1;


    runner =
      Runner.create();


    createWalls();
    createPhysicsBodies();


    skillBodies.forEach(
      (body) => {
        Body.setVelocity(
          body,
          {
            x:
              (
                Math.random() -
                0.5
              ) *
              1.5,

            y:
              -1 -
              Math.random() *
              1.5
          }
        );


        Body.setAngularVelocity(
          body,
          (
            Math.random() -
            0.5
          ) *
          0.025
        );
      }
    );


    Body.setVelocity(
      meBody,
      {
        x: 0,
        y: -1
      }
    );


    Body.setAngularVelocity(
      meBody,
      (
        Math.random() -
        0.5
      ) *
      0.015
    );


    Runner.run(
      runner,
      engine
    );


    requestAnimationFrame(
      syncPhysics
    );
  }


  function syncPhysics() {
    if (mode !== "gravity") {
      return;
    }


    skillBodies.forEach(
      (body) => {
        const skill =
          body.element;


        const width =
          skill.offsetWidth;

        const height =
          skill.offsetHeight;


        skill.style.transform =
          `
            translate3d(
              ${
                body.position.x -
                width / 2
              }px,
              ${
                body.position.y -
                height / 2
              }px,
              0
            )
            rotate(
              ${body.angle}rad
            )
          `;
      }
    );


    if (meBody) {
      const width =
        orbitMe.offsetWidth;

      const height =
        orbitMe.offsetHeight;


      orbitMe.style.transform =
        `
          translate3d(
            ${
              meBody.position.x -
                width / 2
            }px,
            ${
              meBody.position.y -
                height / 2
            }px,
            0
          )
          rotate(
            ${meBody.angle}rad
          )
        `;
    }


    requestAnimationFrame(
      syncPhysics
    );
  }


  function getBodyFromElement(
    element
  ) {
    if (element === orbitMe) {
      return meBody;
    }


    const index =
      skills.indexOf(
        element
      );


    if (index === -1) {
      return null;
    }


    return skillBodies[index];
  }


  function getStagePointer(event) {
    const rect =
      orbitStage.getBoundingClientRect();


    return {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top
    };
  }


  function startDrag(
    event,
    element
  ) {
    if (mode !== "gravity") {
      return;
    }


    const body =
      getBodyFromElement(
        element
      );


    if (!body) {
      return;
    }


    event.preventDefault();


    draggedBody =
      body;

    draggedElement =
      element;


    if (element === orbitMe) {
      meDragStartX =
        event.clientX;

      meDragStartY =
        event.clientY;

      meWasDragged = false;
    }


    const pointer =
      getStagePointer(
        event
      );


    const halfWidth =
      draggedElement.offsetWidth / 2;


    const halfHeight =
      draggedElement.offsetHeight / 2;


    const stageWidth =
      orbitStage.clientWidth;


    const stageHeight =
      orbitStage.clientHeight;


    const x =
      Math.max(
        halfWidth,
        Math.min(
          stageWidth -
            halfWidth,
          pointer.x
        )
      );


    const y =
      Math.max(
        halfHeight,
        Math.min(
          stageHeight -
            halfHeight,
          pointer.y
        )
      );


    lastPointerX = x;
    lastPointerY = y;


    throwVelocityX = 0;
    throwVelocityY = 0;


    Body.setVelocity(
      draggedBody,
      {
        x: 0,
        y: 0
      }
    );


    Body.setAngularVelocity(
      draggedBody,
      0
    );


    Body.setStatic(
      draggedBody,
      true
    );


    Body.setPosition(
      draggedBody,
      {
        x,
        y
      }
    );


    draggedElement.classList.add(
      "is-dragging"
    );


    orbitCard.classList.add(
      "is-dragging"
    );
  }


  function moveDrag(event) {
    if (
      mode !== "gravity" ||
      !draggedBody ||
      !draggedElement
    ) {
      return;
    }


    if (
      draggedElement === orbitMe
    ) {
      const distance =
        Math.hypot(
          event.clientX -
            meDragStartX,

          event.clientY -
            meDragStartY
        );


      if (distance > 6) {
        meWasDragged = true;
      }
    }


    const pointer =
      getStagePointer(
        event
      );


    const stageWidth =
      orbitStage.clientWidth;


    const stageHeight =
      orbitStage.clientHeight;


    const halfWidth =
      draggedElement.offsetWidth / 2;


    const halfHeight =
      draggedElement.offsetHeight / 2;


    const x =
      Math.max(
        halfWidth,
        Math.min(
          stageWidth -
            halfWidth,
          pointer.x
        )
      );


    const y =
      Math.max(
        halfHeight,
        Math.min(
          stageHeight -
            halfHeight,
          pointer.y
        )
      );


    throwVelocityX =
      x - lastPointerX;


    throwVelocityY =
      y - lastPointerY;


    lastPointerX = x;
    lastPointerY = y;


    Body.setPosition(
      draggedBody,
      {
        x,
        y
      }
    );
  }


  function endDrag() {
    if (!draggedBody) {
      return;
    }


    Body.setStatic(
      draggedBody,
      false
    );


    const maxThrow = 14;


    const velocityX =
      Math.max(
        -maxThrow,
        Math.min(
          maxThrow,
          throwVelocityX * 0.52
        )
      );


    const velocityY =
      Math.max(
        -maxThrow,
        Math.min(
          maxThrow,
          throwVelocityY * 0.52
        )
      );


    Body.setVelocity(
      draggedBody,
      {
        x: velocityX,
        y: velocityY
      }
    );


    Body.setAngularVelocity(
      draggedBody,
      Math.max(
        -0.07,
        Math.min(
          0.07,
          velocityX * 0.004
        )
      )
    );


    if (draggedElement) {
      draggedElement.classList.remove(
        "is-dragging"
      );
    }


    orbitCard.classList.remove(
      "is-dragging"
    );


    draggedBody = null;
    draggedElement = null;


    throwVelocityX = 0;
    throwVelocityY = 0;
  }


  function resetOrbit() {
    if (
      mode !== "gravity" ||
      !engine
    ) {
      return;
    }


    mode = "resetting";


    if (runner) {
      Runner.stop(runner);
    }


    orbitCard.classList.remove(
      "is-gravity-on",
      "is-dragging"
    );


    setOrbitHint(
      getOrbitIdleHint()
    );


    const startTime =
      performance.now();


    const duration = 900;


    const orbit =
      getOrbitSize();


    const meStart = {
      x:
        meBody.position.x,

      y:
        meBody.position.y,

      rotation:
        meBody.angle
    };


    const meTarget = {
      x:
        orbit.centerX,

      y:
        orbit.centerY
    };


    const skillStarts =
      skillBodies.map(
        (body) => ({
          x:
            body.position.x,

          y:
            body.position.y,

          rotation:
            body.angle
        })
      );


    const targetTime =
      startTime +
      duration;


    const skillTargets =
      skills.map(
        (skill, index) =>
          getOrbitTarget(
            skill,
            index,
            targetTime
          )
      );


    function easeOutCubic(value) {
      return (
        1 -
        Math.pow(
          1 - value,
          3
        )
      );
    }


    function animateReset(time) {
      const progress =
        Math.min(
          1,
          (
            time -
            startTime
          ) /
          duration
        );


      const eased =
        easeOutCubic(
          progress
        );


      const meX =
        meStart.x +
        (
          meTarget.x -
          meStart.x
        ) *
        eased;


      const meY =
        meStart.y +
        (
          meTarget.y -
          meStart.y
        ) *
        eased;


      const meRotation =
        meStart.rotation *
        (
          1 -
          eased
        );


      orbitMe.style.transform =
        `
          translate3d(
            ${meX}px,
            ${meY}px,
            0
          )
          translate(
            -50%,
            -50%
          )
          rotate(
            ${meRotation}rad
          )
        `;


      skills.forEach(
        (skill, index) => {
          const start =
            skillStarts[index];


          const target =
            skillTargets[index];


          const x =
            start.x +
            (
              target.x -
              start.x
            ) *
            eased;


          const y =
            start.y +
            (
              target.y -
              start.y
            ) *
            eased;


          const startDegrees =
            start.rotation *
            (
              180 /
              Math.PI
            );


          const rotation =
            startDegrees +
            (
              target.rotation -
              startDegrees
            ) *
            eased;


          skill.style.transform =
            `
              translate3d(
                ${x}px,
                ${y}px,
                0
              )
              translate(
                -50%,
                -50%
              )
              rotate(
                ${rotation}deg
              )
            `;
        }
      );


      if (progress < 1) {
        requestAnimationFrame(
          animateReset
        );

        return;
      }


      Composite.clear(
        engine.world,
        false
      );


      Engine.clear(
        engine
      );


      engine = null;
      runner = null;

      walls = [];
      skillBodies = [];
      meBody = null;


      mode = "orbit";


      positionMe();


      positionSkills(
        performance.now()
      );


      animationFrame =
        requestAnimationFrame(
          animateOrbit
        );
    }


    requestAnimationFrame(
      animateReset
    );
  }


  orbitMe.addEventListener(
    "click",
    () => {
      if (mode === "orbit") {
        startGravity();
        return;
      }


      if (
        mode === "gravity" &&
        !meWasDragged
      ) {
        resetOrbit();
      }


      meWasDragged = false;
    }
  );


  orbitMe.addEventListener(
    "pointerdown",
    (event) => {
      startDrag(
        event,
        orbitMe
      );
    }
  );


  skills.forEach(
    (skill) => {
      skill.addEventListener(
        "pointerdown",
        (event) => {
          startDrag(
            event,
            skill
          );
        }
      );
    }
  );


  window.addEventListener(
    "pointermove",
    moveDrag
  );


  window.addEventListener(
    "pointerup",
    endDrag
  );


  window.addEventListener(
    "pointercancel",
    endDrag
  );


  const resizeObserver =
    new ResizeObserver(() => {
      if (mode === "orbit") {
        positionMe();

        positionSkills(
          performance.now()
        );
      }
    });


  resizeObserver.observe(
    orbitStage
  );


  mobileHintQuery.addEventListener(
    "change",
    updateHintCopy
  );


  document.fonts.ready.then(
    () => {
      updateHintCopy();

      positionMe();

      positionSkills(
        performance.now()
      );


      animationFrame =
        requestAnimationFrame(
          animateOrbit
        );
    }
  );
});

const contactBar = document.querySelector("#contactBar");
const contactFront = document.querySelector("#contactFront");

let currentReveal = 0;
let targetReveal = 0;
let isPinned = false;
const revealSpeed = 0.085;
/*
  Lower = slower / softer
  Higher = faster
  0.065 feels smooth without
  being noticeably sluggish.
*/

function animateContact() {
  const difference =
    targetReveal - currentReveal;

  currentReveal +=
    difference * revealSpeed;

  if (Math.abs(difference) < 0.001) {
    currentReveal = targetReveal;
  }


  contactBar.style.setProperty(
    "--reveal",
    currentReveal.toFixed(4)
  );


  requestAnimationFrame(
    animateContact
  );
}
contactBar.addEventListener(
  "pointerenter",
  (event) => {

    if (event.pointerType === "touch") {
      return;
    }

    if (isPinned) {
      return;
    }

    targetReveal = 1;

    contactBar.classList.add(
      "is-open"
    );
  }
);

contactBar.addEventListener(
  "pointerleave",
  (event) => {
    if (event.pointerType === "touch") {
      return;
    }

    if (isPinned) {
      return;
    }

    targetReveal = 0;

    contactBar.classList.remove(
      "is-open"
    );
  }
);

contactFront.addEventListener(
  "click",
  () => {
    isPinned = !isPinned;

    contactFront.setAttribute(
      "aria-expanded",
      String(isPinned)
    );


    if (isPinned) {
      targetReveal = 1;

      contactBar.classList.add(
        "is-open"
      );
    } else {
      targetReveal = 0;

      contactBar.classList.remove(
        "is-open"
      );
    }
  }
);
animateContact();
