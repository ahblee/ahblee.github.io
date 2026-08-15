window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-opening-ready");
  });
});

const aboutPortrait = document.getElementById("aboutPortrait");

if (aboutPortrait) {
  aboutPortrait.addEventListener("click", () => {
    aboutPortrait.classList.toggle("is-swapped");
  });
}

const statusText = document.getElementById("statusText");
const currentStatus = document.getElementById("currentStatus");

const statuses = [
  "I spend hours on healthy addictions like puzzles and games.",
  "I can spend hours making sense of a mess.",
  "I stress over details. Like, a lot.",
  "I go all in, sometimes to the point of dreaming about it.",
  "I stay up way too late to finish what I started.",
  "I believe every learning experience counts.",
  "I built this portfolio with AI help and way too much coffee.",
  "I think in systems and design like a developer."
];

let lastStatus = "";
let statusTimer = null;

function getRandomStatus() {
  if (statuses.length === 1) return statuses[0];

  let nextStatus = lastStatus;
  let attempts = 0;

  while (nextStatus === lastStatus && attempts < 12) {
    nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
    attempts += 1;
  }

  lastStatus = nextStatus;
  return nextStatus;
}

function setStatus() {
  if (!statusText) return;

  statusText.classList.add("is-changing");

  window.setTimeout(() => {
    statusText.textContent = getRandomStatus();
    statusText.classList.remove("is-changing");
  }, 180);
}

function restartStatusTimer() {
  if (statusTimer) {
    window.clearInterval(statusTimer);
  }

  statusTimer = window.setInterval(setStatus, 5200);
}

if (statusText && currentStatus) {
  statusText.textContent = getRandomStatus();
  restartStatusTimer();

  currentStatus.addEventListener("click", () => {
    setStatus();
    restartStatusTimer();
  });

  currentStatus.addEventListener("pointerenter", () => {
    if (statusTimer) window.clearInterval(statusTimer);
  });

  currentStatus.addEventListener("pointerleave", restartStatusTimer);
}

const marqueeTrack = document.getElementById("photoMarqueeTrack");

if (marqueeTrack) {
  const marqueePhotos = [
    ["side1.png", "Summer in Seoul"],
    ["side2.png", "BTS of mirror install"],
    ["side3.png", "Golden hour in Van"],
    ["side4.png", "KOSTA merch install"],
    ["side5.png", "One of my hand-drawn menus"],
    ["side6.png", "My first ever ceramic dish"],
    ["side7.png", "Craft day"],
    ["side8.png", "My barista era"],
    ["side9.png", "Summer in Van"],
    ["side10.png", "She wore it better"],
    ["side11.png", "Just the perfect set up"],
    ["side12.png", "1-Day bouquet duty"],
    ["side13.png", "When your friend needs a poster"],
    ["side14.png", "Just me and my installation"]
  ];

  [...marqueePhotos, ...marqueePhotos].forEach(([fileName, caption]) => {
    const tile = document.createElement("div");
    tile.className = "photo-tile";

    const img = document.createElement("img");
    img.src = `assets/img/about/${fileName}`;
    img.alt = caption;
    img.loading = "lazy";

    const label = document.createElement("span");
    label.className = "photo-caption";
    label.textContent = caption;

    tile.append(img, label);
    marqueeTrack.appendChild(tile);
  });
}

const photoBoard = document.getElementById("photoBoard");
const tidyBtn = document.getElementById("tidyBtn");

