// ================================================
// CRAFTNIX DIGITAL - MAIN JAVASCRIPT
// ================================================

document.addEventListener('DOMContentLoaded', () => {

    // ---- THEME TOGGLE ----
    const themeBtn = document.getElementById('themeToggle');
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem('craftnix-theme') || 'dark';
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            const isLight = body.classList.contains('light-mode');
            localStorage.setItem('craftnix-theme', isLight ? 'light' : 'dark');
            themeBtn.innerHTML = isLight
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        });
    }

    // ---- AUTO POPUP (Lead Magnet - 5 seconds) ----
    if (!sessionStorage.getItem('auditShown')) {
        setTimeout(() => {
            openModal('auditModal');
            sessionStorage.setItem('auditShown', 'true');
        }, 5000);
    }

    // ---- STICKY CTA BUTTON ----
    const stickyBtn = document.getElementById('stickyCallBtn');
    if (stickyBtn) {
        stickyBtn.addEventListener('click', () => openModal('projectModal'));
    }

    // ---- AUDIT FORM SUBMIT ----
    const auditForm = document.getElementById('auditForm');
    if (auditForm) {
        auditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('auditName').value.trim();
            const email = document.getElementById('auditEmail').value.trim();
            const website = document.getElementById('auditWebsite').value.trim();

            if (!name || !email || !website) {
                showToast('Please fill all fields!', 'error');
                return;
            }

            const btn = auditForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                await db.collection('leads').add({
                    name,
                    email,
                    website,
                    type: 'audit',
                    source: 'popup',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('✅ Audit request submitted! Check your email.');
                auditForm.reset();
                closeModal('auditModal');
            } catch (err) {
                console.error(err);
                showToast('Something went wrong. Try again!', 'error');
            } finally {
                btn.innerHTML = '<i class="fas fa-chart-line"></i> Get My Free Audit';
                btn.disabled = false;
            }
        });
    }

    // ---- PROJECT START FORM SUBMIT ----
    const projectForm = document.getElementById('projectStartForm');
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputs = projectForm.querySelectorAll('[required]');
            let valid = true;
            inputs.forEach(input => {
                if (!input.value.trim()) valid = false;
            });

            if (!valid) {
                showToast('Please fill all required fields!', 'error');
                return;
            }

            const btn = projectForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            btn.disabled = true;

            try {
                const formData = {};
                projectForm.querySelectorAll('input, select, textarea').forEach(el => {
                    const key = el.id || el.name || el.placeholder;
                    if (key && el.value.trim()) {
                        formData[key] = el.value.trim();
                    }
                });

                if (Object.keys(formData).length === 0) {
                    showToast('Please fill in at least some fields!', 'error');
                    return;
                }

                await db.collection('leads').add({
                    ...formData,
                    type: 'project',
                    source: 'modal',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('🚀 Project submitted! We\'ll contact you in 24 hours.');
                projectForm.reset();
                closeModal('projectModal');
            } catch (err) {
                console.error('Project form error:', err);
                showToast(`Error: ${err.message || 'Something went wrong. Try again!'}`, 'error');
            } finally {
                btn.innerHTML = '<i class="fas fa-rocket"></i> Submit Project';
                btn.disabled = false;
            }
        });
    }

    // ---- CONTACT FORM SUBMIT ----
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const message = document.getElementById('contactMessage').value.trim();

            if (!name || !email || !message) {
                showToast('Please fill all required fields!', 'error');
                return;
            }

            const btn = contactForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                await db.collection('leads').add({
                    name,
                    email,
                    phone: document.getElementById('contactPhone')?.value || '',
                    service: document.getElementById('contactService')?.value || '',
                    message,
                    type: 'contact',
                    source: 'contact-section',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Show success message
                contactForm.style.display = 'none';
                document.getElementById('contactSuccess').style.display = 'block';

                showToast('✅ Message sent! We\'ll reply in 24 hours.');
            } catch (err) {
                console.error(err);
                showToast('Error sending message. Please try again!', 'error');
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                btn.disabled = false;
            }
        });
    }

    // ---- PAGE LOADER HIDE ----
    const loader = document.getElementById('pageLoader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 500);
            }, 1500);
        });
    }

    // ---- LOAD DATA FROM FIREBASE ----
    loadPortfolio();
    loadTestimonials();
    loadServices();
    loadPricing();
    loadBlogs();

});

