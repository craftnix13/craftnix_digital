// ================================================
// CRAFTNIX DIGITAL - UTILITY FUNCTIONS
// ================================================

// ---- PAGE LOADER ----
window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }, 1500);
    }
});

// ---- SCROLL PROGRESS BAR ----
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / docHeight) * 100;
    const bar = document.getElementById('scrollProgressBar');
    if (bar) bar.style.width = Math.min(progress, 100) + '%';
}, { passive: true });

// ---- NAVBAR SCROLL EFFECT ----
window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNavbar');
    if (!nav) return;
    if (window.scrollY > 100) {
        nav.classList.add('navbar-scrolled');
    } else {
        nav.classList.remove('navbar-scrolled');
    }
});

// ---- BACK TO TOP BUTTON ----
window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    if (window.scrollY > 400) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
});

const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ---- COUNTER ANIMATION ----
function animateCounter(el) {
    if (el.dataset.animated) return;
    el.dataset.animated = 'true';

    const target   = parseInt(el.getAttribute('data-target'));
    const duration = 2000;
    const start    = performance.now();

    function update(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target;
        }
    }

    requestAnimationFrame(update);
}

// ---- INTERSECTION OBSERVER (Scroll Reveal + Counter) ----
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
        }
    });
}, { threshold: 0.5 });

// Init observers on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Reveal elements
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        revealObserver.observe(el);
    });

    // Counter elements
    document.querySelectorAll('.counter').forEach(el => {
        counterObserver.observe(el);
    });
});

// ---- PARTICLES CANVAS ----
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Particle class
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x       = Math.random() * canvas.width;
            this.y       = Math.random() * canvas.height;
            this.size    = Math.random() * 2 + 0.5;
            this.speedX  = (Math.random() - 0.5) * 0.4;
            this.speedY  = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.4 + 0.1;
            this.color   = Math.random() > 0.5 
                ? `rgba(123,63,228,${this.opacity})` 
                : `rgba(255,140,47,${this.opacity})`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width)  this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height)  this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // Create particles
    const particles = Array.from({ length: 80 }, () => new Particle());

    // Connect nearby particles
    function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx   = particles[i].x - particles[j].x;
                const dy   = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(123,63,228,${0.1 * (1 - dist / 120)})`;
                    ctx.lineWidth   = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        connectParticles();
        requestAnimationFrame(animate);
    }

    animate();
}

window.addEventListener('load', initParticles);

// ---- MODAL OPEN / CLOSE ----
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('custom-modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.custom-modal-overlay.active').forEach(m => {
            m.classList.remove('active');
        });
        document.body.style.overflow = '';
    }
});

// ---- TOAST NOTIFICATIONS ----
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container-custom');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container-custom';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(30px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ---- PORTFOLIO FILTER ----
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items      = document.querySelectorAll('.portfolio-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active button update
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            items.forEach(item => {
                const cat = item.dataset.category;
                if (filter === 'all' || cat === filter) {
                    item.style.display = '';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        item.style.transition = 'all 0.4s ease';
                        item.style.opacity    = '1';
                        item.style.transform  = 'scale(1)';
                    }, 50);
                } else {
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity    = '0';
                    item.style.transform  = 'scale(0.9)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// ---- SMOOTH SCROLL FOR ALL ANCHOR LINKS ----
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#' || href === '#!') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = 80; // navbar height
                const top    = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });

                // Close mobile navbar if open
                const navMenu = document.getElementById('navMenu');
                if (navMenu && navMenu.classList.contains('show')) {
                    navMenu.classList.remove('show');
                }
            }
        });
    });

    // Init portfolio filter
    initPortfolioFilter();
});

// ---- ACTIVE NAV LINK ON SCROLL ----
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ---- FORMAT CURRENCY ----
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(amount);
}

// ---- DEBOUNCE ----
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ---- ESCAPE HTML (Security) ----
function escapeHtml(str) {
    const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
}

// ---- IMAGE LAZY LOAD ----
if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imgObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imgObserver.observe(img);
    });
}

// ---- CUSTOM CURSOR LOGIC ----
const dot     = document.querySelector('.cursor-dot');
const outline = document.querySelector('.cursor-outline');

if (dot && outline) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        dot.style.left = `${posX}px`;
        dot.style.top  = `${posY}px`;

        outline.animate({
            left: `${posX}px`,
            top:  `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    window.addEventListener('mouseout', () => {
        dot.style.opacity = '0';
        outline.style.opacity = '0';
    });
    window.addEventListener('mouseover', () => {
        dot.style.opacity = '1';
        outline.style.opacity = '1';
    });

    // Cursor hover effects
    const hoverElements = 'a, button, .portfolio-item, .service-card, .blog-card, .glass-card, select, input, textarea';
    
    // Function to attach listeners
    const attachCursorEvents = (elements) => {
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    };

    attachCursorEvents(document.querySelectorAll(hoverElements));

    // Re-attach for dynamic content (Portfolio/Testimonials)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const targets = node.querySelectorAll ? node.querySelectorAll(hoverElements) : [];
                        if (node.matches && node.matches(hoverElements)) attachCursorEvents([node]);
                        attachCursorEvents(targets);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// ---- MAGNETIC BUTTON EFFECT ----
document.addEventListener('mousemove', (e) => {
    const magneticBtns = document.querySelectorAll('.btn-glow, .btn-outline-glow');
    
    magneticBtns.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        const x    = e.clientX - rect.left - rect.width / 2;
        const y    = e.clientY - rect.top - rect.height / 2;
        const dist = Math.sqrt(x * x + y * y);

        if (dist < 100) {
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        } else {
            btn.style.transform = `translate(0, 0)`;
        }
    });
});

