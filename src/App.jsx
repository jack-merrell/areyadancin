import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    AnimatePresence,
    LayoutGroup,
    motion,
    useAnimationControls,
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
        viewBox: '0 0 367.339 367.34',
        d: 'M337.591,0.932c-13.464,6.12-26.315,12.852-39.168,20.196c-11.628,6.12-25.704,12.24-35.496,21.42c-5.508,4.896,0,15.3,7.344,12.852c0,0,0.612,0,0.612-0.612c1.836,1.224,3.061,2.448,4.896,4.284c0,0.612,0.611,1.836,0.611,2.448c0.612,1.224,1.836,2.448,3.061,3.672c-17.748,33.048-34.272,66.096-55.08,96.696c-6.12,9.18-12.853,17.748-20.808,25.704c-19.584-31.212-51.409-67.32-89.965-60.588c-50.796,9.18-23.256,63.647,3.06,82.008c31.212,22.644,58.14,21.42,85.068,0c12.24,20.808,20.809,44.063,19.584,66.708c-1.836,54.468-50.796,63.647-91.8,49.571c6.12-15.912,7.956-34.271,4.284-50.184c-6.12-28.764-50.184-54.468-75.888-34.272c-25.092,20.196,22.032,71.604,37.332,82.009c4.284,3.06,9.18,6.119,14.076,8.567c-0.612,0.612-0.612,1.225-1.224,1.836c-28.152,44.064-65.484,6.12-82.62-25.092c-2.448-4.896-9.18-0.612-7.344,4.284c14.076,32.436,42.84,70.38,81.396,48.348c9.18-5.508,17.136-13.464,22.644-23.256c33.66,13.464,72.829,13.464,97.308-17.136c29.376-36.72,11.017-84.456-8.567-119.952c0.611-0.612,0.611-0.612,1.224-1.224c34.884-33.66,56.304-81.396,78.336-124.236c4.284,3.06,9.181,6.12,13.464,9.18c3.061,1.836,7.345,1.224,9.792-1.224c17.748-20.808,31.212-45.9,35.496-73.44C351.055,2.768,344.324-2.128,337.591,0.932z M178.471,207.787c-23.256,13.464-46.512-3.06-63.648-18.972c-22.644-20.808-16.524-54.468,18.36-47.735c17.748,3.672,31.824,19.584,43.452,32.436c6.12,6.732,12.241,14.687,17.749,23.255C189.488,201.056,183.979,204.728,178.471,207.787z M116.047,319.171C116.047,319.171,115.435,319.171,116.047,319.171c-16.524-8.567-28.764-20.808-38.556-36.107c-4.284-6.732-7.956-14.076-9.792-22.032c-6.12-20.808,26.928-10.404,35.496-6.12C126.451,267.764,124.615,297.14,116.047,319.171z M306.379,67.028c-0.612,0-0.612-0.612-1.224-0.612c0-1.836-1.225-3.672-3.672-4.896c-4.284-1.836-8.568-4.284-12.853-6.732c-1.836-1.224-5.508-4.896-5.508-3.672c0-0.612-0.612-1.224-1.224-1.224c6.731-3.672,13.464-8.568,20.195-12.24c8.568-4.896,17.748-9.792,26.929-14.688C324.74,38.264,316.784,53.564,306.379,67.028z',
    },
    curved: {
        viewBox: '0 0 352.2 352.2',
        d: 'M348.232,100.282c-13.464-32.436-35.496-60.588-45.9-94.86c-1.836-5.508-11.016-7.956-13.464-1.836c-14.688,34.272-36.72,65.484-47.124,101.592c-1.836,6.732,7.344,13.464,12.24,7.344c7.344-9.18,15.912-16.524,24.479-25.092c-1.224,52.632,0,105.264-9.18,157.284c-4.896,28.152-11.628,59.977-31.824,81.396c-24.479,25.704-55.08,2.448-68.544-21.42c-11.628-20.809-31.823-110.772-72.215-79.561c-23.868,18.36-29.988,43.452-37.332,70.992c-1.836,7.956-4.896,15.3-8.568,22.032c-14.076,26.316-32.436-16.524-33.048-26.928c-1.224-20.809,4.896-42.229,9.792-62.424c1.836-6.12-7.344-8.568-9.792-2.448c-11.016,28.764-26.316,77.724,0,102.815c23.256,21.42,42.84,7.345,52.02-17.748c6.12-16.523,29.376-108.323,56.304-65.483c17.748,28.151,22.644,61.812,44.064,88.128c15.3,18.359,42.84,22.644,64.26,13.464c25.704-11.628,36.72-45.9,43.452-70.38c16.523-61.2,16.523-127.296,14.688-190.332c14.688,9.792,31.212,18.972,47.736,25.092C347.008,113.746,350.681,105.178,348.232,100.282z M268.672,78.25c7.956-17.136,17.748-34.272,26.316-51.408c9.18,21.42,20.808,40.392,31.824,61.2c-12.853-7.956-25.092-17.136-39.168-18.972c-3.061-0.612-5.509,1.224-6.732,3.672C276.628,73.354,272.345,75.19,268.672,78.25z',
    },
};

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

