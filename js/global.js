const siteNav =
  document.querySelector(".site-nav");

let lastScrollY =
  window.scrollY;

let ticking = false;


/*
  How far down before nav
  is allowed to collapse.
*/

const collapseAfter = 160;


/*
  Ignores tiny trackpad movements
  so the nav doesn't twitch.
*/

const scrollThreshold = 8;


function updateNav() {
  const currentScrollY =
    window.scrollY;

  const difference =
    currentScrollY - lastScrollY;


  /*
    Always show full nav
    near the top of the page.
  */

  if (currentScrollY <= 80) {
    siteNav.classList.remove(
      "is-collapsed"
    );

    lastScrollY =
      currentScrollY;

    ticking = false;

    return;
  }


  /*
    Ignore tiny scroll changes.
  */

  if (
    Math.abs(difference) <
    scrollThreshold
  ) {
    ticking = false;

    return;
  }


  /*
    Scrolling down
  */

  if (
    difference > 0 &&
    currentScrollY > collapseAfter
  ) {
    siteNav.classList.add(
      "is-collapsed"
    );
  }


  /*
    Scrolling up
  */

  if (difference < 0) {
    siteNav.classList.remove(
      "is-collapsed"
    );
  }


  lastScrollY =
    currentScrollY;

  ticking = false;
}


window.addEventListener(
  "scroll",
  () => {

    if (ticking) {
      return;
    }

    ticking = true;

    requestAnimationFrame(
      updateNav
    );

  },
  {
    passive: true
  }
);

/* --- FOOTER CLOCK --- */
const footerClock = document.getElementById("footerClock");
function updateFooterClock() {
  if (!footerClock) return;

  footerClock.textContent = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/Vancouver",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
updateFooterClock();
setInterval(updateFooterClock, 30000);


