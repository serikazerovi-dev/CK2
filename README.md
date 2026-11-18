# The Casanova Killer prologue

A standalone browser demo of all five parts of Act 0, adapted from the rewritten `Prologue.docx` dated November 17, 2026. The story runs entirely in the browser. It does not use an LLM, account, API key, Python runtime, or speech server.

## Play locally

Use the local server below or HTTPS hosting. Encrypted artwork uses browser Web Crypto and cannot load from a double-clicked `file://` page. Keep the folder contents together; all asset links remain relative.

For a localhost preview, with Node.js 22 or newer:

```sh
npm start
```

Open **http://127.0.0.1:4318/**. No dependency installation or build is required. The optional server supports video seeking using HTTP range requests.

## Reading controls

- Click the scene, story text, or Continue to advance. D, Space, Enter, and the right arrow also advance. A or the left arrow goes back.
- The left arrow or Back returns along your actual reading history, including choices.
- H or View art hides the text panel. Show text brings it back.
- Auto advances ordinary passages after a reading pause, but waits at chapter cards, actions, and choices.
- Chapters lets you jump to any of the five parts for demonstrations.
- History contains passages you have visited and allows returning to them.
- Saves provides three bookmarks, JSON export/import, and automatic resume on this browser.
- Settings adjusts the protagonist's name, text size, reveal speed, automatic reading pause, typeface, and motion.

Browser storage is specific to the browser and site address. Export a save to transfer it. Private browsing or disabled storage may prevent persistence; the reader reports storage failures. Saves are checked against the compiled story revision, so an incompatible edited script will not silently resume at the wrong passage.

## What is included

All 499 dialogue/narration blocks from the supplied source are represented across 546 reading beats, including both optional Natalie responses. Long paragraphs are split for readability without rewriting their wording. Six keyboard-tutorial lines have been adapted to this edition's click-through controls. The movement, combat, jobs, and two unspecified military puzzles are presented as authored narrative transitions and action prompts, rather than simulated gameplay.

The delivery includes 67 CGs and 21 sprite assets. Existing CG compositions stay unobstructed; character sprites appear over room backgrounds and in transitional scenes. The three sprite treatments are `full`, `obscured` (opaque black-to-gray gradient), and `partial` (black-to-transparent gradient). The masks follow each sprite's alpha silhouette. The opening voice has no sprite. Arielle's initial guide appearance is partial, then revealed. Unknown laboratory speakers remain obscured.

The final passage leads directly into the newest opening, v12. Chapters offers both **Opening · v12** (Act 0 default) and **Opening · v11 Director’s Cut** (alternative), without changing saved reading progress or the default. Each film plays in a clear embedded cinema area occupying most of the viewport, with Pause / Resume and End buttons beneath it. There are no native player controls or scrubbing. A Start film overlay appears only if autoplay is blocked. End stops playback and returns to the title. Both delivery copies use H.264/AAC. v12 retains 1080p24 and its full 279.58-second duration; v11 remains 1080p30 and 283.1 seconds. High-bitrate originals stay outside the published folder.

## Put it on GitHub Pages

Use **this browser demo folder as the repository root**. The older `outputs/prologue` experiment is a separate project; it contains local runtime data and is not part of this distributable.

1. Create a repository and commit this folder's contents, including `index.html`, `.nojekyll`, `assets`, `story`, and the reader scripts.
2. In the repository's **Settings → Pages**, choose **Deploy from a branch**.
3. Select your publishing branch and **/(root)**, then save.
4. Open the Pages URL GitHub supplies. A project URL such as `https://USER.github.io/REPOSITORY/` works because asset links are relative.

There is no build step and no backend to deploy. No repository was created or published by this implementation. The optimized ending file is below GitHub's normal 100 MiB per-file limit; the whole project is below the 1 GB Pages site limit. See [GitHub file limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) and [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Edit the story and art

- `story/source-paragraphs.json` is the extracted source snapshot; `source-info.json` records its document hash.
- `tools/build_story.py` contains the explicit scene map, speaker rules, gameplay adaptations, and six dialogue substitutions. Its paragraph indices refer to this source snapshot. If paragraphs are inserted or reordered in Word, update the staging map before recompiling.
- Run `python tools/build_story.py` to rebuild from the included source snapshot. No Python packages are needed for this step.
- To import a revised Word document, run `python tools/build_story.py --docx "PATH/Prologue.docx"`, then review the staging map and coverage checks. This updates the source snapshot and compiled story.
- `story/story.json` is the readable compiled script. `story/story.js` contains the same data for the browser, for hosted browser playback. Change the compiler rather than editing just one generated file.
- `story/coverage.json` tracks every extracted dialogue block and its source paragraph. Each reading beat carries its source paragraph and, where applicable, dialogue ordinal.
- `assets/manifest.json` identifies original art files relative to the Art Direction directory. The sources remain untouched.
- For art rebuilding, use the private-art workflow below. Do not place unpacked images in the published folder.
- To replace the default ending, put the replacement at `assets/video/prologue-ending-v12.mp4`. Keep v11 for the alternative opening. Opening labels and the default ending are configured in `tools/build_story.py`; rebuild the story after changing them. Prefer H.264 video with AAC audio and web-friendly MP4 fast-start metadata. Keep the repository file under 100 MiB, or change the ending beat to a separately hosted media URL.

See **ADAPTATION.md** for the deliberate changes from the action-game script.

## Validate

```sh
npm test
```

Tests verify all source dialogue is covered, unchanged wording outside the six recorded tutorial edits, asset paths, anonymous reveals, choice/backtracking behavior, save validation, and Git file-size limits. Browser checks cover reading, the three sprite styles, phone layout, saves, chapter navigation, the optional detour, and the ending film. These checks do not replace an editorial read-through or an unfamiliar reader's pacing feedback.

Concealed sprites are shipped as pre-rendered images. After changing sprite art or visibility assignments, run `python tools/prepare_sprite_variants.py --images "PRIVATE_ART"`, then repack (Pillow required). The reader decodes and caches upcoming variants, hides outdated characters immediately, and commits the complete next cast together. Late loads from skipped passages cannot overwrite the current cast.

## Reading layout

Desktop uses a large illustration area on the left and a reading panel on the right. A faded excerpt of the previous visited passage appears above the current text; select it to step back along your actual reading history, including choices. Long current passages scroll inside the reading panel while navigation stays visible. Narrow screens stack the artwork above the same reading controls and previous-passage preview.

## Encrypted image delivery

CGs and sprites (including concealed variants) are shipped in `assets/packs/art.bin`, authenticated with AES-256-GCM. The reader loads the approximately 22 MB pack once per page load, decrypts images to temporary Blob URLs in memory, then uses its existing sprite decoding and atomic presentation. A loading screen reports preparation progress; failures leave a retry message rather than a broken reader. The video remains a normal streaming MP4.

This deters casual folder extraction, not determined copying: the browser necessarily receives the key, and decoded images and screenshots can still be captured. Story text is not encrypted.

Keep private WebP copies in a separate directory containing `cg/` and `sprites/`, outside this site and its Git repository. To rebuild:

```sh
python tools/prepare_assets.py "PATH/Art Direction" --output "PRIVATE_ART"
python tools/prepare_sprite_variants.py --images "PRIVATE_ART"
node tools/pack-assets.mjs "PRIVATE_ART"
npm test
```

Publish the regenerated `asset-index.js` and `assets/packs/` together. The test suite authenticates all packed images, checks their original hashes, rejects tampered ciphertext, and ensures no unpacked image copies remain in the site. Previously uploaded raw assets must also be removed from repository history if they were already committed; changing the current files alone does not remove old copies.
