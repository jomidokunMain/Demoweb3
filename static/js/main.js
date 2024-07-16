function toggleSubNav() {
    var subNav = document.getElementById("sub-nav");
    let timer;
    function showSubnav() {
      subNav.style.display = "block";
    }
    function hideSubnav() {
      subNav.style.display = "none";
    }

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(hideSubnav, 2000);
    }

    if (subNav.style.display === "block") {
      subNav.style.display = "none";
      resetTimer();
    } else {
      subNav.style.display = "block";
      resetTimer();
    }
  }

const subnav1 = document.getElementById("subnav1");
let timer;

function showSubnav() {
    subnav1.style.display = "block";
}

function hideSubnav() {
    subnav1.style.display = "none";
}

function resetTimer() {
    clearTimeout(timer);
    timer = setTimeout(hideSubnav, 2000);
    }

// Show subnav on hover
document
    .getElementById("secondTopNav")
    .addEventListener("mouseover", () => {
        showSubnav();
        resetTimer();
    });
// Show subnav on clcick
document
    .getElementById("secondTopNav")
    .addEventListener('click', () => {
        showSubnav();
        resetTimer();
    });