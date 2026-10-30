# Divyansh Tandon — Portfolio

3D Animator & Graphic Designer portfolio. React 19 + TypeScript + Vite, with Three.js for the 3D figure.

```bash
npm install
npm run dev
```

## Where things live

| What | Where |
|---|---|
| All personal content (profile, experience, skills) | `src/data/profile.ts` |
| Work cases | `src/data/projects.ts` |
| Source material (resume PDF, photos, cut-outs, depth maps) | `Divyansh Tandon Portfolio/` |
| 3D figure mesh + shading passes | `src/three/figure.ts` |
| Interactive viewports (About, Toolkit, Contact) | `src/components/Viewport3D.tsx` |
| Depth-parallax desk photo (Intro) | `src/components/ParallaxPhoto.tsx` |
| Hero video (live action, the one on the site) | `public-hero-video/new_hero_video.mp4` |
| Alternative 3D hero film scene | `scripts/hero-render/scene.ts` → `public-hero-video/hero_3d_render.mp4` |

## The 3D pipeline

## The hero

The home hero plays `new_hero_video.mp4` (Divyansh at his laptop) as sprite frames scrubbed by the cursor,
like the original template: he types while idle, glances left (frame 64) or right (112) as the cursor moves to
that side, and in the centre he looks up, takes his headphones off, waves (~200) and points down at the laptop,
holding on frame 224 while the scroll button appears. `npm run generate:sprite` rebuilds `public/hero-frames/`
from the video; beat frames live in `FRAMES` in `src/components/Hero.tsx`.

Three photos of Divyansh drive the 3D viewports: **walking** (Toolkit wireframe), **leaning** on a counter
(About final render + Contact clay, with the counter rebuilt in 3D), and **desk** (Intro "3D photo"). They
become 3D like this:

1. **Matte + depth** (done once, already in `Divyansh Tandon Portfolio/source/`): BiRefNet_lite cuts him out;
   Depth Anything V2 estimates depth. Both ran locally through transformers.js.
2. **`npm run prepare:figure`** crops the cut-out, erodes the matte fringe, blends model depth with a rounded
   silhouette "inflation", and writes `public/figure/<pose>/` (colour texture + 16-bit depth) and
   `public/photos/` (desk photo + blurred depth for the parallax shader).
3. **`src/three/figure.ts`** displaces a grid by that depth and drops triangles outside the silhouette. The same
   meshes render in three passes: *wireframe* (Toolkit), *clay* (Contact), *final render* (About). Per-pose
   staging (counter height, framing) lives in `POSES`.
4. *(Optional)* **`npm run render:hero`** renders a 3D alternative hero film headlessly (installed
   Chrome/Edge via puppeteer-core) to `public-hero-video/hero_3d_render.mp4`. To put it on the site:
   `HERO_VIDEO=hero_3d_render.mp4 HERO_HOLD_FRAME=232 npm run generate:sprite`.

To swap a photo: replace its `<pose>-cutout.png` / `<pose>-depth.png` in `Divyansh Tandon Portfolio/source/`,
then run step 2.

Open items for Divyansh are in `ITEMS_NEEDED.md`.
