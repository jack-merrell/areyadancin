import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    AnimatePresence,
    LayoutGroup,
    motion,
    useAnimationControls,
    useInView,
    useMotionValue,
    useReducedMotion,
} from 'motion/react';
import { flushSync } from 'react-dom';
import { tracks } from './photoTracks.js';

const DRAG_CLICK_THRESHOLD = 8;
const LIGHTBOX_SWIPE_DISTANCE = 70;
const LIGHTBOX_SWIPE_VELOCITY = 520;
const TRACK_PREVIEW_PRELOAD_COUNT = 16;
const TRACK_PREVIEW_PRELOAD_INTERVAL = 90;
const SHARE_ORIGIN = 'https://areyadancin.com';
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const VIDEO_PREVIEW_SRC = '/videos/wedding-preview.mp4?v=20260912';
const preloadedLightboxImages = new Set();
const preloadedPreviewImages = new Set();
const coupleMarkPaths = [
    'L',
    'O',
    'U',
    'ampersand',
    'J',
    'A',
    'C',
    'K',
].map((id) => ({
    id,
    href: `/lou-jack.svg#${id}`,
}));
const arrowPaths = {
    swirly: {
        viewBox: '0 0 120 120',
        paths: [
            'M92 18 C73 28 69 49 83 56 C102 65 106 34 84 31 C49 26 35 71 62 78 C84 84 85 53 62 55 C34 58 30 89 16 106',
            'M16 106 L32 99',
            'M16 106 L22 90',
        ],
    },
};
const WATCH_ARROW_PATH = 'M5.43415 22.5769C5.29714 22.3372 4.99171 22.2539 4.75196 22.3909C4.5122 22.5279 4.4289 22.8333 4.56591 23.0731L5.00003 22.825L5.43415 22.5769ZM13 25.825L13.0415 26.3233L13 25.825ZM0.102849 3.77098C-0.0648918 3.99034 -0.0230487 4.30415 0.196308 4.47189L3.77094 7.20539C3.9903 7.37313 4.3041 7.33128 4.47184 7.11193C4.63958 6.89257 4.59774 6.57877 4.37838 6.41102L1.20093 3.98125L3.63071 0.803799C3.79845 0.584441 3.75661 0.270636 3.53725 0.102895C3.31789 -0.0648458 3.00409 -0.0230029 2.83635 0.196354L0.102849 3.77098ZM5.00003 22.825L4.56591 23.0731C5.33793 24.4241 8.06642 26.7378 13.0415 26.3233L13 25.825L12.9585 25.3267C8.33366 25.7121 5.99547 23.5592 5.43415 22.5769L5.00003 22.825ZM13 25.825L13.0415 26.3233C14.5756 26.1955 15.7127 25.9049 16.5067 25.486C17.3083 25.0632 17.799 24.4853 17.929 23.7921C18.0561 23.1139 17.8144 22.4464 17.4169 21.881C17.0168 21.3119 16.4283 20.7986 15.7573 20.396L15.5 20.8248L15.2428 21.2535C15.8218 21.6009 16.2958 22.0252 16.5988 22.4561C16.9044 22.8908 17.0064 23.2859 16.9461 23.6078C16.8886 23.9147 16.6605 24.2743 16.0402 24.6015C15.4123 24.9327 14.4245 25.2046 12.9585 25.3267L13 25.825ZM15.5 20.8248L15.7573 20.396C15.0894 19.9953 14.1074 19.6042 13.0986 19.2038C12.0691 18.7951 10.9844 18.3669 10.0419 17.8805C9.08743 17.3878 8.35178 16.8709 7.96388 16.3186C7.77663 16.052 7.67949 15.7899 7.66642 15.523C7.65336 15.2562 7.72224 14.9437 7.93415 14.5728L7.50003 14.3248L7.06591 14.0767C6.77783 14.5808 6.64357 15.0808 6.66762 15.5719C6.69166 16.0628 6.87187 16.5037 7.14556 16.8934C7.67953 17.6536 8.60013 18.2617 9.58321 18.7691C10.5782 19.2826 11.7122 19.7294 12.7296 20.1332C13.7677 20.5453 14.6607 20.9043 15.2428 21.2535L15.5 20.8248ZM7.50003 14.3248L7.93415 14.5728C8.32675 13.8858 9.20849 13.4189 10.5044 13.0717C11.7845 12.7287 13.3009 12.5415 14.8302 12.2929C16.3249 12.05 17.8377 11.7472 18.9804 11.1541C19.559 10.8537 20.0677 10.4668 20.4316 9.95258C20.7999 9.43205 21 8.80871 21 8.0748H20.5H20C20 8.61564 19.8564 9.0343 19.6153 9.37496C19.3698 9.72191 19.0035 10.0154 18.5197 10.2665C17.5373 10.7765 16.1751 11.0612 14.6698 11.3059C13.1991 11.5449 11.5905 11.7454 10.2456 12.1057C8.91657 12.4618 7.67331 13.0137 7.06591 14.0767L7.50003 14.3248ZM20.5 8.0748H21C21 6.51201 20.675 5.24913 19.8625 4.31019C19.0514 3.37295 17.8254 2.84055 16.204 2.58109C12.9907 2.06689 7.90832 2.58245 0.433945 3.57909L0.500031 4.07471L0.566116 4.57032C8.09175 3.56685 13.0093 3.08259 16.046 3.56853C17.5497 3.80914 18.5111 4.2768 19.1063 4.96457C19.7 5.65064 20 6.63772 20 8.0748H20.5Z';
const VIMEO_PLAYER_ID = 'wedding-video-player';
const VIMEO_EMBED_URL = `https://player.vimeo.com/video/1224462616?autoplay=1&title=0&byline=0&portrait=0&api=1&player_id=${VIMEO_PLAYER_ID}`;