if (photoBoard && tidyBtn) {
  const boardPhotos = [
    ["photo9.png", "", 270],
    ["photo7.png", "", 260],
    ["photo2.png", "", 300],
    ["photo22.png", "", 300],
    ["photo12.png", "", 260],
    ["photo11.png", "", 260],
    ["photo1.png", "", 270],
    ["photo14.png", "", 270],
    ["photo21.png", "", 280],
    ["photo16.png", "", 290],
    ["photo3.png", "is-square", 260],
    ["photo4.png", "is-square", 150],
    ["photo13.png", "is-square", 280],
    ["photo5.png", "is-square", 250],
    ["photo10.png", "is-square", 200],
    ["photo17.png", "is-tall", 220],
    ["photo25.png", "is-tall", 220],
    ["photo20.png", "is-tall", 190],
    ["photo6.png", "is-tall", 220],
    ["photo18.png", "is-tall", 210],
    ["photo23.png", "is-tall", 220],
    ["photo8.png", "is-tall", 250],
    ["photo24.png", "is-tall", 230],
    ["photo15.png", "is-tall", 220]
  ];

  const rotations = [-7, 4, -3, 6, -5, 3, -6, 2, -4, 5, -6, 3];
  const stage = document.createElement("div");
  stage.className = "photo-stage";
  photoBoard.appendChild(stage);

  const isMobile = () => window.innerWidth <= 768;
  const boardWidth = () => photoBoard.clientWidth;
  const boardHeight = () => photoBoard.clientHeight;

  let zIndex = 1;
  let isTidy = false;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;

  function overlaps(a, b, padding = 22) {
    return !(
      a.x + a.w + padding < b.x ||
      b.x + b.w + padding < a.x ||
      a.y + a.h + padding < b.y ||
      b.y + b.h + padding < a.y
    );
  }

  function findPosition(width, height, placed, spreadWidth, spreadHeight) {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const x = 24 + Math.random() * Math.max(spreadWidth - width - 48, 1);
      const y = 18 + Math.random() * Math.max(spreadHeight - height - 36, 1);
      const next = { x, y, w: width, h: height };

      if (!placed.some((item) => overlaps(next, item))) {
        return { x, y };
      }
    }

    return {
      x: 24 + Math.random() * Math.max(spreadWidth - width - 48, 1),
      y: 18 + Math.random() * Math.max(spreadHeight - height - 36, 1)
    };
  }

  function makeDraggable(card) {
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;

    card.addEventListener("pointerdown", (event) => {
      if (isTidy) return;

      event.stopPropagation();
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = parseFloat(card.style.left);
      startTop = parseFloat(card.style.top);
      card.style.zIndex = String(++zIndex);
      card.classList.add("is-dragging");
      card.setPointerCapture(event.pointerId);
    });

    card.addEventListener("pointermove", (event) => {
      if (!dragging) return;

      card.style.left = `${startLeft + event.clientX - startX}px`;
      card.style.top = `${startTop + event.clientY - startY}px`;
    });

    function stopDragging() {
      dragging = false;
      card.classList.remove("is-dragging");
    }

    card.addEventListener("pointerup", stopDragging);
    card.addEventListener("pointercancel", stopDragging);
  }

  function buildCards() {
    const placed = [];
    const spreadWidth = boardWidth() * (isMobile() ? 0.9 : 1);
    const spreadHeight = boardHeight() * (isMobile() ? 2.1 : 1.65);
    const maxCardWidth = isMobile()
      ? Math.min(boardWidth() * 0.55, 180)
      : Math.min(boardWidth() * 0.3, 270);

    return boardPhotos.map(([fileName, ratioClass, baseWidth], index) => {
      const card = document.createElement("div");
      const img = document.createElement("img");
      const scaledWidth = Math.round(baseWidth * (boardWidth() / 900));
      const width = Math.max(132, Math.min(scaledWidth, maxCardWidth));
      const estimatedHeight = ratioClass === "is-tall"
        ? width * 1.34
        : ratioClass === "is-square"
          ? width
          : width * 0.76;
      const position = findPosition(width, estimatedHeight, placed, spreadWidth, spreadHeight);

      card.className = "photo-card";
      card.style.width = `${width}px`;
      card.style.left = `${position.x}px`;
      card.style.top = `${position.y}px`;
      card.style.zIndex = String(index + 1);
      card.style.transform = `rotate(${rotations[index % rotations.length]}deg)`;

      img.src = `assets/img/about/${fileName}`;
      img.alt = "";
      img.draggable = false;
      if (ratioClass) img.classList.add(ratioClass);

      placed.push({ x: position.x, y: position.y, w: width, h: estimatedHeight });
      card.appendChild(img);
      stage.appendChild(card);
      makeDraggable(card);
      return card;
    });
  }

  const cardEls = buildCards();
  const messyPositions = cardEls.map((card) => ({
    left: card.style.left,
    top: card.style.top,
    width: card.style.width,
    transform: card.style.transform
  }));

  photoBoard.addEventListener("pointerdown", (event) => {
    if (event.target !== photoBoard && event.target !== stage) return;
    if (isMobile() || isTidy) return;

    isPanning = true;
    panStartX = event.clientX - panX;
    panStartY = event.clientY - panY;
    photoBoard.setPointerCapture(event.pointerId);
  });

  photoBoard.addEventListener("pointermove", (event) => {
    if (!isPanning) return;

    panX = event.clientX - panStartX;
    panY = event.clientY - panStartY;
    stage.style.transform = `translate(${panX}px, ${panY}px)`;
  });

  photoBoard.addEventListener("pointerup", () => {
    isPanning = false;
  });

  function tidyGrid() {
    const mobile = isMobile();
    const columns = mobile ? 3 : 5;
    const gap = mobile ? 8 : 16;
    const padding = mobile ? 10 : 24;
    const columnWidth = Math.floor((boardWidth() - padding * 2 - gap * (columns - 1)) / columns);
    const rowHeights = [];

    stage.style.transform = "translate(0, 0)";
    panX = 0;
    panY = 0;

    cardEls.forEach((card, index) => {
      const row = Math.floor(index / columns);
      card.classList.add("is-tidying");
      card.style.width = `${columnWidth}px`;
      card.style.transform = "rotate(0deg)";
      rowHeights[row] = Math.max(rowHeights[row] || 0, card.offsetHeight);
    });

    const rowTops = [];
    let currentTop = padding;

    rowHeights.forEach((height, index) => {
      rowTops[index] = currentTop;
      currentTop += height + gap;
    });

    cardEls.forEach((card, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      card.style.left = `${padding + column * (columnWidth + gap)}px`;
      card.style.top = `${rowTops[row]}px`;
      card.style.zIndex = String(index + 1);

      window.setTimeout(() => card.classList.remove("is-tidying"), 620);
    });

    stage.style.height = `${currentTop + padding}px`;
  }

  function messify() {
    stage.style.height = "";

    cardEls.forEach((card, index) => {
      const original = messyPositions[index];

      card.classList.add("is-tidying");
      card.style.left = original.left;
      card.style.top = original.top;
      card.style.width = original.width;
      card.style.transform = original.transform;

      window.setTimeout(() => card.classList.remove("is-tidying"), 620);
    });
  }

  tidyBtn.addEventListener("click", () => {
    isTidy = !isTidy;
    photoBoard.classList.toggle("is-tidy", isTidy);
    tidyBtn.textContent = isTidy ? "Make It Messy Again" : "Let Angela Clean It";

    if (isTidy) {
      tidyGrid();
    } else {
      messify();
    }
  });
}
