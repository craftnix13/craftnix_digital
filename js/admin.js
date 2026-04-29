// ================================================
// CRAFTNIX DIGITAL - ADMIN JAVASCRIPT (ULTRA ROBUST)
// ================================================

// Global state
let editingProjectId = null;
let editingServiceId = null;
let editingTestimonialId = null;
let editingPricingId = null;
let editingBlogId = null;

// Error Handler
function handleGlobalError(err, context = "") {
    console.error(`❌ Error [${context}]:`, err);
    showToast(`Error: ${err.message || 'Unknown error'}`, 'error');
}

// ---- AUTH CHECK ----
auth.onAuthStateChanged(user => {
    console.log("🔒 Auth state changed:", user ? user.email : "Logged out");
    if (!user) {
        window.location.href = 'admin-login.html';
    } else {
        const emailEl = document.getElementById('userEmail');
        if (emailEl) emailEl.textContent = user.email;
        initAdminPanel();
    }
});

// ---- INIT ADMIN ----
async function initAdminPanel() {
    console.log("🚀 Starting Admin Panel Initialization...");
    
    // Loaders ko independent run karo taaki ek ke fail hone se sab na ruke
    const loaders = [
        { name: 'Projects', fn: loadAdminProjects },
        { name: 'Services', fn: loadAdminServices },
        { name: 'Testimonials', fn: loadAdminTestimonials },
        { name: 'Pricing', fn: loadAdminPricing },
        { name: 'Leads', fn: loadAdminLeads },
        { name: 'Blogs', fn: loadAdminBlogs }
    ];

    for (const loader of loaders) {
        try {
            await loader.fn();
            console.log(`✅ ${loader.name} loaded.`);
        } catch (err) {
            console.warn(`⚠️ Failed to load ${loader.name}:`, err.message);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("📌 DOM Ready. Attaching listeners...");
    
    // Sidebar Navigation
    const links = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.admin-section');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if (!sectionId) return;

            links.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('visible'));

            link.classList.add('active');
            const target = document.getElementById(sectionId);
            if (target) {
                target.classList.add('visible');
                window.location.hash = sectionId;
            }
        });
    });

    const hash = window.location.hash.substring(1) || 'projects';
    const initialLink = document.querySelector(`.sidebar-link[data-section="${hash}"]`);
    if (initialLink) initialLink.click();

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'admin-login.html';
    });

    // --- FORM SUBMIT LISTENERS ---
    
    // Projects
    document.getElementById('addProjectBtn')?.addEventListener('click', () => {
        editingProjectId = null;
        document.getElementById('projectForm').reset();
        document.getElementById('projectImagePreview').innerHTML = '';
        openAdminModal('projectModal');
    });
    document.getElementById('projectForm')?.addEventListener('submit', handleProjectSubmit);
    document.getElementById('projectImage')?.addEventListener('change', (e) => {
        showImagePreview(e.target.files[0], 'projectImagePreview');
    });

    // Services
    document.getElementById('addServiceBtn')?.addEventListener('click', () => {
        editingServiceId = null;
        document.getElementById('serviceForm').reset();
        openAdminModal('serviceModal');
    });
    document.getElementById('serviceForm')?.addEventListener('submit', handleServiceSubmit);

    // Testimonials
    document.getElementById('addTestimonialBtn')?.addEventListener('click', () => {
        editingTestimonialId = null;
        document.getElementById('testimonialForm').reset();
        document.getElementById('thumbnailPreview').innerHTML = '';
        openAdminModal('testimonialModal');
    });
    document.getElementById('testimonialForm')?.addEventListener('submit', handleTestimonialSubmit);
    document.getElementById('testimonialType')?.addEventListener('change', (e) => {
        const videoFields = document.getElementById('videoFields');
        if (videoFields) videoFields.style.display = e.target.value === 'video' ? 'block' : 'none';
    });

    // Pricing
    document.getElementById('addPricingBtn')?.addEventListener('click', () => {
        editingPricingId = null;
        document.getElementById('pricingForm').reset();
        openAdminModal('pricingModal');
    });
    document.getElementById('pricingForm')?.addEventListener('submit', handlePricingSubmit);

    // Blog
    document.getElementById('addBlogBtn')?.addEventListener('click', () => {
        editingBlogId = null;
        document.getElementById('blogForm').reset();
        document.getElementById('blogImagePreview').innerHTML = '';
        openAdminModal('blogModal');
    });
    document.getElementById('blogForm')?.addEventListener('submit', handleBlogSubmit);
    document.getElementById('blogImage')?.addEventListener('change', (e) => {
        showImagePreview(e.target.files[0], 'blogImagePreview');
    });

    // Export Leads
    document.getElementById('exportLeadsBtn')?.addEventListener('click', exportLeads);
});

