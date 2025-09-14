function syncTableWidth() {
  const images = document.querySelector(".hero__images");
  const table = document.querySelector(".hero__table");

  if (images && table) {
    table.style.width = images.scrollWidth + "px";
  }
}

window.addEventListener("load", () => {
  const images = document.querySelector(".hero__images");
  if (!images) return;

  // Première synchro
  syncTableWidth();

  // Observe si .hero__images change de taille
  const observer = new ResizeObserver(syncTableWidth);
  observer.observe(images);
});
