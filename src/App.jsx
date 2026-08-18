import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    AnimatePresence,
    LayoutGroup,
    motion,
    useMotionValue,
    useReducedMotion,
} from 'motion/react';
import { tracks } from './photoTracks.js';

const DRAG_CLICK_THRESHOLD = 8;

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

const PhotoLightbox = ({ photo, onClose, onPrevious, onNext }) => {
    const reduceMotion = useReducedMotion();
    const imageTransition = reduceMotion
        ? { duration: 0.01 }
        : {
            type: 'spring',
            stiffness: 280,
            damping: 32,
            mass: 0.8,
        };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                onPrevious();
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                onNext();
            }
        };

        document.body.classList.add('lightbox-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('lightbox-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onNext, onPrevious]);

    return (
        <motion.div
            className="photo-lightbox"
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
            <motion.img
                className="lightbox-image"
                layoutId={`photo-${photo.id}`}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                onClick={(event) => event.stopPropagation()}
                transition={imageTransition}
            />
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

const InkBleedFilter = () => (
    <svg className="ink-filter-svg" aria-hidden="true" focusable="false">
        <filter id="ink-bleed">
            <feTurbulence
                id="ink-bleed-turbulence"
                type="fractalNoise"
                baseFrequency="0.02"
                numOctaves="4"
                result="noise"
            />
            <feDisplacementMap
                id="ink-bleed-displacement"
                in="SourceGraphic"
                in2="noise"
                scale="1.2"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displacement"
            />
            <feGaussianBlur id="ink-bleed-blur" in="displacement" stdDeviation="0.4" />
        </filter>
    </svg>
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

    const navigateSelectedPhoto = (direction) => {
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
            <div className="site-wrapper">
                <main className="content thank-you-content">
                    <section className="thank-you-gallery" aria-label="Wedding photo gallery">
                        <FestivalLockup />
                        {tracks.map((track) => (
                            <GalleryTrack key={track.id} track={track} onPhotoOpen={setSelectedPhoto} />
                        ))}
                    </section>
                </main>
                <AnimatePresence>
                    {selectedPhoto && (
                        <PhotoLightbox
                            photo={selectedPhoto}
                            onClose={() => setSelectedPhoto(null)}
                            onPrevious={() => navigateSelectedPhoto(-1)}
                            onNext={() => navigateSelectedPhoto(1)}
                        />
                    )}
                </AnimatePresence>
            </div>
            <InkBleedFilter />
        </LayoutGroup>
    );
}