// ================================================
// CLOUDINARY UPLOAD HELPER
// ================================================

async function uploadToCloudinary(file) {
    if (!window.CLOUDINARY_CLOUD_NAME || !window.CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("Cloudinary credentials missing. Please check js/firebase-config.js");
    }

    console.log("📤 Uploading to Cloudinary...");
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', window.CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${window.CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Cloudinary upload failed");
    }

    const data = await response.json();
    console.log("✅ Cloudinary upload success:", data.secure_url);
    return data.secure_url;
}

// ================================================
// CRUD HANDLERS
// ================================================

// --- PROJECT ---
async function handleProjectSubmit(e) {
    e.preventDefault();
    console.log("📝 Project submit started...");
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const title = document.getElementById('projectTitle').value.trim();
        const category = document.getElementById('projectCategory').value;
        const link = document.getElementById('projectLink').value.trim();
        const order = parseInt(document.getElementById('projectOrder').value) || 1;
        const active = document.getElementById('projectActive').checked;
        const desc = document.getElementById('projectDesc').value.trim();
        const imgFile = document.getElementById('projectImage').files[0];

        console.log("📊 Form data gathered:", { title, category, link, order, active });

        if (!editingProjectId && !imgFile) {
            throw new Error("Please select a cover image for new project");
        }

        let imageUrl = '';
        if (imgFile) {
            console.log("☁️ Uploading to Cloudinary...");
            showToast("Uploading image...");
            imageUrl = await uploadToCloudinary(imgFile);
            console.log("✅ Image uploaded:", imageUrl);
        } else if (editingProjectId) {
            const doc = await db.collection('projects').doc(editingProjectId).get();
            imageUrl = doc.data()?.image || '';
        }

        const data = { 
            title, 
            category, 
            link, 
            description: desc, 
            order, 
            active, 
            image: imageUrl,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("💾 Saving to Firestore collection 'projects'...");
        if (editingProjectId) {
            await db.collection('projects').doc(editingProjectId).update(data);
            showToast('✅ Project updated!');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection('projects').add(data);
            console.log("✅ Project added with ID:", docRef.id);
            showToast('✅ Project added successfully!');
        }

        closeAdminModal('projectModal');
        await loadAdminProjects();
    } catch (err) {
        handleGlobalError(err, "Project Save");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- SERVICE ---
async function handleServiceSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const name = document.getElementById('serviceName').value.trim();
        const description = document.getElementById('serviceDescription').value.trim();
        const icon = document.getElementById('serviceIcon').value.trim();
        const active = document.getElementById('serviceActive').checked;
        
        const data = { name, description, icon, active };

        if (editingServiceId) {
            await db.collection('services').doc(editingServiceId).update(data);
            showToast('✅ Service updated!');
        } else {
            await db.collection('services').add(data);
            showToast('✅ Service added!');
        }
        closeAdminModal('serviceModal');
        await loadAdminServices();
    } catch (err) {
        handleGlobalError(err, "Service Save");
    } finally {
        btn.disabled = false;
    }
}

// --- TESTIMONIAL ---
async function handleTestimonialSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const type = document.getElementById('testimonialType').value;
        const clientName = document.getElementById('testimonialName').value.trim();
        const company = document.getElementById('testimonialCompany').value.trim();
        const text = document.getElementById('testimonialText').value.trim();
        const rating = document.getElementById('testimonialRating').value;
        const active = document.getElementById('testimonialActive').checked;
        const videoUrl = document.getElementById('testimonialVideoUrl')?.value.trim() || '';
        const thumbFile = document.getElementById('testimonialThumbnail')?.files[0];

        let thumbnail = '';
        if (thumbFile) {
            thumbnail = await uploadToCloudinary(thumbFile);
        } else if (editingTestimonialId) {
            const doc = await db.collection('testimonials').doc(editingTestimonialId).get();
            thumbnail = doc.data()?.thumbnail || '';
        }

        const data = { type, clientName, company, text, rating, active, videoUrl, thumbnail };

        if (editingTestimonialId) {
            await db.collection('testimonials').doc(editingTestimonialId).update(data);
            showToast('✅ Testimonial updated!');
        } else {
            await db.collection('testimonials').add(data);
            showToast('✅ Testimonial added!');
        }
        closeAdminModal('testimonialModal');
        await loadAdminTestimonials();
    } catch (err) {
        handleGlobalError(err, "Testimonial Save");
    } finally {
        btn.disabled = false;
    }
}