const preloadLightboxImage = (photo) => {
    if (!photo || preloadedLightboxImages.has(photo.src)) return;

    preloadedLightboxImages.add(photo.src);
    const image = new Image();
    image.decoding = 'async';
    image.src = photo.src;
};

const preloadPreviewImage = (photo) => {
    if (!photo?.previewSrc || preloadedPreviewImages.has(photo.previewSrc)) return;

    preloadedPreviewImages.add(photo.previewSrc);
    const image = new Image();
    image.decoding = 'async';
    image.src = photo.previewSrc;
};

const canPreloadTrackPreviews = () => {
    const connection = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
    return !connection?.saveData;
};

const normalizePhotoHashPath = (hashPath) => {
    const [trackId, photoPosition] = hashPath.split('/');
    if (!trackId || !/^\d+$/.test(photoPosition)) return hashPath;

    return `${trackId.padStart(2, '0')}/${photoPosition.padStart(2, '0')}`;
};

const getPhotoHash = () => {
    try {
        const hashPath = decodeURIComponent(window.location.hash)
            .replace(/^#\/?/, '')
            .replace(/\/$/, '')
            .replace(/\.jpe?g$/i, '')
            .toLowerCase();

        return normalizePhotoHashPath(hashPath);
    } catch {
        return '';
    }
};

const getPhotoFromHash = () => {
    const hashPath = getPhotoHash();
    if (!hashPath) return null;

    for (const track of tracks) {
        const photo = track.photos.find((trackPhoto) => trackPhoto.hashPath.toLowerCase() === hashPath);
        if (photo) return photo;
    }

    return null;
};

const setPhotoHash = (photo, mode = 'push') => {
    if (!photo?.hashPath || getPhotoHash() === photo.hashPath.toLowerCase()) return;

    const url = `${window.location.pathname}${window.location.search}#${photo.hashPath}`;
    const method = mode === 'replace' ? 'replaceState' : 'pushState';
    window.history[method](null, '', url);
};

const clearPhotoHash = () => {
    if (!window.location.hash) return;

    const url = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', url);
};

const getPhotoShareUrl = (photo) => {
    const origin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? SHARE_ORIGIN
        : window.location.origin;

    return `${origin}${window.location.pathname}${window.location.search}#${photo.hashPath}`;
};

const copyTextToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
};

