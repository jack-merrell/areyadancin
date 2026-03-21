# Jack & Lou Wedding Site

Static multi-page wedding website for Jack and Lou's Yorkshire wedding celebration on July 25, 2026.

## Overview

This project is a Vite-powered microsite with three pages:

- `index.html`: main invitation and event overview
- `info.html`: travel, hotel, and FAQ details
- `gifts.html`: new home fund / gift information

The site uses a shared stylesheet and a single JavaScript entry for interactive effects including:

- reveal-on-scroll sections
- parallax illustration layers
- animated fireworks
- draggable photo gallery with momentum
- hidden `lil-gui` controls for tuning visuals during development

## Tech Stack

- Vite
- Plain HTML, CSS, and JavaScript
- Vercel for deployment

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

Preview deploy:

```bash
npm run deploy
```

Production deploy:

```bash
npm run deploy:prod
```

Vercel behavior is configured in `vercel.json`.

## Project Structure

```text
.
|-- index.html
|-- info.html
|-- gifts.html
|-- main.js
|-- style.css
|-- public/
|   |-- fonts/
|   |-- fund/
|   |-- wedding-*.jpg
|   |-- one-fine-couple.mp4
|   |-- back.png
|   |-- front.png
|   `-- ...
|-- vite.config.js
`-- vercel.json
```

## Important Files

- `main.js`: all interactive behavior and animation logic
- `style.css`: global styling, layout, typography, and responsive rules
- `vite.config.js`: multi-page Vite build configuration
- `public/`: static assets, custom fonts, images, and video

## Notes

- The homepage includes external links for Spotify, Google Maps, calendar invite, RSVP form, and Vimeo.
- A hidden debug GUI is included via `lil-gui`; press `c` on the homepage to toggle it.
- This is a static site with no backend or CMS.