const GalleryTrack = ({ track, trackIndex, onPhotoOpen }) => {
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const pointerStartRef = useRef({ x: 0, y: 0 });
    const x = useMotionValue(0);
    const bounds = useDragBounds(viewportRef, trackRef);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        const currentX = x.get();
        if (currentX < bounds.left) x.set(bounds.left);
        if (currentX > bounds.right) x.set(bounds.right);
    }, [bounds.left, bounds.right, x]);

    const dragTransition = useMemo(() => ({
        power: reduceMotion ? 0 : 0.32,
        timeConstant: reduceMotion ? 0 : 420,
        bounceStiffness: 420,
        bounceDamping: 34,
    }), [reduceMotion]);

    return (
        <section className="gallery-track-section" aria-labelledby={`${track.id}-title`}>
            <div className="track-label">
                <p className="track-act">{track.act}</p>
                <h2 id={`${track.id}-title`}>{track.title}</h2>
            </div>

            <div className="track-viewport" ref={viewportRef}>
                <motion.div
                    className="track-settle"
                    initial={reduceMotion ? false : { x: 72, opacity: 0.01 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                        duration: reduceMotion ? 0.01 : 1,
                        delay: reduceMotion ? 0 : 0.12 + (trackIndex * 0.08),
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

        document.body.classList.add('lightbox-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('lightbox-open');
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
    const reduceMotion = useReducedMotion();

    return (
        <motion.svg
            className="festival-couple-mark"
            role="img"
            aria-label="Lou & Jack"
            preserveAspectRatio="none"
            overflow="visible"
            viewBox="0 0 201 27.2187"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {coupleMarkPaths.map((letter, index) => (
                <motion.use
                    className="festival-couple-path"
                    key={letter.id}
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
            <motion.path
                d={arrow.d}
                pathLength={1}
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={reduceMotion ? { duration: 0.01 } : {
                    pathLength: {
                        duration: 1.35,
                        delay,
                        ease: [0.2, 0.85, 0.25, 1],
                    },
                    opacity: {
                        duration: 0.18,
                        delay,
                    },
                }}
            />
        </motion.svg>
    );
};

const ThanksVideoSection = () => (
    <section className="thanks-video-section" aria-labelledby="thanks-video-heading">
        <h2 className="thanks-video-heading" id="thanks-video-heading">
            <span>THANK YOU</span>
            <span>ALL FOR</span>
            <span>DANCIN'</span>
            <span>WITH US!!!</span>
        </h2>
        <div className="snaps-hint" aria-hidden="true">
            <DrawnArrow className="snaps-hint-arrow" type="swirly" delay={0.35} />
            <p className="snaps-hint-text">
                <span>SCROLL</span>
                <span>THROUGH</span>
                <span>THE SNAPS</span>
            </p>
        </div>
        <a
            className="thanks-video-link"
            href="https://vimeo.com/1224462616"
            target="_blank"
            rel="noreferrer"
            aria-label="Watch the wedding video on Vimeo"
        >
            <span className="thanks-video-card">
                <video
                    className="thanks-video-preview"
                    src="/videos/wedding-preview.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                />
            </span>
            <span className="thanks-video-cta" aria-hidden="true">
                <DrawnArrow className="watch-hint-arrow" type="curved" delay={1.15} />
                <span>WATCH</span>
                <span>THE</span>
                <span>VIDEO</span>
                <span className="thanks-video-play">
                    <span className="thanks-video-play-icon" />
                </span>
            </span>
        </a>
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
                        <ThanksVideoSection />
                        {tracks.map((track, trackIndex) => (
                            <GalleryTrack key={track.id} track={track} trackIndex={trackIndex} onPhotoOpen={openPhoto} />
                        ))}
                    </section>
                </main>
                <AnimatePresence>
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
