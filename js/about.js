/* =========================================
   ABOUT MEDIA GALLERY
   pile + flip + swipe + viewer + grid
========================================= */

const gallery =
  document.getElementById("aboutGallery");


const gridButton =
  document.getElementById("aboutGridButton");

const viewerButton =
  document.getElementById("aboutFullscreenButton");

const mediaCards =
  Array.from(
    document.querySelectorAll(".about-media-card")
  );



/* =========================================
   STATE
========================================= */

let stackOrder = [...mediaCards];

let activeViewerIndex = 0;

let dragCard = null;

let startX = 0;
let startY = 0;

let dragX = 0;
let dragY = 0;

let hasDragged = false;

const SWIPE_THRESHOLD = 80;



/* =========================================
   UPDATE STACK
========================================= */

function updatePile() {

  stackOrder.forEach((card, index) => {

    card.dataset.stackPosition =
      String(index);

    card.style.removeProperty("--drag-x");
    card.style.removeProperty("--drag-y");
    card.style.removeProperty("--drag-r");

    card.classList.remove(
      "is-dragging",
      "is-swiping"
    );

  });

}


updatePile();



/* =========================================
   FLIP
========================================= */

function flipCard(card) {

  card.classList.toggle(
    "is-flipped"
  );

}



/* =========================================
   VIEWER ACTIVE CARD
========================================= */

function setActiveViewerCard(index) {

  if (!mediaCards.length) return;


  activeViewerIndex =
    (
      index +
      mediaCards.length
    ) %
    mediaCards.length;


  mediaCards.forEach(
    (card, cardIndex) => {

      const active =
        cardIndex ===
        activeViewerIndex;


      card.classList.toggle(
        "is-active",
        active
      );


      /*
        Viewer always shows
        the photo/video front.
      */

      card.classList.remove(
        "is-flipped"
      );

    }
  );

}



/* =========================================
   RESET DRAG STYLES
========================================= */

function resetCardDrag(card) {

  card.classList.remove(
    "is-dragging",
    "is-swiping"
  );

  card.style.removeProperty(
    "--drag-x"
  );

  card.style.removeProperty(
    "--drag-y"
  );

  card.style.removeProperty(
    "--drag-r"
  );

}



/* =========================================
   START DRAG
========================================= */

function startDrag(event, card) {

  /*
    No dragging while in
    viewer or grid mode.
  */

  if (
    gallery.classList.contains(
      "is-viewer"
    ) ||
    gallery.classList.contains(
      "is-expanded"
    )
  ) {
    return;
  }


  /*
    Only the top card
    can be dragged.
  */

  if (
    card.dataset.stackPosition
    !== "0"
  ) {
    return;
  }


  if (
    event.button !== undefined &&
    event.button !== 0
  ) {
    return;
  }


  dragCard = card;

  startX = event.clientX;
  startY = event.clientY;

  dragX = 0;
  dragY = 0;

  hasDragged = false;


  card.classList.add(
    "is-dragging"
  );


  if (
    card.setPointerCapture
  ) {

    try {

      card.setPointerCapture(
        event.pointerId
      );

    } catch (_) {}

  }

}



/* =========================================
   MOVE DRAG
========================================= */

function moveDrag(event) {

  if (!dragCard) return;


  dragX =
    event.clientX -
    startX;

  dragY =
    event.clientY -
    startY;


  if (
    Math.abs(dragX) > 5 ||
    Math.abs(dragY) > 5
  ) {

    hasDragged = true;

  }


  dragCard.style.setProperty(
    "--drag-x",
    `${dragX}px`
  );


  /*
    Only move vertically a little
    so it still feels like a
    horizontal photo shuffle.
  */

  dragCard.style.setProperty(
    "--drag-y",
    `${dragY * 0.18}px`
  );


  dragCard.style.setProperty(
    "--drag-r",
    `${dragX * 0.035}deg`
  );

}



/* =========================================
   FINISH DRAG
========================================= */

function finishDrag() {

  if (!dragCard) return;


  const card =
    dragCard;


  const shouldSwipe =
    Math.abs(dragX) >=
    SWIPE_THRESHOLD;


  card.classList.remove(
    "is-dragging"
  );



  /* -----------------------------------------
     SUCCESSFUL SWIPE
  ----------------------------------------- */

  if (shouldSwipe) {

    const direction =
      dragX >= 0
        ? 1
        : -1;


    card.classList.add(
      "is-swiping"
    );


    card.style.setProperty(
      "--drag-x",
      `${direction * 430}px`
    );


    card.style.setProperty(
      "--drag-y",
      `${dragY * .25}px`
    );


    card.style.setProperty(
      "--drag-r",
      `${direction * 14}deg`
    );


    window.setTimeout(
      () => {

        /*
          Put top card at
          back of stack.
        */

        stackOrder.shift();

        stackOrder.push(card);


        /*
          Reset flipped state
          before it returns.
        */

        card.classList.remove(
          "is-flipped"
        );


        updatePile();

      },
      260
    );

  }



  /* -----------------------------------------
     CLICK / SMALL MOVEMENT
  ----------------------------------------- */

  else {

    resetCardDrag(card);


    /*
      If the user didn't really
      drag, treat it as click
      and flip the card.
    */

    if (!hasDragged) {

      flipCard(card);

    }

  }


  dragCard = null;

}



