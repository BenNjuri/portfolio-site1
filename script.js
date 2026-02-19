/**
 * BrightSmile Dental — Optimized Script
 * Key optimizations:
 *  - Single scroll handler via requestAnimationFrame (no jank)
 *  - Passive event listeners for scroll / touch
 *  - Debounced resize
 *  - requestAnimationFrame-based counter animation
 *  - Cached DOM references
 */

(function () {
    'use strict';

    // ── Cached DOM refs ──────────────────────────────────────────
    const navbar = document.getElementById('navbar');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const scrollTopBtn = document.getElementById('scroll-top');
    const contactForm = document.getElementById('contact-form');


    // ── Mobile Menu ──────────────────────────────────────────────
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

        // Event delegation for mobile menu links
        mobileMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') mobileMenu.classList.add('hidden');
        });
    }


    // ── Unified Scroll Handler (rAF-throttled) ───────────────────
    let ticking = false;

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const sy = window.scrollY || window.pageYOffset;

            // Navbar shadow (threshold optimization)
            const isScrolled = sy > 100;
            if (navbar.classList.contains('navbar-scrolled') !== isScrolled) {
                navbar.classList.toggle('navbar-scrolled', isScrolled);
            }

            // Scroll-to-top button
            const show = sy > 300;
            scrollTopBtn.classList.toggle('opacity-0', !show);
            scrollTopBtn.classList.toggle('pointer-events-none', !show);
            scrollTopBtn.classList.toggle('opacity-100', show);

            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ── Counter Animation (rAF-based) ────────────────────────────
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        const duration = 2000;
        let start = null;

        function step(ts) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const val = Math.floor(progress * target);
            el.textContent = val.toLocaleString() + (target >= 10000 && progress >= 1 ? '+' : '');
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    // ── Intersection Observers ───────────────────────────────────
    // Counters
    const counterObs = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                obs.unobserve(entry.target);          // fire once
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(c => counterObs.observe(c));

    // Fade-in
    const fadeObs = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                obs.unobserve(entry.target);           // fire once
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => fadeObs.observe(el));

    // ── Contact Form Validation & Success Screen ────────────────
    const formFields = [
        { id: 'contact-name', label: 'Full Name', type: 'text' },
        { id: 'contact-email', label: 'Email Address', type: 'email' },
        { id: 'contact-phone', label: 'Phone Number', type: 'tel' },
        { id: 'contact-message', label: 'Message', type: 'textarea' }
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[\d\s()-]{7,}$/;

    // Create error spans for each field
    formFields.forEach(({ id }) => {
        const field = document.getElementById(id);
        if (!field) return;
        const errSpan = document.createElement('span');
        errSpan.className = 'field-error';
        errSpan.id = id + '-error';
        field.parentElement.appendChild(errSpan);

        // Clear error on input
        field.addEventListener('input', () => {
            clearFieldError(field, errSpan);
        });
    });

    function setFieldError(field, errSpan, message) {
        field.classList.add('field-invalid');
        errSpan.textContent = message;
        errSpan.classList.add('show');
    }

    function clearFieldError(field, errSpan) {
        field.classList.remove('field-invalid');
        errSpan.textContent = '';
        errSpan.classList.remove('show');
    }

    function validateForm() {
        let isValid = true;
        let firstInvalid = null;

        formFields.forEach(({ id, label, type }) => {
            const field = document.getElementById(id);
            const errSpan = document.getElementById(id + '-error');
            if (!field || !errSpan) return;

            const value = field.value.trim();

            if (!value) {
                setFieldError(field, errSpan, `Please fill in ${label}`);
                isValid = false;
                if (!firstInvalid) firstInvalid = field;
            } else if (type === 'email' && !emailRegex.test(value)) {
                setFieldError(field, errSpan, 'Please enter a valid email address');
                isValid = false;
                if (!firstInvalid) firstInvalid = field;
            } else if (type === 'tel' && !phoneRegex.test(value)) {
                setFieldError(field, errSpan, 'Please enter a valid phone number');
                isValid = false;
                if (!firstInvalid) firstInvalid = field;
            } else {
                clearFieldError(field, errSpan);
            }
        });

        if (firstInvalid) {
            firstInvalid.focus();
        }

        return isValid;
    }

    // Build success screen (hidden initially, injected into the form's parent)
    if (contactForm) {
        const formWrapper = contactForm.parentElement;

        const successScreen = document.createElement('div');
        successScreen.id = 'contact-success';
        successScreen.className = 'contact-success-screen';
        successScreen.innerHTML = `
            <div class="success-screen-inner">
                <div class="success-icon-ring">
                    <i class="fas fa-check"></i>
                </div>
                <h3 class="font-outfit font-bold text-3xl mt-6 mb-3" style="color:#1e293b;">Message Sent!</h3>
                <p class="text-lg" style="color:#64748b;">We'll get back to you shortly</p>
                <button id="contact-back-btn" class="btn-primary mt-8" type="button" style="justify-content:center;">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Back
                </button>
            </div>
        `;
        formWrapper.appendChild(successScreen);

        const backBtn = document.getElementById('contact-back-btn');

        /**
         * ── Google Forms Bridge ─────────────────────────────────────
         * This section allows you to collect data in a Google Sheet.
         * 1. Create a Google Form with matching fields.
         * 2. Get the form ID from the URL.
         * 3. Get entry IDs by inspecting the form (e.g., "entry.12345678").
         */
        const GOOGLE_FORM_CONFIG = {
            contact: {
                action: "https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse",
                entries: {
                    name: "entry.1111111",    // Replace with your entry IDs
                    email: "entry.2222222",
                    phone: "entry.3333333",
                    service: "entry.4444444",
                    message: "entry.5555555"
                }
            }
        };

        async function submitToGoogleForm(type, formData) {
            const config = GOOGLE_FORM_CONFIG[type];
            if (!config || config.action.includes("YOUR_FORM_ID")) {
                console.warn(`Google Form for ${type} is not configured.`);
                return;
            }

            const params = new URLSearchParams();
            for (const [key, value] of formData.entries()) {
                if (config.entries[key]) {
                    params.append(config.entries[key], value);
                }
            }

            try {
                await fetch(config.action, {
                    method: "POST",
                    mode: "no-cors",
                    body: params,
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                });
                console.log(`${type} - Sent to Google Forms`);
            } catch (err) {
                console.error("Submission error:", err);
            }
        }

        // Form submit
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateForm()) return;

            const formData = new FormData(contactForm);
            submitToGoogleForm('contact', formData);

            // Transition: form out → success in
            contactForm.classList.add('form-exit');
            setTimeout(() => {
                contactForm.style.display = 'none';
                contactForm.classList.remove('form-exit');
                successScreen.style.display = 'flex';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => successScreen.classList.add('show'));
                });
            }, 400);
        });

        // Back button: success out → form in (reset)
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                successScreen.classList.remove('show');
                setTimeout(() => {
                    successScreen.style.display = 'none';
                    contactForm.reset();
                    formFields.forEach(({ id }) => {
                        const field = document.getElementById(id);
                        const errSpan = document.getElementById(id + '-error');
                        if (field && errSpan) clearFieldError(field, errSpan);
                    });
                    contactForm.style.display = '';
                    requestAnimationFrame(() => {
                        contactForm.classList.add('form-enter');
                        setTimeout(() => contactForm.classList.remove('form-enter'), 500);
                    });
                }, 400);
            });
        }
    }





    // ── Smooth Scroll (event delegation) ─────────────────────────
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
    });

    // ── Generic Carousel Class ───────────────────────────────────
    class Carousel {
        constructor(options) {
            this.track = document.getElementById(options.trackId);
            if (!this.track) return;

            this.prevBtn = document.getElementById(options.prevId);
            this.nextBtn = document.getElementById(options.nextId);
            this.indicators = document.getElementById(options.indicatorsId);
            this.visibleCount = options.visibleCount || (() => 1);
            this.autoPlay = options.autoPlay !== undefined ? options.autoPlay : true;

            this.slides = this.track.querySelectorAll('.carousel-slide, .testimonial-slide');
            this.idx = 0;
            this.total = this.slides.length;
            this.timer = null;

            // Accessibility: Live region
            this.track.setAttribute('aria-live', 'polite');
            this.track.setAttribute('role', 'list');
            this.slides.forEach(s => s.setAttribute('role', 'listitem'));

            this._init();
        }

        _init() {
            if (this.indicators) this._createDots();
            if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
            if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

            // Touch
            let sx = 0, cx = 0, dragging = false;
            this.track.addEventListener('touchstart', e => {
                sx = e.touches[0].clientX; dragging = true; this._stop();
            }, { passive: true });
            this.track.addEventListener('touchmove', e => {
                if (dragging) cx = e.touches[0].clientX;
            }, { passive: true });
            this.track.addEventListener('touchend', () => {
                if (!dragging) return;
                const diff = sx - cx;
                if (Math.abs(diff) > 50) diff > 0 ? this.next() : this.prev();
                dragging = false; if (this.autoPlay) this._play();
            });

            // Pause on hover
            const parent = this.track.parentElement;
            parent.addEventListener('mouseenter', () => this._stop());
            parent.addEventListener('mouseleave', () => { if (this.autoPlay) this._play(); });

            // Debounced resize
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => this._move(), 150);
            });

            if (this.autoPlay) this._play();
            this._move();
        }

        _createDots() {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < this.total; i++) {
                const d = document.createElement('button');
                d.className = 'w-2 h-2 rounded-full bg-gray-300 transition-all duration-300 hover:bg-dental-blue-500';
                d.setAttribute('aria-label', `Go to slide ${i + 1}`);
                d.addEventListener('click', () => this.go(i));
                frag.appendChild(d);
            }
            this.indicators.appendChild(frag);
            this._dots();
        }

        _dots() {
            if (!this.indicators) return;
            const btns = this.indicators.children;
            for (let i = 0; i < btns.length; i++) {
                btns[i].className = i === this.idx
                    ? 'w-8 h-2 rounded-full bg-dental-blue-600 transition-all duration-300'
                    : 'w-2 h-2 rounded-full bg-gray-300 transition-all duration-300 hover:bg-dental-blue-500';
            }
        }

        _move() {
            const visible = this.visibleCount();
            const pct = 100 / visible;
            this.track.style.transform = `translateX(-${this.idx * pct}%)`;
        }

        next() {
            const visible = this.visibleCount();
            const maxIdx = this.total - visible;

            if (this.idx >= maxIdx) {
                this.idx = 0;
            } else {
                this.idx++;
            }

            this._move();
            this._dots();
        }

        prev() {
            const visible = this.visibleCount();
            const maxIdx = this.total - visible;

            if (this.idx <= 0) {
                this.idx = maxIdx;
            } else {
                this.idx--;
            }

            this._move();
            this._dots();
        }

        go(i) {
            const visible = this.visibleCount();
            const maxIdx = this.total - visible;
            this.idx = Math.min(i, maxIdx);
            this._move();
            this._dots();
        }

        _play() { this._stop(); this.timer = setInterval(() => this.next(), 5000); }
        _stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
    }

    // Initialize individual carousels
    new Carousel({
        trackId: 'hero-carousel-track',
        prevId: 'hero-prev',
        nextId: 'hero-next',
        indicatorsId: 'hero-indicators'
    });

    new Carousel({
        trackId: 'about-carousel-track',
        prevId: 'about-prev',
        nextId: 'about-next',
        indicatorsId: 'about-indicators'
    });

    new Carousel({
        trackId: 'testimonials-track',
        prevId: 'prev-testimonial',
        nextId: 'next-testimonial',
        indicatorsId: 'testimonial-indicators',
        visibleCount: () => {
            const w = window.innerWidth;
            return w >= 1024 ? 3 : w >= 768 ? 2 : 1;
        }
    });

    // Services page carousels
    const serviceCarousels = ['gen', 'cos', 'imp', 'ortho', 'root', 'ped'];
    serviceCarousels.forEach(id => {
        new Carousel({
            trackId: `${id}-carousel-track`,
            prevId: `${id}-prev`,
            nextId: `${id}-next`,
            indicatorsId: `${id}-indicators`,
            autoPlay: false // Prefer manual control for details
        });
    });

    // ── Placeholder Images ───────────────────────────────────────
    function genPlaceholder(id, w, h, text) {
        const img = document.getElementById(id);
        if (!img) return;
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#667eea');
        g.addColorStop(1, '#764ba2');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, h / 2);
        img.src = c.toDataURL('image/webp', 0.8);
    }

    function generateAll() {
    }

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => generateAll());
    } else {
        setTimeout(generateAll, 200);
    }
})();

