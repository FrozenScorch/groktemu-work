// Sticky header elevation, mobile menu, back-to-top, and contact form handling.

export function initNav() {
  const header = document.querySelector('.site-header');
  const menuBtn = document.getElementById('menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const toTop = document.getElementById('to-top');

  // Elevate header after scrolling past the hero edge.
  if (header) {
    const onScroll = () => {
      const elevated = window.scrollY > 16;
      header.setAttribute('data-elevate', String(elevated));
      if (toTop) {
        if (window.scrollY > 600) toTop.hidden = false;
        else toTop.hidden = true;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile menu toggle.
  if (menuBtn && mobileNav) {
    const setOpen = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      mobileNav.hidden = !open;
    };
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      setOpen(!open);
    });
    // Close on link click.
    mobileNav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    // Close on Escape.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        menuBtn.focus();
      }
    });
  }

  // Back to top.
  if (toTop) {
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Footer year.
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}
