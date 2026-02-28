// Chess Ai — subtle header scroll effect
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 50) {
      header.style.background = 'rgba(6, 6, 10, 0.95)';
    } else {
      header.style.background = 'rgba(6, 6, 10, 0.8)';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});
