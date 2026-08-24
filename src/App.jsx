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
const coupleMarkLetters = [
    { character: 'L', tone: 'red' },
    { character: 'O', tone: 'red' },
    { character: 'U', tone: 'red' },
    { character: '&', tone: 'yellow', compact: true },
    { character: 'J', tone: 'blue' },
    { character: 'A', tone: 'blue' },
    { character: 'C', tone: 'blue' },
    { character: 'K', tone: 'blue' },
];

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
        <motion.div className="festival-couple-mark" role="img" aria-label="Lou & Jack">
            {coupleMarkLetters.map((letter, index) => (
                <motion.span
                    className={`festival-couple-letter festival-couple-letter-${letter.tone}${letter.compact ? ' is-compact' : ''}`}
                    key={`${letter.character}-${index}`}
                    aria-hidden="true"
                    initial={reduceMotion ? false : { scale: 0.35, rotate: -16, y: 8 }}
                    animate={reduceMotion ? { scale: 1, rotate: 0, y: 0 } : {
                        scale: [0.35, 1.45, 0.88, 1.12, 1],
                        rotate: [-16, 14, -8, 4, 0],
                        y: [8, -8, 3, -1, 0],
                    }}
                    transition={reduceMotion ? { duration: 0.01 } : {
                        duration: 0.82,
                        delay: index * 0.075,
                        ease: [0.2, 0.9, 0.2, 1],
                    }}
                >
                    {letter.character}
                </motion.span>
            ))}
        </motion.div>
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
    </header>
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
