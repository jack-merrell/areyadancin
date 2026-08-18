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
const preloadedLightboxImages = new Set();

const preloadLightboxImage = (photo) => {
    if (!photo || preloadedLightboxImages.has(photo.src)) return;

    preloadedLightboxImages.add(photo.src);
    const image = new Image();
    image.decoding = 'async';
    image.src = photo.src;
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

const GalleryTrack = ({ track, onPhotoOpen }) => {
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
                                src={photo.src}
                                alt={photo.alt}
                                draggable="false"
                                loading={track.id === '01' && photo.index < 10 ? 'eager' : 'lazy'}
                                width={photo.width}
                                height={photo.height}
                            />
                        </button>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

const PhotoLightbox = ({ photo, photos, photoIndex, useSharedLayout, onClose, onPrevious, onNext }) => {
    const lightboxRef = useRef(null);
    const isAnimatingRef = useRef(false);
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
    const previousPhoto = photos[(photoIndex - 1 + photos.length) % photos.length];
    const nextPhoto = photos[(photoIndex + 1) % photos.length];

    useEffect(() => {
        preloadLightboxImage(previousPhoto);
        preloadLightboxImage(nextPhoto);
    }, [nextPhoto, previousPhoto]);

    const navigateWithSlide = useCallback((direction, dragOffset = 0) => {
        if (photos.length < 2) {
            controls.start({ x: 0, transition: slideTransition });
            return;
        }

        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const slideWidth = lightboxRef.current?.clientWidth ?? window.innerWidth;
        const startX = direction > 0 ? slideWidth + dragOffset : -slideWidth + dragOffset;

        controls.set({ x: startX });

        flushSync(() => {
            if (direction > 0) onNext();
            if (direction < 0) onPrevious();
        });

        controls.start({ x: 0, transition: slideTransition }).finally(() => {
            isAnimatingRef.current = false;
        });
    }, [controls, onNext, onPrevious, photos.length, slideTransition]);

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
            <button className="lightbox-close" type="button" onClick={onClose} aria-label="Close photo" title="Close photo">
                X
            </button>
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
                    <div className="lightbox-slide" key={`${slide.position}-${slide.photo.id}`}>
                        <motion.img
                            className="lightbox-image"
                            layoutId={useSharedLayout && slide.position === 'current' ? `photo-${slide.photo.id}` : undefined}
                            src={slide.photo.src}
                            alt={slide.photo.alt}
                            width={slide.photo.width}
                            height={slide.photo.height}
                            draggable="false"
                            loading="eager"
                            onClick={(event) => event.stopPropagation()}
                            transition={imageTransition}
                        />
                    </div>
                ))}
            </motion.div>
        </motion.div>
    );
};

const FestivalLockup = () => (
    <header className="festival-lockup" aria-label="Yorkshire Wedding Festival">
        <img className="festival-couple-mark" src="/lou-jack.svg" alt="Lou & Jack" />
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

    const openPhoto = (photo) => {
        setHasLightboxNavigated(false);
        setSelectedPhoto(photo);
    };

    const closePhoto = () => {
        setSelectedPhoto(null);
        setHasLightboxNavigated(false);
    };

    const navigateSelectedPhoto = (direction) => {
        setHasLightboxNavigated(true);
        setSelectedPhoto((currentPhoto) => {
            const selectedPhotoContext = getSelectedPhotoContext(currentPhoto);
            if (!selectedPhotoContext) return currentPhoto;

            const { track, photoIndex } = selectedPhotoContext;
            const nextIndex = (photoIndex + direction + track.photos.length) % track.photos.length;
            return track.photos[nextIndex];
        });
    };

    return (
        <LayoutGroup>
            <div className="site-wrapper thank-you-wrapper">
                <main className="content thank-you-content">
                    <section className="thank-you-gallery" aria-label="Wedding photo gallery">
                        <FestivalLockup />
                        {tracks.map((track) => (
                            <GalleryTrack key={track.id} track={track} onPhotoOpen={openPhoto} />
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
                        />
                    )}
                </AnimatePresence>
            </div>
        </LayoutGroup>
    );
}
