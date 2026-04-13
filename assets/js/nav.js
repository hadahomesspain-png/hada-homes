/* Hada Homes — Shared Navigation JS
   Works on all pages. Injects mobile overlay menu automatically.
*/
(function(){
  // Build mobile overlay from existing nav-links
  function buildMobileMenu(){
    if(document.getElementById('navMobileOverlay')) return; // already exists

    var navbar = document.getElementById('navbar');
    if(!navbar) return;

    // Collect nav links from the existing nav
    var navLinks = navbar.querySelectorAll('.nav-links .nav-link');
    var bookBtn = navbar.querySelector('.nav-book-btn, a[href*="/boeken/"]');

    var overlay = document.createElement('div');
    overlay.id = 'navMobileOverlay';
    overlay.className = 'nav-mobile-overlay';

    navLinks.forEach(function(link){
      var a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.textContent.trim();
      a.addEventListener('click', closeMenu);
      overlay.appendChild(a);
    });

    // Add book button at bottom
    var bookLink = document.createElement('a');
    bookLink.href = '/boeken/';
    bookLink.textContent = 'Boek direct';
    bookLink.className = 'nav-mobile-book';
    overlay.appendChild(bookLink);

    navbar.parentNode.insertBefore(overlay, navbar.nextSibling);

    // Fix hamburger button — add onclick if missing
    var hamburger = navbar.querySelector('.nav-hamburger');
    if(hamburger){
      hamburger.id = 'navHamburger';
      hamburger.setAttribute('role', 'button');
      hamburger.setAttribute('aria-label', 'Menu');
      hamburger.style.cursor = 'pointer';
      hamburger.addEventListener('click', toggleMenu);
    }
  }

  function toggleMenu(){
    var overlay = document.getElementById('navMobileOverlay');
    var btn = document.getElementById('navHamburger');
    if(!overlay) return;
    var open = overlay.classList.contains('open');
    overlay.classList.toggle('open', !open);
    if(btn) btn.classList.toggle('open', !open);
    document.body.style.overflow = open ? '' : 'hidden';
  }

  function closeMenu(){
    var overlay = document.getElementById('navMobileOverlay');
    var btn = document.getElementById('navHamburger');
    if(overlay) overlay.classList.remove('open');
    if(btn) btn.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Expose globally for inline onclick handlers
  window.toggleMenu = toggleMenu;
  window.closeMenu = closeMenu;

  // Run on DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', buildMobileMenu);
  } else {
    buildMobileMenu();
  }

  // Navbar scroll effect (shared)
  window.addEventListener('scroll', function(){
    var nb = document.getElementById('navbar');
    if(nb) nb.classList.toggle('solid', window.scrollY > 60);
    // Mobile CTA bar
    var mc = document.getElementById('mobileCta');
    if(mc) mc.style.display = window.scrollY > 200 ? 'flex' : 'none';
  });

})();