// --- PRICING ---
async function handlePricingSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const name = document.getElementById('pricingName').value.trim();
        const price = document.getElementById('pricingPrice').value.trim();
        const features = document.getElementById('pricingFeatures').value.trim();
        const order = parseInt(document.getElementById('pricingOrder').value) || 1;
        const featured = document.getElementById('pricingFeatured').checked;
        const active = document.getElementById('pricingActive').checked;

        const data = { name, price, features, order, featured, active };

        if (editingPricingId) {
            await db.collection('pricing').doc(editingPricingId).update(data);
        } else {
            await db.collection('pricing').add(data);
        }
        showToast('✅ Plan saved!');
        closeAdminModal('pricingModal');
        await loadAdminPricing();
    } catch (err) {
        handleGlobalError(err, "Pricing Save");
    } finally {
        btn.disabled = false;
    }
}

// --- BLOG ---
async function handleBlogSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
        const title = document.getElementById('blogTitle').value.trim();
        const tag = document.getElementById('blogTag').value;
        const excerpt = document.getElementById('blogExcerpt').value.trim();
        const link = document.getElementById('blogLink').value.trim();
        const readTime = parseInt(document.getElementById('blogReadTime').value) || 5;
        const order = parseInt(document.getElementById('blogOrder').value) || 1;
        const active = document.getElementById('blogActive').checked;
        const imgFile = document.getElementById('blogImage').files[0];

        let image = '';
        if (imgFile) {
            image = await uploadToCloudinary(imgFile);
        } else if (editingBlogId) {
            const doc = await db.collection('blogs').doc(editingBlogId).get();
            image = doc.data()?.image || '';
        }

        const data = { title, tag, excerpt, link, readTime, order, active, image };

        if (editingBlogId) {
            await db.collection('blogs').doc(editingBlogId).update(data);
        } else {
            await db.collection('blogs').add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        showToast('✅ Blog post saved!');
        closeAdminModal('blogModal');
        await loadAdminBlogs();
    } catch (err) {
        handleGlobalError(err, "Blog Save");
    } finally {
        btn.disabled = false;
    }
}

// ================================================
// DATA LOADERS
// ================================================

