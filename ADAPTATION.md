# Adaptation notes

This edition presents the authored protagonist and authored plot as a browser demo. It does not ask AI agents to play roles or improvise responses. The older EX agent experiment is unchanged in its separate folder.

## Source fidelity

The baseline is the November 17, 2026 `Art Direction/Prologue.docx`, with 584 nonempty paragraphs. All 499 bracketed dialogue and narration blocks appear in the compiled script. Source stage directions are used for staging, not shown as player-facing developer instructions. Each source block can be traced through `sourceOrdinal` and `source` on the compiled nodes. Long passages may span multiple advances.

Lohen is used throughout, as in the revised source; the older prototype's Ethan material is not reused. The source's first-person and second-person narration, character behavior, and later reveals are retained. Acting notes in speaker labels are not spoken aloud. `MC-NAME`, standalone `MC`, and `MC Pendragon` are personalized with the player's chosen name.

Six tutorial lines are adapted at source paragraphs 7, 24, 41, 47, 49, and 50: WASD, F, J, U, and I instructions are replaced by dialogue appropriate to click-through reading. The unmodified source remains in the source snapshot.

## Gameplay passages

Movement, opening the chest, extinguishing the fire, partner combat, jobs, drills, shadow battles, travel, and ritual preparation have explicit narrative bridges in `tools/build_story.py`. These preserve the specified events, not the full-game mechanics. No damage rolls, random work outcomes, statistics, or tactical simulation are implied. The source specifies two training puzzles but not their solutions; this edition advances through their completion without inventing puzzle rules.

The town introductions are all included in a walk through Elysium. Their source listing sits after the return-to-bed dialogue; that dialogue is moved after the introductions so the day's order reads coherently. The first inn shift uses the source's successful tutorial outcome. Friday is bridged to Saturday without inventing additional NPC dialogue.

After Natalie's first distress sequence, the reader can check on her or pursue the succubus. Checking shows the two supplied repeat-interaction lines in order, then rejoins the pursuit. The source's randomized repetition is not simulated. Both routes lead to the same authored continuation.

## Art and sprites

The 67 main CGs in Parts 1–5 are included as web copies. The document's reference-only environment CGs become backgrounds where they substitute for isometric scenes: the chest room, rod acquisition, vanished chest, collapsed wall, true basement, and garden. The empty-cuffs CG follows Arielle's disappearance. The two additional outdoor CGs from Part 5 serve as establishing shots during the arrival in Elysium. These are presentation choices, not added plot events.

The three sprite states use CSS alpha masks, not permanently altered image files:

- `full`: original transparent sprite.
- `obscured`: opaque gradient from black at the top to gray at the bottom; no facial or clothing detail is revealed.
- `partial`: black at the top grading to transparent at the bottom, revealing part of the original art.

Arielle is partial as the guide and full at her introduction. The first disembodied voice has no sprite. A generic scientist supplies the obscured colleague silhouette. The unnamed Carpenters boss uses an entirely obscured older-man silhouette from Arthur's art as a provisional shape only; this does not identify him as Arthur. Already-composed CGs containing people do not receive duplicate sprite layers. Viviane uses the supplied disguised sprite over backgrounds, even where its visible age differs from the prose or CG; no replacement design was invented.

Panoramas receive directional framing. Portrait reveals receive a gentle rise. Viviane's brief younger-face flicker occurs once in the specified introduction passage if the reader stays long enough. Reduce motion and the operating system's reduced-motion preference suppress it. The Black Rod refrain appears three times at each of its two source occurrences. The source's closing instruction to begin the animation/song is implemented as the video handoff; no obsolete montage from earlier drafts is added.

## Packaging

This folder contains only the standalone reader, source-derived story, web media, and authoring/test tools. It contains no model weights, API keys, Hugging Face cache, machine-local saves, or agent knowledge files. Player saves stay in browser storage or in explicitly exported JSON files. The original source art, Word document, ending movie, and old game build are unchanged.

## Revised staging

The illustration stage has a fixed height at each viewport size. Passage length scrolls within a separate reading panel, keeping controls visible and artwork stationary. Most foreground sprites are enlarged and cropped toward the waist, with matching silhouette masks. The harpy joins Arielle in the garden encounter; the prologue succubus appears when the shadows merge and at the later attack. Her preceding offscreen speech stays offscreen.

Scripted panoramic shots animate left/right inside the illustration frame, rather than changing the layout. Portrait reveals move upward from the lower figure to the face. Repeated dialogue in the same shot does not restart its camera motion. Reduced-motion settings show the final composition. Saves from the original static-reader release remain compatible.
