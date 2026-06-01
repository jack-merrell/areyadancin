import GUI from 'lil-gui';

window.addEventListener('DOMContentLoaded', () => {
    console.log('Wedding Web App Loaded');
    
    // Smooth reveal for sections
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Force video autoplay (especially for Safari)
    const galleryVideo = document.querySelector('.gallery-video-item video');
    if (galleryVideo) {
        // Try to play immediately
        const playPromise = galleryVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.log('Autoplay prevented, will try when visible:', err);
            });
        }

        // Also set up intersection observer for when video comes into view
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    galleryVideo.play().catch(err => console.log('Video play error:', err));
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(galleryVideo);
    }

    // Parallax Effect for Illustration
    const illustration = document.querySelector('.illustration-section');
    const illustrationFront = document.querySelector('.illustration-front');
    const illustrationBack = document.querySelector('.illustration-back');

    // Detect Safari for performance optimization
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isSafari && isIOS) {
        document.documentElement.classList.add('ios-safari');
    }
    
    // Settings for GUI - Separate Desktop and Mobile
    const settings = {
        desktop: {
            frontStart: 0,
            backStart: -50,
            frontTravel: 0,
            backTravel: 250,
        },
        mobile: {
            frontStart: 0,
            backStart: 0,
            frontTravel: 0,
            backTravel: 100,
        },
        direction: -1, // -1 for up, 1 for down
        inkBleed: {
            frequency: 1,
            scale: 2,
            softness: 0.3
        },
        parallax: {
            smoothing: 0.1,
            targetFront: 0,
            targetBack: 0,
            currentFront: 0,
            currentBack: 0
        },
        fireworks: {
            frequency: isSafari ? 6 : 5, // Slower on Safari
            particleCount: isSafari ? 15 : 20, // Fewer particles on Safari
            gravity: 0.05,
            fade: 0.96,
            minSize: 8,
            maxSize: 12,
            power: 6,
            life: isSafari ? 180 : 200 // Shorter life on Safari
        }
    };

    const gui = new GUI();
    gui.hide();

    const turb = document.getElementById('ink-bleed-turbulence');
    const disp = document.getElementById('ink-bleed-displacement');
    const blur = document.getElementById('ink-bleed-blur');

    const updateInkBleed = () => {
        if (turb) turb.setAttribute('baseFrequency', settings.inkBleed.frequency);
        if (disp) disp.setAttribute('scale', settings.inkBleed.scale);
        if (blur) blur.setAttribute('stdDeviation', settings.inkBleed.softness);
    };

    // Fireworks Canvas Setup
    const fwCanvas = document.getElementById('fireworks-canvas');
    const fwCtx = fwCanvas?.getContext('2d');
    
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * settings.fireworks.power;
            this.vx = Math.cos(angle) * velocity;
            this.vy = Math.sin(angle) * velocity;
            this.gravity = settings.fireworks.gravity;
            this.color = color;
            this.life = settings.fireworks.life; // Lifespan in frames
            this.shape = Math.random() > 0.5 ? 'square' : 'triangle';
            this.size = Math.random() * (settings.fireworks.maxSize - settings.fireworks.minSize) + settings.fireworks.minSize;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        }

        update() {
            this.vx *= 0.99;
            this.vy *= 0.99;
            this.vy += settings.fireworks.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.life -= 1;
            this.rotation += this.rotationSpeed;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            
            if (this.shape === 'square') {
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(this.size / 2, this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    let particles = [];
    const partyColors = ['#256DCF', '#FE1A1A', '#FBCD1A'];

    const triggerExplosion = (x, y) => {
        const posX = x !== undefined ? x : Math.random() * fwCanvas.width;
        const posY = y !== undefined ? y : Math.random() * (fwCanvas.height * 0.5);
        const explosionColor = partyColors[Math.floor(Math.random() * partyColors.length)];
        for (let i = 0; i < settings.fireworks.particleCount; i++) {
            particles.push(new Particle(posX, posY, explosionColor));
        }
    };

    const resizeFwCanvas = () => {
        if (!fwCanvas) return;
        fwCanvas.width = fwCanvas.offsetWidth;
        fwCanvas.height = fwCanvas.offsetHeight;
    };

    let fwInterval;
    const updateFwInterval = () => {
        clearInterval(fwInterval);
        fwInterval = setInterval(() => {
            triggerExplosion();
        }, settings.fireworks.frequency * 1000);
    };

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'c') {
            gui._hidden ? gui.show() : gui.hide();
        }
    });

    const updateStyles = () => {
        const isMobile = window.innerWidth < 768;
        const current = isMobile ? settings.mobile : settings.desktop;
        
        document.documentElement.style.setProperty('--front-start', `${current.frontStart}px`);
        document.documentElement.style.setProperty('--back-start', `${current.backStart}px`);
    };

    // Ink Bleed Folder
    const inkFolder = gui.addFolder('Ink Bleed Effect');
    inkFolder.add(settings.inkBleed, 'frequency', 0.001, 2).name('Inky Base').onChange(updateInkBleed);
    inkFolder.add(settings.inkBleed, 'scale', 0, 10).name('Bleed Scale').onChange(updateInkBleed);
    inkFolder.add(settings.inkBleed, 'softness', 0, 2).name('Ink Softness').onChange(updateInkBleed);

    // Parallax Folder
    const pFolder = gui.addFolder('Parallax Feeling');
    pFolder.add(settings.parallax, 'smoothing', 0.01, 0.3).name('Smoothing');
    pFolder.add(settings, 'direction', { 'Down (New)': 1, 'Up (Original)': -1 }).name('Direction');

    // Fireworks Folder
    const fwFolder = gui.addFolder('Fireworks');
    fwFolder.add(settings.fireworks, 'frequency', 1, 30).name('Interval (s)').onChange(updateFwInterval);
    fwFolder.add(settings.fireworks, 'particleCount', 20, 200).name('Part. Count').step(1);
    fwFolder.add(settings.fireworks, 'power', 1, 15).name('Power');
    fwFolder.add(settings.fireworks, 'gravity', 0, 0.2).name('Gravity');
    fwFolder.add(settings.fireworks, 'minSize', 1, 20).name('Min Size');
    fwFolder.add(settings.fireworks, 'maxSize', 1, 40).name('Max Size');
    fwFolder.add(settings.fireworks, 'life', 10, 600).name('Life (frames)');
    fwFolder.add({ fire: () => triggerExplosion() }, 'fire').name('Trigger Now');

    // Desktop Folder
    const dFolder = gui.addFolder('Desktop Settings');
    dFolder.add(settings.desktop, 'frontStart', -500, 500).name('Front Start').onChange(updateStyles);
    dFolder.add(settings.desktop, 'backStart', -500, 500).name('Back Start').onChange(updateStyles);
    dFolder.add(settings.desktop, 'frontTravel', -1000, 1000).name('Front Travel');
    dFolder.add(settings.desktop, 'backTravel', -1000, 1000).name('Back Travel');

    // Mobile Folder
    const mFolder = gui.addFolder('Mobile Settings');
    mFolder.add(settings.mobile, 'frontStart', -500, 500).name('Front Start').onChange(updateStyles);
    mFolder.add(settings.mobile, 'backStart', -500, 500).name('Back Start').onChange(updateStyles);
    mFolder.add(settings.mobile, 'frontTravel', -1000, 1000).name('Front Travel');
    mFolder.add(settings.mobile, 'backTravel', -1000, 1000).name('Back Travel');

    const lerp = (start, end, amt) => {
        return (1 - amt) * start + amt * end;
    };

    const updateParallaxTarget = () => {
        if (!illustration) return;

        const rect = illustration.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (rect.top < viewportHeight && rect.bottom > 0) {
            const scrolledIntoView = viewportHeight - rect.top;
            const scrollRange = viewportHeight + rect.height;
            const scrollProgress = Math.min(Math.max(scrolledIntoView / scrollRange, 0), 1);

            const isMobile = window.innerWidth < 768;
            const current = isMobile ? settings.mobile : settings.desktop;

            settings.parallax.targetFront = scrollProgress * current.frontTravel * settings.direction;
            settings.parallax.targetBack = scrollProgress * current.backTravel * settings.direction;
        }
    };

    const animate = () => {
        // Parallax
        settings.parallax.currentFront = lerp(
            settings.parallax.currentFront,
            settings.parallax.targetFront,
            settings.parallax.smoothing
        );
        settings.parallax.currentBack = lerp(
            settings.parallax.currentBack,
            settings.parallax.targetBack,
            settings.parallax.smoothing
        );

        if (illustrationFront) illustrationFront.style.transform = `translateY(${settings.parallax.currentFront}px)`;
        if (illustrationBack) illustrationBack.style.transform = `translateY(${settings.parallax.currentBack}px)`;

        // Fireworks
        if (fwCtx && particles.length > 0) {
            fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => {
                p.update();
                p.draw(fwCtx);
            });
        } else if (fwCtx && particles.length === 0) {
            // Ensure canvas is clear when last particle dies
            fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
        }

        requestAnimationFrame(animate);
    };

    if (illustration && illustrationFront && illustrationBack) {
        window.addEventListener('scroll', updateParallaxTarget);
        window.addEventListener('resize', () => {
            updateStyles();
            updateParallaxTarget();
            resizeFwCanvas();
        });
        
        resizeFwCanvas();
        updateFwInterval();
        requestAnimationFrame(animate);
    }

    // Gallery Drag & Inertia
    const gallery = document.querySelector('.photo-gallery');
    const items = document.querySelectorAll('.gallery-item');
    let isDown = false;
    let startX;
    let scrollLeft;
    let velX = 0;
    let momentumID;

    const updateRotation = (velocity) => {
        const wiggle = Math.min(Math.max(velocity * 0.3, -1.5), 1.5); // Subtler wiggle
        const bounce = Math.abs(velocity) * 0.2; // Small vertical pop
        items.forEach((item, index) => {
            const baseRotate = index % 2 === 0 ? 1.5 : -1.5;
            const yOffset = index % 2 === 0 ? bounce : -bounce;
            item.style.transform = `rotate(${baseRotate + wiggle}deg) translateY(${yOffset}px)`;
        });
    };

    const beginMomentum = () => {
        cancelAnimationFrame(momentumID);
        momentumID = requestAnimationFrame(momentumLoop);
    };

    const momentumLoop = () => {
        gallery.scrollLeft += velX;
        velX *= 0.95; // Friction
        updateRotation(velX);
        if (Math.abs(velX) > 0.1) {
            momentumID = requestAnimationFrame(momentumLoop);
        } else {
            updateRotation(0);
        }
    };

    if (gallery) {
        gallery.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - gallery.offsetLeft;
            scrollLeft = gallery.scrollLeft;
            cancelAnimationFrame(momentumID);
            velX = 0;
        });

        gallery.addEventListener('mouseleave', () => {
            isDown = false;
        });

        gallery.addEventListener('mouseup', () => {
            isDown = false;
            beginMomentum();
        });

        gallery.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - gallery.offsetLeft;
            const walk = (x - startX) * 1.5; // Scroll speed
            const prevScrollLeft = gallery.scrollLeft;
            gallery.scrollLeft = scrollLeft - walk;
            velX = gallery.scrollLeft - prevScrollLeft;
            updateRotation(velX);
        });

        // Touch support
        gallery.addEventListener('touchstart', (e) => {
            isDown = true;
            startX = e.touches[0].pageX - gallery.offsetLeft;
            scrollLeft = gallery.scrollLeft;
            cancelAnimationFrame(momentumID);
            velX = 0;
        });

        gallery.addEventListener('touchend', () => {
            isDown = false;
            beginMomentum();
        });

        gallery.addEventListener('touchmove', (e) => {
            if (!isDown) return;
            e.preventDefault(); // Stop page scroll
            const x = e.touches[0].pageX - gallery.offsetLeft;
            const walk = (x - startX) * 1.5;
            const prevScrollLeft = gallery.scrollLeft;
            gallery.scrollLeft = scrollLeft - walk;
            velX = gallery.scrollLeft - prevScrollLeft;
            updateRotation(velX);
        });
    }

    // Initialize
    updateStyles();
    updateParallaxTarget();
    // Set current to target initially to avoid jump
    settings.parallax.currentFront = settings.parallax.targetFront;
    settings.parallax.currentBack = settings.parallax.targetBack;
});