const useDragBounds = (viewportRef, trackRef) => {
    const [bounds, setBounds] = useState({ left: 0, right: 0 });

    useLayoutEffect(() => {
        const viewport = viewportRef.current;
        const track = trackRef.current;
        if (!viewport || !track) return undefined;

        const updateBounds = () => {
            const overflow = Math.max(0, track.scrollWidth - viewport.clientWidth);
            setBounds({ left: -overflow, right: 0 });
        };

        updateBounds();
        const observer = new ResizeObserver(updateBounds);
        observer.observe(viewport);
        observer.observe(track);
        window.addEventListener('resize', updateBounds);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateBounds);
        };
    }, [viewportRef, trackRef]);

    return bounds;
};

const useBodyScrollLock = () => {
    useEffect(() => {
        const scrollY = window.scrollY;
        const previousBodyStyles = {
            left: document.body.style.left,
            overflow: document.body.style.overflow,
            position: document.body.style.position,
            right: document.body.style.right,
            top: document.body.style.top,
            width: document.body.style.width,
        };
        const previousHtmlOverflow = document.documentElement.style.overflow;

        document.body.classList.add('lightbox-open');
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.body.classList.remove('lightbox-open');
            document.body.style.position = previousBodyStyles.position;
            document.body.style.top = previousBodyStyles.top;
            document.body.style.left = previousBodyStyles.left;
            document.body.style.right = previousBodyStyles.right;
            document.body.style.width = previousBodyStyles.width;
            document.body.style.overflow = previousBodyStyles.overflow;
            document.documentElement.style.overflow = previousHtmlOverflow;
            window.scrollTo(0, scrollY);
        };
    }, []);
};

