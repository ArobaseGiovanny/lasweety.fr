function syncTableWidth() {
  const images = document.querySelector(".hero__images");
  const table = document.querySelector(".hero__table");

  if (images && table) {
    const totalWidth = images.scrollWidth; 
    table.style.width = totalWidth + "px";
  }
}

window.addEventListener("load", syncTableWidth);
window.addEventListener("resize", syncTableWidth);