async function loadAdminProjects() {
    const list = document.getElementById('projectsList');
    if (!list) return;
    const snap = await db.collection('projects').get();
    let html = '';
    snap.forEach(doc => {
        const p = doc.data();
        html += `
            <div class="admin-card">
                <img src="${p.image || ''}" class="admin-card-img" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="admin-card-body">
                    <div class="admin-card-top">
                        <span class="status-pill ${p.active ? 'active' : 'inactive'}">${p.active ? 'Active' : 'Hidden'}</span>
                        <span class="category-pill">${p.category}</span>
                    </div>
                    <h4>${p.title}</h4>
                </div>
                <div class="admin-card-actions">
                    <button class="btn-admin-edit" onclick="editProject('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-admin-delete" onclick="deleteProject('${doc.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html || '<p class="text-center w-100 text-muted">No projects found.</p>';
}

async function loadAdminServices() {
    const list = document.getElementById('servicesList');
    if (!list) return;
    const snap = await db.collection('services').get();
    let html = '';
    snap.forEach(doc => {
        const s = doc.data();
        html += `
            <div class="admin-card">
                <div class="admin-card-body">
                    <i class="${s.icon} fa-2x mb-3" style="color:var(--admin-purple)"></i>
                    <h4>${s.name}</h4>
                </div>
                <div class="admin-card-actions">
                    <button class="btn-admin-edit" onclick="editService('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-admin-delete" onclick="deleteService('${doc.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html || '<p class="text-center w-100 text-muted">No services found.</p>';
}

async function loadAdminTestimonials() {
    const list = document.getElementById('testimonialsList');
    if (!list) return;
    const snap = await db.collection('testimonials').get();
    let html = '';
    snap.forEach(doc => {
        const t = doc.data();
        html += `
            <div class="admin-card">
                <div class="admin-card-body">
                    <div class="testimonial-avatar mb-2">${t.clientName.charAt(0)}</div>
                    <h4>${t.clientName}</h4>
                    <p class="text-muted small">${t.company}</p>
                </div>
                <div class="admin-card-actions">
                    <button class="btn-admin-edit" onclick="editTestimonial('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-admin-delete" onclick="deleteTestimonial('${doc.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html || '<p class="text-center w-100 text-muted">No testimonials found.</p>';
}

async function loadAdminPricing() {
    const list = document.getElementById('pricingList');
    if (!list) return;
    const snap = await db.collection('pricing').orderBy('order').get();
    let html = '';
    snap.forEach(doc => {
        const p = doc.data();
        html += `
            <div class="admin-card">
                <div class="admin-card-body">
                    <div class="pricing-badge">${p.featured ? 'Featured' : 'Standard'}</div>
                    <h4>${p.name}</h4>
                    <p class="text-gradient h4">$${p.price}</p>
                </div>
                <div class="admin-card-actions">
                    <button class="btn-admin-edit" onclick="editPricing('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-admin-delete" onclick="deletePricing('${doc.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html || '<p class="text-center w-100 text-muted">No plans found.</p>';
}

async function loadAdminBlogs() {
    const list = document.getElementById('blogsList');
    if (!list) return;
    const snap = await db.collection('blogs').get();
    let html = '';
    snap.forEach(doc => {
        const b = doc.data();
        html += `
            <div class="admin-card">
                <img src="${b.image || ''}" class="admin-card-img">
                <div class="admin-card-body">
                    <h4>${b.title}</h4>
                    <span class="category-pill">${b.tag}</span>
                </div>
                <div class="admin-card-actions">
                    <button class="btn-admin-edit" onclick="editBlog('${doc.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-admin-delete" onclick="deleteBlog('${doc.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html || '<p class="text-center w-100 text-muted">No posts found.</p>';
}

async function loadAdminLeads() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    const snap = await db.collection('leads').orderBy('timestamp', 'desc').limit(50).get();
    let html = '';
    snap.forEach(doc => {
        const l = doc.data();
        const date = l.timestamp?.toDate ? l.timestamp.toDate().toLocaleDateString() : 'Recent';
        html += `
            <tr>
                <td>${l.name}</td>
                <td>${l.email}</td>
                <td>${l.phone || '-'}</td>
                <td><span class="badge bg-primary">${l.type}</span></td>
                <td>${date}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteLead('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html || '<tr><td colspan="6" class="text-center">No leads found.</td></tr>';
}

// ================================================
// EDIT & DELETE ACTIONS (Exposed to Window)
// ================================================

// Project
window.editProject = async (id) => {
    try {
        editingProjectId = id;
        const doc = await db.collection('projects').doc(id).get();
        const p = doc.data();
        document.getElementById('projectTitle').value = p.title || '';
        document.getElementById('projectCategory').value = p.category || 'web';
        document.getElementById('projectLink').value = p.link || '';
        document.getElementById('projectOrder').value = p.order || 1;
        document.getElementById('projectActive').checked = p.active !== false;
        document.getElementById('projectDesc').value = p.description || '';
        if (p.image) {
            document.getElementById('projectImagePreview').innerHTML = `<img src="${p.image}" style="max-height:100px; border-radius:8px;">`;
        }
        openAdminModal('projectModal');
    } catch (err) { handleGlobalError(err, "Load Project for Edit"); }
};

window.deleteProject = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
        await db.collection('projects').doc(id).delete();
        showToast('✅ Project deleted!');
        await loadAdminProjects();
    } catch (err) { handleGlobalError(err, "Delete Project"); }
};

// Service
window.editService = async (id) => {
    try {
        editingServiceId = id;
        const doc = await db.collection('services').doc(id).get();
        const s = doc.data();
        document.getElementById('serviceName').value = s.name || '';
        document.getElementById('serviceDescription').value = s.description || '';
        document.getElementById('serviceIcon').value = s.icon || '';
        document.getElementById('serviceActive').checked = s.active !== false;
        openAdminModal('serviceModal');
    } catch (err) { handleGlobalError(err, "Load Service for Edit"); }
};

window.deleteService = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
        await db.collection('services').doc(id).delete();
        showToast('✅ Service deleted!');
        await loadAdminServices();
    } catch (err) { handleGlobalError(err, "Delete Service"); }
};

// Testimonial
window.editTestimonial = async (id) => {
    try {
        editingTestimonialId = id;
        const doc = await db.collection('testimonials').doc(id).get();
        const t = doc.data();
        document.getElementById('testimonialType').value = t.type || 'text';
        document.getElementById('testimonialName').value = t.clientName || '';
        document.getElementById('testimonialCompany').value = t.company || '';
        document.getElementById('testimonialText').value = t.text || '';
        document.getElementById('testimonialRating').value = t.rating || 5;
        document.getElementById('testimonialActive').checked = t.active !== false;
        document.getElementById('testimonialVideoUrl').value = t.videoUrl || '';
        if (t.thumbnail) {
            document.getElementById('thumbnailPreview').innerHTML = `<img src="${t.thumbnail}" style="max-height:100px; border-radius:8px;">`;
        }
        document.getElementById('videoFields').style.display = t.type === 'video' ? 'block' : 'none';
        openAdminModal('testimonialModal');
    } catch (err) { handleGlobalError(err, "Load Testimonial for Edit"); }
};

window.deleteTestimonial = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
        await db.collection('testimonials').doc(id).delete();
        showToast('✅ Testimonial deleted!');
        await loadAdminTestimonials();
    } catch (err) { handleGlobalError(err, "Delete Testimonial"); }
};

// Pricing
window.editPricing = async (id) => {
    try {
        editingPricingId = id;
        const doc = await db.collection('pricing').doc(id).get();
        const p = doc.data();
        document.getElementById('pricingName').value = p.name || '';
        document.getElementById('pricingPrice').value = p.price || '';
        document.getElementById('pricingFeatures').value = p.features || '';
        document.getElementById('pricingOrder').value = p.order || 1;
        document.getElementById('pricingFeatured').checked = !!p.featured;
        document.getElementById('pricingActive').checked = p.active !== false;
        openAdminModal('pricingModal');
    } catch (err) { handleGlobalError(err, "Load Pricing for Edit"); }
};

window.deletePricing = async (id) => {
    if (!confirm('Delete this pricing plan?')) return;
    try {
        await db.collection('pricing').doc(id).delete();
        showToast('✅ Plan deleted!');
        await loadAdminPricing();
    } catch (err) { handleGlobalError(err, "Delete Pricing"); }
};

// Blog
window.editBlog = async (id) => {
    try {
        editingBlogId = id;
        const doc = await db.collection('blogs').doc(id).get();
        const b = doc.data();
        document.getElementById('blogTitle').value = b.title || '';
        document.getElementById('blogTag').value = b.tag || 'UI/UX';
        document.getElementById('blogExcerpt').value = b.excerpt || '';
        document.getElementById('blogLink').value = b.link || '';
        document.getElementById('blogReadTime').value = b.readTime || 5;
        document.getElementById('blogOrder').value = b.order || 1;
        document.getElementById('blogActive').checked = b.active !== false;
        if (b.image) {
            document.getElementById('blogImagePreview').innerHTML = `<img src="${b.image}" style="max-height:100px; border-radius:8px;">`;
        }
        openAdminModal('blogModal');
    } catch (err) { handleGlobalError(err, "Load Blog for Edit"); }
};

window.deleteBlog = async (id) => {
    if (!confirm('Delete this blog post?')) return;
    try {
        await db.collection('blogs').doc(id).delete();
        showToast('✅ Post deleted!');
        await loadAdminBlogs();
    } catch (err) { handleGlobalError(err, "Delete Blog"); }
};

window.deleteLead = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
        await db.collection('leads').doc(id).delete();
        showToast('✅ Lead deleted!');
        await loadAdminLeads();
    } catch (err) { handleGlobalError(err, "Delete Lead"); }
};

// ================================================
// UI HELPERS
// ================================================

function openAdminModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAdminModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showImagePreview(file, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview || !file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" style="max-height:100px; border-radius:8px; margin-top:10px;">`;
    };
    reader.readAsDataURL(file);
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container-custom');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container-custom';
        container.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:99999; display:flex; flex-direction:column; gap:8px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'glass-card';
    toast.style.cssText = `padding:12px 20px; border-radius:10px; color:${type === 'success' ? '#4ade80' : '#ff4646'}; border:1px solid ${type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(255,70,70,0.3)'}; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); box-shadow:0 10px 30px rgba(0,0,0,0.5); font-weight:500; min-width:200px; text-align:center; transition: all 0.3s ease;`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function exportLeads() {
    showToast('Exporting leads...', 'success');
    // Simplified CSV Export
    const table = document.querySelector('.table');
    if (!table) return;
    let csv = [];
    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        for (const col of cols) rowData.push('"' + col.innerText + '"');
        csv.push(rowData.join(','));
    }
    const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}