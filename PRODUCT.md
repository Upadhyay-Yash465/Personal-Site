# Product

## Register

brand

## Users

Two audiences, weighted equally:

- **Recruiters and potential collaborators** — strangers deciding whether Yash is worth working with. They arrive cold, often on mobile, give the site under a minute on first pass, and need to read credibility *and* a distinct personality quickly without digging.
- **Curious peers and friends** — people who already know him or followed a link. They're not vetting him; they came to explore the worldbuilding, dance, music, and books, and they reward depth, easter eggs, and craft.

The site has to satisfy both: legible and trustworthy to a stranger in 30 seconds, *and* rich enough that someone who keeps scrolling keeps finding things. Nothing should be gated behind "you had to be there."

## Product Purpose

A personal portfolio for Yash Upadhyay — Industrial Engineering at UCF, dancer (KnightRaas), worldbuilder, builder. It exists to present him as one coherent person rather than a résumé: the through-line is "ink, ritual, and systems that fail" — engineering rigor and artistic obsession treated as the same instinct.

Success looks like: a stranger leaves able to describe both *what he does* and *who he is*; a friend leaves having found at least one thing they didn't expect. The site itself is evidence — its craft is part of the argument.

## Brand Personality

Three words: **intricate, deliberate, alive.**

- **Voice:** precise and a little literary. Confident without performing confidence. Honest and specific over impressive-sounding. Comfortable with the mono "terminal hand" for labels and the Fraunces serif for statements — engineer and aesthete in the same sentence.
- **Aesthetic:** biopunk ink-ritual base ("ink that bleeds, body that transforms, ritual that costs") with vivid Garba bursts scoped to the dance work. The darkness and cost theme is *texture*, not the message.
- **Emotional goal:** the visitor should feel **intrigue/depth** ("this person thinks in layers"), **awe at the craft** ("this is unusually well-made"), and **warmth** ("I'd actually want to know him") — in that blend. Not edge-for-edge's-sake; not cold.

## Anti-references

- **Dev-bro terminal portfolio** — neon-green-on-black, "I use Arch btw", matrix rain, the hacker-template look. The mono type here is a deliberate accent, never the whole identity.
- **Overdesigned award-site excess** — scroll-jacking, motion for its own sake, content buried under effects, the Awwwards reel that's unreadable. Motion serves comprehension and atmosphere; it never fights the reader.
- (Carried from cross-project bans) generic SaaS scaffolding: eyebrow kickers on every section, numbered `01/02/03` markers by reflex, identical card grids, gradient text, cream/sand minimalism.

## Design Principles

1. **The site is the proof.** Craft, restraint, and finish *are* the portfolio. Don't tell the visitor he's meticulous — make a meticulous object.
2. **Legible to a stranger, deep for a friend.** Every page must deliver its core read in seconds, then reward continued attention. Depth is layered on top of clarity, never in place of it.
3. **One person, many rooms.** Dance, music, books, worldbuilding, engineering are facets of a single instinct, not a list of hobbies. Treatment can vary per page, but the voice and system stay continuous.
4. **Theme is texture, not the message.** The biopunk/ritual/cost concept carries mood and motif — it never makes content harder to read or the person harder to like.
5. **Motion with intent.** Every animation earns its place by aiding comprehension or atmosphere, respects `prefers-reduced-motion`, and never scroll-jacks or hides content behind a transition.

## Accessibility & Inclusion

- **Target: WCAG AA.** Body text ≥4.5:1 against its background (watch the moody dark palette — `--ash-dim`/`--ash-faint` on dark surfaces are the risk); large text ≥3:1.
- Full keyboard navigation; visible focus states; the existing skip-link and ARIA (`aria-current`, `aria-expanded`, `aria-controls`, `aria-hidden`) maintained as pages grow.
- Every animation needs a `prefers-reduced-motion: reduce` alternative (crossfade or instant). The JS role-cycler and scroll-driven effects already guard for this — keep that invariant.
- Both light ("ritual paper" parchment) and dark (canonical) themes must independently pass AA.
