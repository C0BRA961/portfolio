document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Toggle mobile nav
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Smooth scroll for anchor links & close mobile nav
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      // If mobile nav is open, close it after clicking a link
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Set current year in footer
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Reveal animations with Intersection Observer
  const revealElements = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  revealElements.forEach(element => {
    observer.observe(element);
  });

  // Copy to clipboard functionality
  const copyBtns = document.querySelectorAll('.copy-btn');
  const toast = document.getElementById('toast');

  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const textToCopy = btn.getAttribute('data-copy');
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        // Show toast
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      });
    });
  });

  // Scroll event for nav styling
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('site-nav');
    if (window.scrollY > 0) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
});