const GalleryTrack = ({ track, trackIndex, onPhotoOpen }) => {
    const sectionRef = useRef(null);
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const pointerStartRef = useRef({ x: 0, y: 0 });
    const x = useMotionValue(0);
    const bounds = useDragBounds(viewportRef, trackRef);
    const settleControls = useAnimationControls();
    const reduceMotion = useReducedMotion();
    const isTrackInView = useInView(sectionRef, {
        amount: 0.28,
        once: true,
    });

    useEffect(() => {
        const currentX = x.get();
        if (currentX < bounds.left) x.set(bounds.left);
        if (currentX > bounds.right) x.set(bounds.right);
    }, [bounds.left, bounds.right, x]);

    useEffect(() => {
        if (reduceMotion) {
            settleControls.set({ x: 0, opacity: 1 });
            return;
        }

        if (isTrackInView) {
            settleControls.start({ x: 0, opacity: 1 });
        }
    }, [isTrackInView, reduceMotion, settleControls]);

    const dragTransition = useMemo(() => ({
        power: reduceMotion ? 0 : 0.32,
        timeConstant: reduceMotion ? 0 : 420,
        bounceStiffness: 420,
        bounceDamping: 34,
    }), [reduceMotion]);
    const handleWheel = useCallback((event) => {
        const canScrollTrack = bounds.left < bounds.right;
        const wheelDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey
            ? event.deltaX || event.deltaY
            : 0;

        if (!canScrollTrack || wheelDelta === 0) return;

        event.preventDefault();
        x.set(clamp(x.get() - wheelDelta, bounds.left, bounds.right));
    }, [bounds.left, bounds.right, x]);

    return (
        <section className="gallery-track-section" ref={sectionRef} aria-labelledby={`${track.id}-title`}>
            <div className="track-label">
                <p className="track-act">{track.act}</p>
                <h2 id={`${track.id}-title`}>{track.title}</h2>
            </div>

            <div className="track-viewport" ref={viewportRef} onWheel={handleWheel}>
                <motion.div
                    className="track-settle"
                    initial={reduceMotion ? false : { x: 72, opacity: 0 }}
                    animate={settleControls}
                    transition={{
                        duration: reduceMotion ? 0.01 : 1,
                        delay: reduceMotion ? 0 : 0.08,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <motion.div
                        className="photo-track"
                        ref={trackRef}
                        style={{ x }}
                        drag="x"
                        dragConstraints={bounds}
                        dragElastic={0.06}
                        dragMomentum={!reduceMotion}
                        dragTransition={dragTransition}
                    >
                        {track.photos.map((photo) => (
                            <button
                                className={`photo-tile photo-tile--${photo.orientation}`}
                                type="button"
                                key={photo.id}
                                onPointerDown={(event) => {
                                    pointerStartRef.current = {
                                        x: event.clientX,
                                        y: event.clientY,
                                    };
                                }}
                                onClick={(event) => {
                                    const distance = Math.hypot(
                                        event.clientX - pointerStartRef.current.x,
                                        event.clientY - pointerStartRef.current.y,
                                    );
                                    if (distance > DRAG_CLICK_THRESHOLD) return;
                                    onPhotoOpen(photo);
                                }}
                                aria-label={`Open ${photo.alt}`}
                            >
                                <motion.img
                                    layoutId={`photo-${photo.id}`}
                                    src={photo.previewSrc}
                                    alt={photo.alt}
                                    draggable="false"
                                    loading={track.id === '01' && photo.index < 10 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    width={photo.width}
                                    height={photo.height}
                                />
                            </button>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

const PhotoLightbox = ({ photo, photos, photoIndex, useSharedLayout, onClose, onPrevious, onNext, onPhotoSelect }) => {
    const lightboxRef = useRef(null);
    const activePreviewRef = useRef(null);
    const isAnimatingRef = useRef(false);
    const imagePointerStartRef = useRef({ x: 0, y: 0 });
    const shareTimeoutRef = useRef(null);
    const [shareLabel, setShareLabel] = useState('SHARE');
    const controls = useAnimationControls();
    const reduceMotion = useReducedMotion();
    const imageTransition = useMemo(() => (reduceMotion
        ? { duration: 0.01 }
        : {
            type: 'spring',
            stiffness: 280,
            damping: 32,
            mass: 0.8,
        }), [reduceMotion]);
    const slideTransition = useMemo(() => (reduceMotion
        ? { duration: 0.01 }
        : {
            type: 'tween',
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1],
        }), [reduceMotion]);
    const previousPhoto = photos[photoIndex - 1] ?? null;
    const nextPhoto = photos[photoIndex + 1] ?? null;

    useBodyScrollLock();

    useEffect(() => {
        preloadLightboxImage(previousPhoto);
        preloadLightboxImage(nextPhoto);
    }, [nextPhoto, previousPhoto]);

    useEffect(() => {
        setShareLabel('SHARE');
    }, [photo.id]);

    useEffect(() => () => {
        if (shareTimeoutRef.current) window.clearTimeout(shareTimeoutRef.current);
    }, []);

    useEffect(() => {
        activePreviewRef.current?.scrollIntoView({
            block: 'nearest',
            inline: 'center',
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
    }, [photo.id, reduceMotion]);

    const navigateWithSlide = useCallback((direction, dragOffset = 0) => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const slideWidth = lightboxRef.current?.clientWidth ?? window.innerWidth;
        const destinationIndex = photoIndex + direction;

        if (destinationIndex < 0 || destinationIndex >= photos.length) {
            const exitX = direction > 0 ? -slideWidth : slideWidth;
            controls.start({ x: exitX, transition: slideTransition }).finally(() => {
                isAnimatingRef.current = false;
                onClose();
            });
            return;
        }

        const startX = direction > 0 ? slideWidth + dragOffset : -slideWidth + dragOffset;

        controls.set({ x: startX });

        flushSync(() => {
            if (direction > 0) onNext();
            if (direction < 0) onPrevious();
        });

        controls.start({ x: 0, transition: slideTransition }).finally(() => {
            isAnimatingRef.current = false;
        });
    }, [controls, onClose, onNext, onPrevious, photoIndex, photos.length, slideTransition]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                navigateWithSlide(-1);
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                navigateWithSlide(1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [navigateWithSlide, onClose]);

    const handleDragEnd = (_, info) => {
        const swipeLeft = info.offset.x < -LIGHTBOX_SWIPE_DISTANCE || info.velocity.x < -LIGHTBOX_SWIPE_VELOCITY;
        const swipeRight = info.offset.x > LIGHTBOX_SWIPE_DISTANCE || info.velocity.x > LIGHTBOX_SWIPE_VELOCITY;

        if (swipeLeft) {
            navigateWithSlide(1, info.offset.x);
            return;
        }

        if (swipeRight) {
            navigateWithSlide(-1, info.offset.x);
            return;
        }

        controls.start({ x: 0, transition: slideTransition });
    };

    const handleShareClick = async (event) => {
        event.stopPropagation();

        await copyTextToClipboard(getPhotoShareUrl(photo));
        setShareLabel('COPIED');

        if (shareTimeoutRef.current) window.clearTimeout(shareTimeoutRef.current);
        shareTimeoutRef.current = window.setTimeout(() => {
            setShareLabel('SHARE');
        }, 1400);
    };

    return (
        <motion.div
            className="photo-lightbox"
            ref={lightboxRef}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded wedding photo"
        >
            <div className="lightbox-actions" onClick={(event) => event.stopPropagation()}>
                <button className="lightbox-action lightbox-share" type="button" onClick={handleShareClick} aria-label="Copy photo link" title="Copy photo link">
                    {shareLabel}
                </button>
                <button className="lightbox-action lightbox-close" type="button" onClick={onClose} aria-label="Close photo" title="Close photo">
                    CLOSE
                </button>
            </div>
            <motion.div
                className="lightbox-track"
                animate={controls}
                drag="x"
                dragMomentum={false}
                onDragEnd={handleDragEnd}
            >
                {[
                    { photo: previousPhoto, position: 'previous' },
                    { photo, position: 'current' },
                    { photo: nextPhoto, position: 'next' },
                ].map((slide) => (
                    <div className="lightbox-slide" key={`${slide.position}-${slide.photo?.id ?? 'edge'}`}>
                        {slide.photo && (
                            <motion.img
                                className="lightbox-image"
                                layoutId={useSharedLayout && slide.position === 'current' ? `photo-${slide.photo.id}` : undefined}
                                src={slide.photo.src}
                                alt={slide.photo.alt}
                                width={slide.photo.width}
                                height={slide.photo.height}
                                draggable="false"
                                loading="eager"
                                onPointerDown={(event) => {
                                    imagePointerStartRef.current = {
                                        x: event.clientX,
                                        y: event.clientY,
                                    };
                                }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    const distance = Math.hypot(
                                        event.clientX - imagePointerStartRef.current.x,
                                        event.clientY - imagePointerStartRef.current.y,
                                    );
                                    if (distance > DRAG_CLICK_THRESHOLD) return;
                                    navigateWithSlide(1);
                                }}
                                transition={imageTransition}
                            />
                        )}
                    </div>
                ))}
            </motion.div>
            <div className="lightbox-filmstrip" onClick={(event) => event.stopPropagation()}>
                <div className="lightbox-filmstrip-track" aria-label="Photo previews">
                    {photos.map((previewPhoto, previewIndex) => {
                        const isCurrent = previewPhoto.id === photo.id;

                        return (
                            <button
                                className={`lightbox-filmstrip-item${isCurrent ? ' is-current' : ''}`}
                                type="button"
                                key={previewPhoto.id}
                                ref={isCurrent ? activePreviewRef : null}
                                style={{ aspectRatio: `${previewPhoto.width} / ${previewPhoto.height}` }}
                                onClick={() => {
                                    if (isCurrent) return;
                                    onPhotoSelect(previewPhoto);
                                }}
                                aria-label={`Show ${previewPhoto.alt}`}
                                aria-current={isCurrent ? 'true' : undefined}
                            >
                                <img
                                    src={previewPhoto.previewSrc}
                                    alt=""
                                    width={previewPhoto.width}
                                    height={previewPhoto.height}
                                    loading={Math.abs(previewIndex - photoIndex) < 8 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    draggable="false"
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

const CoupleMark = () => {
    const [animationRun, setAnimationRun] = useState(0);
    const reduceMotion = useReducedMotion();
    const replayAnimation = () => {
        setAnimationRun((run) => run + 1);
    };
    const handleKeyDown = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        replayAnimation();
    };

    return (
        <motion.svg
            className="festival-couple-mark"
            role="button"
            tabIndex={0}
            aria-label="Replay Lou & Jack animation"
            onClick={replayAnimation}
            onKeyDown={handleKeyDown}
            preserveAspectRatio="none"
            overflow="visible"
            viewBox="0 0 201 27.2187"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {coupleMarkPaths.map((letter, index) => (
                <motion.use
                    className="festival-couple-path"
                    key={`${letter.id}-${animationRun}`}
                    href={letter.href}
                    aria-hidden="true"
                    initial={reduceMotion ? false : {
                        opacity: 0,
                        scale: 0,
                        rotate: -17,
                        y: 10,
                    }}
                    animate={reduceMotion ? { scale: 1, rotate: 0, y: 0 } : {
                        opacity: [0, 0, 1, 1, 1, 1, 1, 1],
                        scale: [0, 0.24, 1.18, 0.92, 1.07, 0.985, 1.006, 1],
                        rotate: [-17, -17, 12, -7, 3.5, -1.4, 0.35, 0],
                        y: [10, 10, -5.5, 2.2, -0.9, 0.35, -0.08, 0],
                    }}
                    transition={reduceMotion ? { duration: 0.01 } : {
                        duration: 1.08,
                        delay: index * 0.075,
                        ease: [0.16, 1, 0.3, 1],
                        times: [0, 0.08, 0.24, 0.43, 0.61, 0.77, 0.9, 1],
                    }}
                />
            ))}
        </motion.svg>
    );
};

const FestivalLockup = () => (
    <header className="festival-lockup" aria-label="Yorkshire Wedding Festival">
        <CoupleMark />
        <div className="festival-title-mark" aria-hidden="true">
            <span>YORKSHIRE</span>
            <span>WEDDING</span>
            <span>FESTIVAL</span>
        </div>
        <p className="festival-date" aria-label="25th of July 2026">
            <time dateTime="2026-07-25">
                <span className="festival-date-number">25</span><sup>th</sup> OF JULY <span className="festival-date-number">2026</span>
            </time>
        </p>
    </header>
);

const DrawnArrow = ({ className, type, delay = 0 }) => {
    const reduceMotion = useReducedMotion();
    const arrow = arrowPaths[type];

    return (
        <motion.svg
            className={`drawn-arrow ${className}`}
            viewBox={arrow.viewBox}
            aria-hidden="true"
            focusable="false"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {arrow.paths.map((path, pathIndex) => (
                <motion.path
                    d={path}
                    key={path}
                    pathLength={1}
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={reduceMotion ? { duration: 0.01 } : {
                        pathLength: {
                            duration: pathIndex === 0 ? 0.72 : 0.2,
                            delay: delay + (pathIndex === 0 ? 0 : 0.58 + (pathIndex * 0.05)),
                            ease: [0.65, 0, 0.35, 1],
                        },
                        opacity: {
                            duration: 0.08,
                            delay: delay + (pathIndex === 0 ? 0 : 0.58 + (pathIndex * 0.05)),
                        },
                    }}
                />
            ))}
        </motion.svg>
    );
};

const WatchArrow = ({ className, delay = 0 }) => {
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            className={`watch-arrow ${className}`}
            viewBox="0 0 21 27"
            aria-hidden="true"
            focusable="false"
            xmlns="http://www.w3.org/2000/svg"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : {
                duration: 0.42,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}
        >
            <path d={WATCH_ARROW_PATH} fill="currentColor" />
        </motion.svg>
    );
};

const VideoLightbox = ({ onClose }) => {
    const iframeRef = useRef(null);
    const reduceMotion = useReducedMotion();

    useBodyScrollLock();

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;

            event.preventDefault();
            onClose();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        const handleVimeoMessage = (event) => {
            if (event.origin !== 'https://player.vimeo.com') return;

            let message = event.data;

            if (typeof event.data === 'string') {
                try {
                    message = JSON.parse(event.data);
                } catch {
                    return;
                }
            }

            if (message?.event === 'ready') {
                iframeRef.current?.contentWindow?.postMessage({
                    method: 'addEventListener',
                    value: 'ended',
                }, 'https://player.vimeo.com');
            }

            if (message?.event === 'ended') {
                onClose();
            }
        };

        window.addEventListener('message', handleVimeoMessage);

        return () => {
            window.removeEventListener('message', handleVimeoMessage);
        };
    }, [onClose]);

    return (
        <motion.div
            className="video-lightbox"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.12 }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Wedding video"
        >
            <div className="lightbox-actions" onClick={(event) => event.stopPropagation()}>
                <button className="lightbox-action lightbox-close" type="button" onClick={onClose} aria-label="Close video" title="Close video">
                    CLOSE
                </button>
            </div>
            <motion.div
                className="video-lightbox-frame"
                layoutId="wedding-video"
                onClick={(event) => event.stopPropagation()}
                transition={reduceMotion ? { duration: 0.01 } : {
                    type: 'spring',
                    stiffness: 420,
                    damping: 38,
                    mass: 0.65,
                }}
            >
                <iframe
                    ref={iframeRef}
                    id={VIMEO_PLAYER_ID}
                    src={VIMEO_EMBED_URL}
                    title="Wedding video"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            </motion.div>
        </motion.div>
    );
};

const ThanksVideoSection = ({ onVideoOpen }) => (
    <section className="thanks-video-section" aria-labelledby="thanks-video-heading">
        <h2 className="thanks-video-heading" id="thanks-video-heading">
            <span>THANK YOU</span>
            <span>ALL FOR</span>
            <span>DANCIN'</span>
            <span>WITH US!!!</span>
        </h2>
        <button
            className="thanks-video-link"
            type="button"
            onClick={onVideoOpen}
            aria-label="Watch the wedding video"
        >
            <span className="snaps-hint" aria-hidden="true">
                <DrawnArrow className="snaps-hint-arrow" type="swirly" delay={0.25} />
                <span className="snaps-hint-text">
                    <span>SCROLL</span>
                    <span>THROUGH</span>
                    <span>THE SNAPS</span>
                </span>
            </span>
            <motion.span className="thanks-video-card" layoutId="wedding-video">
                <video
                    className="thanks-video-preview"
                    src={VIDEO_PREVIEW_SRC}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                />
            </motion.span>
            <span className="thanks-video-cta" aria-hidden="true">
                <WatchArrow className="watch-hint-arrow" delay={1.15} />
                <span>WATCH</span>
                <span>THE</span>
                <span>VIDEO</span>
                <span className="thanks-video-play">
                    <span className="thanks-video-play-icon" />
                </span>
            </span>
        </button>
    </section>
);

const getSelectedPhotoContext = (selectedPhoto) => {
    if (!selectedPhoto) return null;

    for (const track of tracks) {
        const photoIndex = track.photos.findIndex((photo) => photo.id === selectedPhoto.id);
        if (photoIndex !== -1) return { track, photoIndex };
    }

    return null;
};

export default function App() {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [hasLightboxNavigated, setHasLightboxNavigated] = useState(false);
    const selectedPhotoContext = getSelectedPhotoContext(selectedPhoto);
    const selectedPhotos = selectedPhotoContext?.track.photos ?? (selectedPhoto ? [selectedPhoto] : []);
    const selectedPhotoIndex = selectedPhotoContext?.photoIndex ?? 0;

    useEffect(() => {
        if (!canPreloadTrackPreviews()) return undefined;

        const previewPhotos = tracks.flatMap((track) => track.photos.slice(0, TRACK_PREVIEW_PRELOAD_COUNT));
        let preloadIndex = 0;
        let timeoutId;

        const preloadNext = () => {
            preloadPreviewImage(previewPhotos[preloadIndex]);
            preloadIndex += 1;

            if (preloadIndex < previewPhotos.length) {
                timeoutId = window.setTimeout(preloadNext, TRACK_PREVIEW_PRELOAD_INTERVAL);
            }
        };

        const startPreloading = () => {
            timeoutId = window.setTimeout(preloadNext, TRACK_PREVIEW_PRELOAD_INTERVAL);
        };

        if (document.readyState === 'complete') {
            startPreloading();
        } else {
            window.addEventListener('load', startPreloading, { once: true });
        }

        return () => {
            window.removeEventListener('load', startPreloading);
            window.clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        const syncPhotoFromHash = () => {
            const hashedPhoto = getPhotoFromHash();

            if (hashedPhoto) {
                setHasLightboxNavigated(true);
                setSelectedPhoto(hashedPhoto);
                return;
            }

            if (!window.location.hash) {
                setSelectedPhoto(null);
                setHasLightboxNavigated(false);
            }
        };

        syncPhotoFromHash();
        window.addEventListener('hashchange', syncPhotoFromHash);
        window.addEventListener('popstate', syncPhotoFromHash);

        return () => {
            window.removeEventListener('hashchange', syncPhotoFromHash);
            window.removeEventListener('popstate', syncPhotoFromHash);
        };
    }, []);

    const openPhoto = (photo) => {
        setHasLightboxNavigated(false);
        setPhotoHash(photo);
        setSelectedPhoto(photo);
    };

    const closePhoto = () => {
        clearPhotoHash();
        setSelectedPhoto(null);
        setHasLightboxNavigated(false);
    };

    const navigateSelectedPhoto = (direction) => {
        if (!selectedPhotoContext) return;

        const { track, photoIndex } = selectedPhotoContext;
        const nextIndex = (photoIndex + direction + track.photos.length) % track.photos.length;
        const nextPhoto = track.photos[nextIndex];

        setHasLightboxNavigated(true);
        setPhotoHash(nextPhoto);
        setSelectedPhoto(nextPhoto);
    };

    const selectLightboxPhoto = (photo) => {
        setHasLightboxNavigated(true);
        setPhotoHash(photo);
        setSelectedPhoto(photo);
    };

    return (
        <LayoutGroup>
            <div className="site-wrapper thank-you-wrapper">
                <main className="content thank-you-content">
                    <section className="thank-you-gallery" aria-label="Wedding photo gallery">
                        <FestivalLockup />
                        <ThanksVideoSection onVideoOpen={() => setIsVideoOpen(true)} />
                        {tracks.map((track, trackIndex) => (
                            <GalleryTrack key={track.id} track={track} trackIndex={trackIndex} onPhotoOpen={openPhoto} />
                        ))}
                    </section>
                </main>
                <AnimatePresence>
                    {isVideoOpen && (
                        <VideoLightbox onClose={() => setIsVideoOpen(false)} />
                    )}
                    {selectedPhoto && (
                        <PhotoLightbox
                            photo={selectedPhoto}
                            photos={selectedPhotos}
                            photoIndex={selectedPhotoIndex}
                            useSharedLayout={!hasLightboxNavigated}
                            onClose={closePhoto}
                            onPrevious={() => navigateSelectedPhoto(-1)}
                            onNext={() => navigateSelectedPhoto(1)}
                            onPhotoSelect={selectLightboxPhoto}
                        />
                    )}
                </AnimatePresence>
            </div>
        </LayoutGroup>
    );
}