// ================================================
// FIREBASE DATA LOADERS
// ================================================

// ---- LOAD PORTFOLIO FROM FIREBASE ----
async function loadPortfolio() {
    try {
        const snap = await db
            .collection('projects')
            .where('active', '==', true)
            .get();

        const grid = document.getElementById('portfolioGrid');
        if (!grid) return;

        if (snap.empty) {
            console.log("Empty snap: No active projects found in Firestore.");
            return;
        }

        console.log(`Found ${snap.size} active projects. Rendering...`);

        let html = '';
        snap.forEach(doc => {
            const p = doc.data();
            html += `
                <div 
                    class="portfolio-item reveal-on-scroll" 
                    data-category="${escapeHtml(p.category || 'web')}" 
                    onclick="window.open('${escapeHtml(p.link || '#')}', '_blank')"
                    title="View ${escapeHtml(p.title)}"
                >
                    <div class="portfolio-img img-zoom-wrap">
                        <img 
                            src="${escapeHtml(p.image || 'https://via.placeholder.com/600x400')}" 
                            alt="${escapeHtml(p.title)}" 
                            loading="lazy"
                        >
                    </div>
                    <div class="portfolio-overlay">
                        <div class="portfolio-info">
                            <span class="portfolio-category">${escapeHtml(p.category || 'Design')}</span>
                            <h3>${escapeHtml(p.title)}</h3>
                            <p>${escapeHtml(p.description || '')}</p>
                            <div class="portfolio-actions">
                                <span class="btn-view">
                                    <i class="fas fa-external-link-alt"></i> View Project
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;
        initScrollAnimations();
        initPortfolioFilter();

    } catch (err) {
        console.warn('Portfolio load skipped:', err.message);
    }
}

// ---- LOAD SERVICES FROM FIREBASE ----
async function loadServices() {
    try {
        const snap = await db.collection('services').where('active', '==', true).get();
        const grid = document.getElementById('servicesGrid');
        if (!grid || snap.empty) return;

        let html = '';
        snap.forEach(doc => {
            const s = doc.data();
            html += `
                <div class="col-lg-3 col-md-6 reveal-on-scroll">
                    <div class="service-card glass-card">
                        <div class="service-icon-wrap">
                            <i class="${escapeHtml(s.icon || 'fas fa-rocket')}"></i>
                        </div>
                        <h3>${escapeHtml(s.name)}</h3>
                        <p>${escapeHtml(s.description)}</p>
                        <a href="#contact" class="service-link">Learn More →</a>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        initScrollAnimations();
    } catch (err) { console.warn('Services load skipped:', err.message); }
}

// ---- LOAD TESTIMONIALS FROM FIREBASE ----
async function loadTestimonials() {
    try {
        const snap = await db.collection('testimonials').where('active', '==', true).get();
        const grid = document.getElementById('testimonialsGrid');
        if (!grid || snap.empty) return;

        let html = '';
        snap.forEach(doc => {
            const t = doc.data();
            if (t.type === 'video') {
                html += `
                    <div class="col-lg-6 reveal-on-scroll">
                        <div class="testimonial-card glass-card video-type">
                            <div class="video-thumb" onclick="this.nextElementSibling.style.display='block'; this.style.display='none'">
                                <img src="${escapeHtml(t.thumbnail || 'https://via.placeholder.com/600x400')}" alt="${escapeHtml(t.clientName)}" loading="lazy">
                                <div class="play-btn"><i class="fas fa-play"></i></div>
                            </div>
                            <div class="video-player" style="display:none">
                                <iframe src="${escapeHtml(t.videoUrl || '')}" frameborder="0" allowfullscreen></iframe>
                            </div>
                            <div class="testimonial-footer">
                                <div class="testimonial-avatar">${escapeHtml(t.clientName.charAt(0))}</div>
                                <div><h5>${escapeHtml(t.clientName)}</h5><p>${escapeHtml(t.company || 'Client')}</p></div>
                                <div class="stars ms-auto">${'⭐'.repeat(parseInt(t.rating) || 5)}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="col-lg-6 reveal-on-scroll">
                        <div class="testimonial-card glass-card">
                            <div class="quote-icon">"</div>
                            <p class="testimonial-text">${escapeHtml(t.text)}</p>
                            <div class="testimonial-footer">
                                <div class="testimonial-avatar">${escapeHtml(t.clientName.charAt(0))}</div>
                                <div><h5>${escapeHtml(t.clientName)}</h5><p>${escapeHtml(t.company || 'Client')}</p></div>
                                <div class="stars ms-auto">${'⭐'.repeat(parseInt(t.rating) || 5)}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        grid.innerHTML = html;
        initScrollAnimations();
    } catch (err) { console.warn('Testimonials load skipped:', err.message); }
}

// ---- LOAD PRICING FROM FIREBASE ----
async function loadPricing() {
    try {
        const grid = document.getElementById('pricingGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (!window.firebase || !window.db || typeof db.collection !== 'function') {
            grid.innerHTML = `
                <div class="col-12 text-center text-danger py-5">
                    Firebase is not initialized correctly. Please verify your Firebase config and script loading order.
                </div>
            `;
            console.error('Firebase initialization failed:', {
                firebase: window.firebase,
                db: window.db,
                dbCollection: typeof db.collection
            });
            return;
        }

        const snap = await db.collection('pricing').get();
        const pricingDocs = [];

        snap.forEach(doc => {
            const p = doc.data();
            if (p.active) {
                pricingDocs.push({ id: doc.id, ...p });
            }
        });

        if (!pricingDocs.length) {
            grid.innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    No pricing plans are currently active. Please add one in the admin panel.
                </div>
            `;
            return;
        }

        const sortedPricing = pricingDocs.sort((a, b) => (a.order || 0) - (b.order || 0));
        let html = '';
        sortedPricing.forEach(p => {
            const features = (p.features || '').split('\n').filter(f => f.trim());
            html += `
                <div class="col-lg-4 col-md-6 reveal-on-scroll">
                    <div class="pricing-card glass-card ${p.featured ? 'pricing-featured' : ''}">
                        ${p.featured ? '<div class="popular-badge">Most Popular</div>' : ''}
                        <div class="pricing-top">
                            <h4>${escapeHtml(p.name)}</h4>
                            <p>${p.featured ? 'For growing businesses' : 'Professional choice'}</p>
                        </div>
                        <div class="pricing-price">
                            <span class="currency">₹</span>
                            <span class="amount">${escapeHtml(p.price)}</span>
                            <span class="period">/project</span>
                        </div>
                        <ul class="pricing-features">
                            ${features.map(f => `<li><i class="fas fa-check"></i> ${escapeHtml(f)}</li>`).join('')}
                        </ul>
                        <button class="btn ${p.featured ? 'btn-glow' : 'btn-outline-glow'} w-100" onclick="openModal('projectModal')">
                            Get Started
                        </button>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        initScrollAnimations();
    } catch (err) {
        console.error('Pricing load failed:', err);
        const grid = document.getElementById('pricingGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="col-12 text-center text-danger py-5">
                    Pricing could not load from Firebase: ${escapeHtml(err.message || 'Unknown error')}.
                </div>
            `;
        }
    }
}

// ---- LOAD BLOGS FROM FIREBASE ----
async function loadBlogs() {
    try {
        // CLEANUP: Delete dummy blogs from database
        const dummyIds = ['ui-principles', 'brand-identity', 'cro-secrets'];
        dummyIds.forEach(id => db.collection('blogs').doc(id).delete().catch(() => {}));

        // Seeder call removed

        const snap = await db.collection('blogs').orderBy('createdAt', 'desc').limit(3).get();
        const grid = document.getElementById('blogGrid');
        if (!grid || snap.empty) {
            console.log('No blogs found');
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const b = doc.data();
            const blogId = doc.id;

            // Ensure proper date handling
            let dateStr = 'Recent';
            if (b.createdAt) {
                try {
                    const dateObj = typeof b.createdAt.toDate === 'function'
                        ? b.createdAt.toDate()
                        : new Date(b.createdAt);
                    dateStr = dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    console.error('Date parse error:', e);
                }
            }

            html += `
                <div class="col-lg-4 col-md-6 reveal-on-scroll">
                    <div class="blog-card glass-card">
                        <div class="blog-img-wrap">
                            <img src="${escapeHtml(b.image || 'https://via.placeholder.com/600x400')}" alt="${escapeHtml(b.title)}" loading="lazy">
                            <span class="blog-tag">${escapeHtml(b.category || 'Blog')}</span>
                        </div>
                        <div class="blog-body">
                            <div class="blog-meta">
                                <span><i class="fas fa-calendar-alt"></i> ${dateStr}</span>
                                <span><i class="fas fa-clock"></i> ${b.readTime || '5'} min read</span>
                            </div>
                            <h3>${escapeHtml(b.title)}</h3>
                            <p>${escapeHtml(b.excerpt || b.content?.substring(0, 120) + '...' || '')}</p>
                            <a href="blog-post.html?id=${blogId}" class="blog-read-more">Read More <i class="fas fa-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = html;
        initScrollAnimations();
        console.log('✅ Blogs loaded successfully');
    } catch (err) {
        console.warn('Blog load skipped:', err.message);
    }
}

// Ensure blogs exist with correct IDs
async function ensureBlogsExist() {
    try {
        const sampleBlogs = [
            {
                id: 'ui-principles',
                title: '10 UI Principles Every Designer Must Know',
                category: 'UI/UX',
                excerpt: 'Discover the core principles that separate good UI from great UI. These timeless rules will transform your designs.',
                readTime: '5 min',
                image: 'https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?q=80&w=2070&auto=format&fit=crop',
                content: '<p>Design principles are the foundation of great user interfaces...</p>',
                createdAt: new Date('2024-01-15')
            },
            {
                id: 'brand-identity',
                title: 'How a Strong Brand Identity 3x Your Revenue',
                category: 'Branding',
                excerpt: 'Real data from 50+ client projects showing exactly how strategic branding drives business growth.',
                readTime: '4 min',
                image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=2128&auto=format&fit=crop',
                content: '<p>Brand identity is more than just a logo and color scheme...</p>',
                createdAt: new Date('2024-02-08')
            },
            {
                id: 'cro-secrets',
                title: 'CRO Secrets: How We Boosted Conversions by 340%',
                category: 'Growth',
                excerpt: 'Step-by-step breakdown of our proven conversion rate optimization process with real client results.',
                readTime: '6 min',
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
                content: '<p>Conversion Rate Optimization (CRO) is the process of increasing...</p>',
                createdAt: new Date('2024-03-01')
            }
        ];

        // Check if blogs exist, if not seed them
        for (const blog of sampleBlogs) {
            try {
                const doc = await db.collection('blogs').doc(blog.id).get();
                if (!doc.exists) {
                    const { id, ...blogData } = blog;
                    await db.collection('blogs').doc(id).set({
                        ...blogData,
                        createdAt: firebase.firestore.Timestamp.fromDate(blog.createdAt)
                    });
                    console.log('✅ Blog created:', blog.title);
                }
            } catch (e) {
                console.error('Error checking/creating blog:', blog.title, e);
            }
        }
    } catch (err) {
        console.error('Error ensuring blogs exist:', err);
    }
}

// Helper to re-init scroll reveal for dynamic elements
function initScrollAnimations() {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
        }, { threshold: 0.1 });
        observer.observe(el);
    });
}

// ================================================
// CHAT WIDGET
// ================================================

const chatOpenBtn = document.getElementById('chatOpenBtn');
const chatWidget = document.getElementById('chatWidget');
const chatToggle = document.getElementById('chatToggle');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatInput = document.getElementById('chatInput');
const chatMsgs = document.getElementById('chatMessages');

// Open chat
if (chatOpenBtn) {
    chatOpenBtn.addEventListener('click', () => {
        chatWidget.classList.add('open');
        chatOpenBtn.style.display = 'none';
        // Remove notification dot
        const dot = chatOpenBtn.querySelector('.chat-notification-dot');
        if (dot) dot.remove();
    });
}

// Close chat
const chatCloseBtn = document.querySelector('.chat-close-btn');
if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chatWidget.classList.remove('open');
        if (chatOpenBtn) chatOpenBtn.style.display = 'flex';
    });
}

// Send message
function sendChatMsg() {
    const msg = chatInput?.value?.trim();
    if (!msg) return;

    appendChatMsg(msg, 'user');
    chatInput.value = '';

    // Bot reply after delay
    setTimeout(() => {
        const reply = getBotReply(msg);
        appendChatMsg(reply, 'bot');
    }, 800);
}

function appendChatMsg(text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${type}`;
    msgDiv.innerHTML = `
        <div class="msg-bubble">${escapeHtml(text)}</div>
        ${type === 'user' ? '' : `<span class="msg-time">Just now</span>`}
    `;
    if (chatMsgs) {
        chatMsgs.appendChild(msgDiv);
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
    }
}

function getBotReply(msg) {
    const lower = msg.toLowerCase();

    if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing')) {
        return "Our pricing starts from ₹5499. Check our Pricing section above or click 'Start Project' to get a custom quote! 💰";
    }
    if (lower.includes('service') || lower.includes('what do you do')) {
        return "We offer UI/UX Design, Branding, Website Design, and Digital Growth strategies. Which service interests you? 🎨";
    }
    if (lower.includes('time') || lower.includes('how long') || lower.includes('timeline')) {
        return "Project timelines vary: Branding (1-2 weeks), Website (2-4 weeks), Full project (4-8 weeks). Need a custom timeline? 📅";
    }
    if (lower.includes('contact') || lower.includes('email') || lower.includes('call')) {
        return "You can reach us at hello@craftnix.digital or use our Contact form below! We respond within 24 hours. 📧";
    }
    if (lower.includes('portfolio') || lower.includes('work') || lower.includes('example')) {
        return "Check out our Portfolio section above to see our work! All projects are clickable to view live. 💼";
    }
    if (lower.includes('start') || lower.includes('project') || lower.includes('hire')) {
        return "Great! Click the 'Start Project' button in the navbar or scroll to our Contact section. We'd love to work with you! 🚀";
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return "Hello! 👋 Welcome to Craftnix Digital! How can we help you today?";
    }

    return "Thanks for your message! 😊 For detailed queries, please use our Contact form or email hello@craftnix.digital. We reply fast!";
}

function sendQuickReply(text) {
    if (chatInput) chatInput.value = text;
    sendChatMsg();
}

if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendChatMsg);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMsg();
    });
}

// ================================================
// BUTTON RIPPLE EFFECT
// ================================================
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-glow, .btn-outline-glow');
    if (!btn) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
    `;

    btn.classList.add('btn-ripple');
    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 700);
});

// ================================================
// NEWSLETTER FORM
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForms = document.querySelectorAll('.newsletter-form');

    newsletterForms.forEach(form => {
        const btn = form.querySelector('button');
        const input = form.querySelector('input[type="email"]');

        if (btn && input) {
            btn.addEventListener('click', async () => {
                const email = input.value.trim();
                if (!email || !email.includes('@')) {
                    showToast('Please enter a valid email!', 'error');
                    return;
                }

                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;

                try {
                    await db.collection('newsletter').add({
                        email,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    showToast('✅ Subscribed successfully!');
                    input.value = '';
                } catch (err) {
                    console.error(err);
                    showToast('Error subscribing. Try again!', 'error');
                } finally {
                    btn.innerHTML = 'Subscribe';
                    btn.disabled = false;
                }
            });
        }
    });
});


function openOffcanvas() {
    document.getElementById('offcanvasPanel').classList.add('open');
    document.getElementById('offcanvasOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeOffcanvas() {
    document.getElementById('offcanvasPanel').classList.remove('open');
    document.getElementById('offcanvasOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

