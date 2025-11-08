const WALLET_COPY_VALUE = '5yKT7BNHUJ4GekJtEWYeVFy3RZLsYTbYUgo9sVVkbonk';

const walletButton = document.getElementById('copy-wallet');
if (walletButton) {
    let statusTimer;

    walletButton.addEventListener('click', async () => {
        const textToCopy = walletButton.dataset.copy || WALLET_COPY_VALUE;
        const fallbackCopy = () => {
            const temp = document.createElement('textarea');
            temp.value = textToCopy;
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.focus();
            temp.select();
            try {
                document.execCommand('copy');
            } finally {
                document.body.removeChild(temp);
            }
        };

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                fallbackCopy();
            }
            walletButton.classList.add('copied');
        } catch (error) {
            console.error('Clipboard error:', error);
            return;
        }

        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            walletButton.classList.remove('copied');
        }, 2500);
    });
}

const yearSpan = document.getElementById('year');
if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
}

loadArtGallery();
setupMemeGenerator();

async function loadArtGallery() {
    const grid = document.getElementById('art-grid');
    if (!grid) {
        return;
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'art-placeholder';
    placeholder.setAttribute('role', 'listitem');

    try {
        const response = await fetch('./arts/manifest.json', { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }
        const payload = await response.json();
        const items = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.items)
                ? payload.items
                : [];

        if (!items.length) {
            placeholder.textContent = 'Add your works to the arts folder and update manifest.';
            grid.replaceChildren(placeholder);
            return;
        }

        grid.replaceChildren();

        items.forEach((item, index) => {
            if (!item || !item.file) {
                return;
            }

            const card = document.createElement('article');
            card.className = 'art-card';
            card.setAttribute('role', 'listitem');

            const mediaPath = item.file;
            const extension = mediaPath.split('.').pop()?.toLowerCase() || '';
            const videoTypes = ['mp4', 'webm', 'mov', 'm4v'];
            const isVideo = item.type === 'video' || videoTypes.includes(extension);

            const mediaElement = isVideo ? document.createElement('video') : document.createElement('img');
            mediaElement.className = 'art-media';

            if (isVideo) {
                mediaElement.src = mediaPath;
                mediaElement.controls = true;
                mediaElement.loop = true;
                mediaElement.muted = true;
                mediaElement.preload = 'metadata';
                mediaElement.playsInline = true;
            } else {
                mediaElement.src = mediaPath;
                mediaElement.loading = 'lazy';
                mediaElement.alt = item.title || `Art ${index + 1}`;
            }

            card.appendChild(mediaElement);

            if (item.title || item.description) {
                const content = document.createElement('div');
                content.className = 'art-content';

                if (item.title) {
                    const title = document.createElement('h3');
                    title.textContent = item.title;
                    content.appendChild(title);
                }

                if (item.description) {
                    const description = document.createElement('p');
                    description.className = 'art-description';
                    description.textContent = item.description;
                    content.appendChild(description);
                }

                card.appendChild(content);
            }

            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Art manifest error:', error);
        placeholder.textContent = 'Failed to load collection. Check files in arts folder.';
        grid.replaceChildren(placeholder);
    }
}

function setupMemeGenerator() {
    const mediaInput = document.getElementById('media-input');
    const previewArea = document.getElementById('preview-area');
    const mediaStage = document.getElementById('media-stage');
    const placeholder = document.getElementById('media-placeholder');
    const overlay = document.getElementById('overlay');
    const opacityInput = document.getElementById('opacity');
    const sizeInput = document.getElementById('size');
    const centerButton = document.getElementById('center-button');
    const resetButton = document.getElementById('reset-button');
    const downloadButton = document.getElementById('download-button');

    if (!mediaInput || !mediaStage || !placeholder || !overlay || !opacityInput || !sizeInput) {
        return;
    }

    const DEFAULT_SIZE = 96;
    const DEFAULT_OPACITY = 100;

    let currentMedia = null;
    let isDragging = false;
    let overlayPos = { x: 50, y: 50 };

    // Update overlay position
    const updateOverlayPosition = () => {
        overlay.style.left = `${overlayPos.x}%`;
        overlay.style.top = `${overlayPos.y}%`;
    };

    // Center overlay
    const centerOverlay = () => {
        overlayPos = { x: 50, y: 50 };
        updateOverlayPosition();
    };

    // Update overlay opacity
    const updateOpacity = () => {
        const value = parseInt(opacityInput.value, 10) / 100;
        overlay.style.opacity = value;
    };

    // Update overlay size
    const updateSize = () => {
        overlay.style.fontSize = `${sizeInput.value}px`;
    };

    // Handle drag start
    const handleDragStart = (e) => {
        if (!currentMedia) return;
        e.preventDefault();
        isDragging = true;
        overlay.style.cursor = 'grabbing';
    };

    // Handle drag move
    const handleDragMove = (e) => {
        if (!isDragging || !currentMedia) return;
        e.preventDefault();
        
        const rect = mediaStage.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        
        overlayPos.x = ((clientX - rect.left) / rect.width) * 100;
        overlayPos.y = ((clientY - rect.top) / rect.height) * 100;
        
        overlayPos.x = Math.max(0, Math.min(100, overlayPos.x));
        overlayPos.y = Math.max(0, Math.min(100, overlayPos.y));
        
        updateOverlayPosition();
    };

    // Handle drag end
    const handleDragEnd = () => {
        isDragging = false;
        overlay.style.cursor = 'grab';
    };

    // Load media file
    const loadMedia = (file) => {
        if (currentMedia) {
            if (currentMedia.tagName === 'VIDEO') {
                currentMedia.pause();
            }
            currentMedia.remove();
            currentMedia = null;
        }

        const isVideo = file.type.startsWith('video/');
        const element = isVideo ? document.createElement('video') : document.createElement('img');
        
        element.style.maxWidth = '100%';
        element.style.maxHeight = '70vh';
        element.style.borderRadius = '1rem';
        element.style.display = 'block';

        if (isVideo) {
            element.controls = true;
            element.loop = true;
            element.muted = true;
            element.playsInline = true;
            element.addEventListener('loadeddata', () => {
                placeholder.style.display = 'none';
                overlay.style.display = 'block';
                centerOverlay();
            });
        } else {
            element.addEventListener('load', () => {
                placeholder.style.display = 'none';
                overlay.style.display = 'block';
                centerOverlay();
            });
        }

        element.addEventListener('error', () => {
            placeholder.textContent = 'Failed to load file';
            placeholder.style.display = 'flex';
        });

        const url = URL.createObjectURL(file);
        element.src = url;
        
        mediaStage.insertBefore(element, overlay);
        currentMedia = element;

        if (isVideo) {
            element.play().catch(() => {});
        }
    };

    // Reset everything
    const reset = () => {
        if (currentMedia) {
            if (currentMedia.tagName === 'VIDEO') {
                currentMedia.pause();
            }
            URL.revokeObjectURL(currentMedia.src);
            currentMedia.remove();
            currentMedia = null;
        }
        
        mediaInput.value = '';
        placeholder.style.display = 'flex';
        placeholder.textContent = 'Add a file to start.';
        overlay.style.display = 'none';
        
        opacityInput.value = DEFAULT_OPACITY;
        sizeInput.value = DEFAULT_SIZE;
        updateOpacity();
        updateSize();
        centerOverlay();
    };

    // Download meme
    const downloadMeme = async () => {
        if (!currentMedia) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width, height;
        if (currentMedia.tagName === 'VIDEO') {
            width = currentMedia.videoWidth;
            height = currentMedia.videoHeight;
            
            if (currentMedia.readyState < 2) {
                await new Promise((resolve) => {
                    currentMedia.addEventListener('loadeddata', resolve, { once: true });
                });
            }
        } else {
            width = currentMedia.naturalWidth;
            height = currentMedia.naturalHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(currentMedia, 0, 0, width, height);

        const fontSize = parseInt(sizeInput.value, 10);
        const opacity = parseInt(opacityInput.value, 10) / 100;
        const x = (overlayPos.x / 100) * width;
        const y = (overlayPos.y / 100) * height;

        ctx.save();
        ctx.font = `${fontSize * 2}px "Cinzel", serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = opacity;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
        ctx.shadowBlur = fontSize * 0.5;
        ctx.fillText('1%', x, y);
        ctx.restore();

        const link = document.createElement('a');
        link.download = `1percent-meme-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // Event listeners
    mediaInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            alert('Please select an image or video file');
            return;
        }
        
        loadMedia(file);
    });

    opacityInput.addEventListener('input', updateOpacity);
    sizeInput.addEventListener('input', updateSize);
    centerButton.addEventListener('click', centerOverlay);
    resetButton.addEventListener('click', reset);
    downloadButton.addEventListener('click', downloadMeme);

    // Drag events
    overlay.addEventListener('mousedown', handleDragStart);
    overlay.addEventListener('touchstart', handleDragStart);
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    // Drag and drop on preview area
    previewArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        previewArea.style.borderColor = 'var(--primary)';
    });

    previewArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        previewArea.style.borderColor = '';
    });

    previewArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        previewArea.style.borderColor = '';
        
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            alert('Please drop an image or video file');
            return;
        }
        
        loadMedia(file);
    });

    // Initialize
    overlay.style.display = 'none';
    updateOpacity();
    updateSize();
    centerOverlay();
}

// Scroll animations with Intersection Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('scroll-fade');
        observer.observe(section);
    });

    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.classList.add('scroll-fade');
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe tokenomics elements
    document.querySelectorAll('.supply-chart, .breakdown-item').forEach((el, index) => {
        el.classList.add('scroll-fade');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}