/* =========================================
   POINTER EVENTS
========================================= */

mediaCards.forEach(
  (card) => {

    card.addEventListener(
      "pointerdown",
      (event) => {

        startDrag(
          event,
          card
        );

      }
    );


    card.addEventListener(
      "pointermove",
      moveDrag
    );


    card.addEventListener(
      "pointerup",
      finishDrag
    );


    card.addEventListener(
      "pointercancel",
      finishDrag
    );

  }
);



/* =========================================
   VIEWER BUTTON
   ⛶
========================================= */

if (
  gallery &&
  viewerButton
) {

  viewerButton.addEventListener(
    "click",
    () => {

      const openingViewer =
        !gallery.classList.contains(
          "is-viewer"
        );


      /* -------------------------------------
         Close grid
      ------------------------------------- */

      gallery.classList.remove(
        "is-expanded"
      );


      if (gridButton) {

        gridButton.setAttribute(
          "aria-expanded",
          "false"
        );

        gridButton.title =
          "View all";

      }



      /* -------------------------------------
         Toggle viewer
      ------------------------------------- */

      gallery.classList.toggle(
        "is-viewer",
        openingViewer
      );



      if (openingViewer) {

        /*
          Start viewer on whichever
          card is currently on top.
        */

        const frontCard =
          stackOrder[0];


        const frontIndex =
          mediaCards.indexOf(
            frontCard
          );


        setActiveViewerCard(
          frontIndex >= 0
            ? frontIndex
            : 0
        );


        viewerButton.setAttribute(
          "aria-label",
          "Close media viewer"
        );


        viewerButton.title =
          "Close viewer";

      }


      else {

        mediaCards.forEach(
          (card) => {

            card.classList.remove(
              "is-active"
            );

          }
        );


        viewerButton.setAttribute(
          "aria-label",
          "Open media viewer"
        );


        viewerButton.title =
          "View media";

      }

    }
  );

}



/* =========================================
   CARD CLICK
========================================= */

mediaCards.forEach(
  (card, index) => {

    card.addEventListener(
      "click",
      () => {


        /* ---------------------------------
           VIEWER:
           click thumbnail to change image
        --------------------------------- */

        if (
          gallery.classList.contains(
            "is-viewer"
          )
        ) {

          setActiveViewerCard(
            index
          );

          return;

        }



        /* ---------------------------------
           GRID:
           click card to flip
        --------------------------------- */

        if (
          gallery.classList.contains(
            "is-expanded"
          )
        ) {

          flipCard(card);

        }


        /*
          DEFAULT PILE:
          do nothing here.

          The flip is already handled
          by pointerup so it doesn't
          fire twice.
        */

      }
    );

  }
);



/* =========================================
   GRID BUTTON
   ▦
========================================= */

if (
  gallery &&
  gridButton
) {

  gridButton.addEventListener(
    "click",
    () => {

      const openingGrid =
        !gallery.classList.contains(
          "is-expanded"
        );


      /* -------------------------------------
         Close viewer first
      ------------------------------------- */

      gallery.classList.remove(
        "is-viewer"
      );


      mediaCards.forEach(
        (card) => {

          card.classList.remove(
            "is-active"
          );

          resetCardDrag(card);

        }
      );


      if (viewerButton) {

        viewerButton.setAttribute(
          "aria-label",
          "Open media viewer"
        );

        viewerButton.title =
          "View media";

      }



      /* -------------------------------------
         Toggle grid
      ------------------------------------- */

      gallery.classList.toggle(
        "is-expanded",
        openingGrid
      );


      gridButton.setAttribute(
        "aria-expanded",
        String(openingGrid)
      );


      gridButton.setAttribute(
        "aria-label",
        openingGrid
          ? "Collapse media grid"
          : "Expand media grid"
      );


      gridButton.title =
        openingGrid
          ? "Collapse"
          : "View all";

    }
  );

}



/* =========================================
   KEYBOARD
========================================= */

mediaCards.forEach(
  (card) => {

    card.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key !== "Enter" &&
          event.key !== " "
        ) {
          return;
        }


        event.preventDefault();



        /* viewer */

        if (
          gallery.classList.contains(
            "is-viewer"
          )
        ) {

          const index =
            mediaCards.indexOf(card);

          setActiveViewerCard(
            index
          );

          return;

        }



        /* grid */

        if (
          gallery.classList.contains(
            "is-expanded"
          )
        ) {

          flipCard(card);

          return;

        }



        /* pile */

        if (
          card.dataset.stackPosition
          === "0"
        ) {

          flipCard(card);

        }

      }
    );

  }
);


