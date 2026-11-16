# MaxWell — Rural Triage

Next.js + React + TypeScript. A triage intake for a rural clinic, built down a
full-height spinal-cord rail: six questions, a second read over the file, and one
printed record the desk keeps.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

The second read (C7) calls Mistral from a server route, so it needs a key. For a
local run, pass it for that shell only — it is never written to the repo:

```bash
MISTRAL_API_KEY=... npm run dev
```

or put it in a git-ignored `.env.local`. On Vercel it comes from the project's
environment variables (see **Production**).

| script | what it does |
| ------ | ------------ |
| `npm run dev` | Next dev server |
| `npm run build` | production build (type-checks first) |
| `npm run start` | serve the production build |
| `npm run lint` | oxlint over `src/` and `app/` |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
app/
  layout.tsx                       document shell, metadata, icons, viewport
  page.tsx                         mounts the intake on the client
  opengraph-image.tsx              the 1200×630 card, drawn with next/og
  manifest.ts                      web app manifest
  robots.ts / sitemap.ts           crawler files
  api/read/route.ts                the second read: Mistral, server side only
src/
  site.ts                          name, description, canonical URL
  App.tsx
  App.tsx                          full-height shell: rail + station router
  components/SpineStepper/
    SpineStepper.tsx               the spinal-cord rail (cord, vertebrae, labels, header)
    Gem.tsx                        the cut-stone node set into each vertebra
    layout.ts                      generated geometry — no hard-coded positions
    motion.ts                      easing + clamping used by the advance animation
    spine-stepper.css
  components/Station/
    Station.tsx                    shared chrome: station head, open question, receipt, dots
    Emergency.tsx                  the shared ambulance card (C2, C3)
    emergency.css
    icons.tsx                      shared glyphs (arrow, check, edit, intake set)
  components/Intake/
    Intake.tsx                     C1 flow: open question, answered trail, footer
    AgeGauge.tsx                   machined age dial
    Choices.tsx                    bone medallions for sex at birth / pregnancy
    Compass.tsx                    steel compass for location
    SupportPicker.tsx              glass tokens for support needs
    types.ts                       questions, answer guards, progress
    places.ts                      districts, nearest-place maths, bearings
    intake.css
  components/Symptoms/
    Symptoms.tsx                   C2 flow + red-flag branch
    BodyMap.tsx                    the body plate: seven switchable regions
    OnsetRule.tsx                  milled duration rule, four stops
    Severity.tsx                   lit column in a steel tube, 0–10
    FlagPlates.tsx                 six warning-sign plates + "none of these"
    types.ts                       areas, onsets, flags, red-flag predicate
    icons.tsx                      symptom glyphs
    symptoms.css
  components/Vitals/
    Vitals.tsx                     C3 flow, "not taken" control, emergency outcome
    Thermometer.tsx                glass thermometer + reader carriage
    PulseMonitor.tsx               ECG monitor with scrolling trace + fader
    PressureColumn.tsx             twin mercury columns, one bead each
    OxygenCell.tsx                 filled glass cell, 92% notch
    types.ts                       ranges, clamps, words, critical thresholds, receipts
    icons.tsx                      vitals glyphs
    vitals.css
  components/History/
    History.tsx                    C4 flow: conditions, daily medicines, allergies
    ConditionBank.tsx              eight toggle switches on one steel plate
    Blister.tsx                    foil blister with punched pockets
    AlertTags.tsx                  bone tags hung three to a steel rod
    types.ts                       condition / medicine / allergy sets, receipts
    icons.tsx                      history glyphs
    history.css
  components/Medicines/
    Medicines.tsx                  C5 flow: where, when, then the filed ticket + tray
    Atlas.tsx                      survey plate: OSM tiles, pins, route, pan / zoom
    Dispenser.tsx                  brass appointment tokens in a steel dispenser
    Visit.tsx                      the outpatient token the desk hands over
    Tray.tsx                       steel tray of doses + pharmacist notes
    facilities.ts                  demo nearby-hospital set, serial numbers
    mapMath.ts                     Mercator projection, tile addressing, plate fit
    types.ts                       answers, slots, the medicine plan drawn from the file
    icons.tsx                      hospital / clock / token glyphs
    medicines.css
  components/Care/
    Care.tsx                       C6 flow: follow-up, tonight, then the filed plan
    FollowUpSlips.tsx              bone return slips in a steel tray, brass tabs
    CheckIn.tsx                    three bone medallions: home, neighbour, alone
    Plan.tsx                       return stub, steel care tiles, amber warning tags
    types.ts                       follow-up dates, the suggested date, home care, warnings
    icons.tsx                      care glyphs
    care.css
  components/Read/
    SecondRead.tsx                 C7 station: the reader, the slip, the states
    useSecondRead.ts               one fetch per file, cached and retryable
    types.ts                       the file we send, the read we get, the rulebook
    server.ts                      prompt, JSON contract, safety filter (server only)
    read.css
  components/Handoff/
    Handoff.tsx                    C8 flow: the sheet, the stamp, the filed state
    Sheet.tsx                      printed record: masthead, readings, body map, code
    QrMark.tsx                     the record code, drawn as one SVG path
    qr.ts                          byte-mode QR encoder (ECC L, versions 1–5)
    types.ts                       serial, compact payload, vital bars, history chips
    icons.tsx                      record / hand / sex marks
    handoff.css
  spine-stepper-ui.svg               original artwork (reference, not rendered by the app)
```

## SpineStepper

Full-bleed rail: it takes the height of whatever contains it and lays itself out
in CSS pixels, 1:1 with its box. No card, no fixed viewBox, no fixed step count.

```tsx
<SpineStepper steps={steps} showHeader={false} />
```

`steps` is the only thing you supply — no coordinates:

```ts
{ id: 'C5', title: 'Autonomic bridge', state: 'active', progress: 0.4 }
```

**Adding or removing a step re-flows the whole column.** `layout.ts` derives the
pitch from `(height − header − gaps) / (count − 1)`, caps it at 178px so a short
column stays centred instead of stretching, derives the vertebra unit from both
the pitch and the free horizontal lane (so labels never overflow), and lowers the
label scale when the column gets dense. Below a 58px pitch the third label line
(status / progress) is dropped so rows never collide. Rotations come from a tilt
table by index, scale drifts 0.92 → 1.05 down the column, and the cord fills to
whichever node is `active`.

| prop        | type            | notes                                       |
| ----------- | --------------- | ------------------------------------------- |
| `steps`     | `SpineStep[]`   | required; any length                        |
| `title`     | `string`        | header title, default `Neural Integration`  |
| `eyebrow`   | `string`        | small caps line above the title             |
| `showHeader`| `boolean`       | default `true`; `false` gives the whole height to the column |
| `className` | `string`        | passthrough                                 |

With `showHeader={false}` the column is laid out with symmetric 96px gaps, so it
reads as a bare spine running the full height of the screen. The demo
(`App.tsx`) runs it that way.

Already-ported details kept 1:1 from `spine-stepper-ui.svg`: the `feTurbulence`
displacement on the bone, the `fractalNoise` grain with `mix-blend-mode: overlay`,
the specular and rim lights, the cord's shell and leading glow, and the drawing's
filter graph. Ids are namespaced per instance so several rails can co-exist.

## The nodes

Each node is a round-brilliant stone cut (`Gem.tsx`): eight crown facets around an
eight-facet star ring and a table, built from real polygon geometry. Every facet
takes one flat value from a dark-to-bright ice-blue ramp based on the angle its
normal makes with the key light (upper-left), with a weak environment bounce,
fire flashes in two facets, a refracted caustic under the table, a girdle rim
highlight, specular hotspot and sparkle. The stone gets its own seat shadow so it
reads as set into the bone rather than stuck on top; the active stone adds a
pulsing aura and a bloom ring. Labels, connector dots and the progress bar stay
on the original teal/cyan accent.

## Advancing

Move the `active` flag to another step and the rail animates the handover; no
imperative call, no extra prop. `SpineStepper` watches the cord's fill height and
the active index, and when both move it runs one clock over four beats
(2200 ms, plus a 200 ms tail):

1. **Gather, 180 ms** — the stone being left brightens, a ring of light draws
   itself inward over the bone, and the comet head swells at its rim.
2. **Transit, 780 ms** — the charge runs down the cord on an eased cubic, the
   fill following it. A comet head is drawn *over* the vertebrae so light spills
   across the bone, dragging an afterglow tail and a soft halo, with a small
   flicker so it reads as live current. The destination node holds an empty dark
   socket, dormant, and its bone sits at 58% opacity.
3. **Impact** — on arrival two shockwave rings expand and fade at different
   speeds, six rays spray outward across the bone, and the vertebra itself takes
   a short damped recoil, all while its opacity snaps back to full.
4. **Form, 1240 ms** — the stone assembles outside in, facet by facet: the girdle
   wall turns up against a slowly rotating dashed scaffold ring, eight crown
   facets fly in from just outside the rim on `easeOutBack` and flash white as
   each seats, then the star ring, the two fire flashes, and last the table
   dropping into the middle with its own flash. Caustic, girdle rim, specular and
   sparkle follow; a second twinkle catches, and the finished stone settles with
   one soft bounce.

The bloom down the lit cord is a horizontal gradient rather than a blurred rect:
a filtered element has to be re-rasterised every frame of an advance, and removing
it cuts the transit beat from ~21 ms to ~17 ms per frame. An absent `b8` blur, a
per-frame bone opacity tween and per-frame blurred sparks were dropped for the
same reason.

Reduced motion (`prefers-reduced-motion: reduce`) skips all of it and cuts
straight to the new state. Only an active-index change triggers it, so adding or
removing steps re-flows the column without animating. In `App.tsx`:

```tsx
// complete the current step, wake the next one
const advance = () =>
  setSteps((prev) => {
    const at = prev.findIndex((s) => s.state === 'active')
    return prev.map((s, i) =>
      i === at ? { ...s, state: 'complete' } : i === at + 1 ? { ...s, state: 'active', progress: 0 } : s,
    )
  })
```

## Intake — C1, basic details

The right-hand panel is the product: one question at a time, each answered on an
instrument rather than typed into a field. C1 asks age, sex registered at birth,
pregnancy (only when the answer is female), location, and support.

### Instruments

Every instrument is built the same way as the bone: multi-stop gradients for the
material, a `fractalNoise` grain layer on `multiply`, blurred speculars, a
contact shadow and a vignette. Nothing on this panel is a plain text field.

| question       | instrument                                                                 | gesture                                                                 |
| -------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| age            | anodised steel dial: chamfered case, turned face, engraved 0–110 scale, a recessed light channel and a knurled thumb wheel | drag around the rim; arrows ±1, PageUp/Down ±10, Home/End |
| sex at birth   | three bone discs in steel bezels, the mark cut into the face                 | tap, or arrows to move through the group                                 |
| pregnancy      | the same disc, wider                                                        | tap                                                                      |
| location       | anodised steel compass: chamfered case, turned card, engraved rose and 5° ring, a bevelled needle on a jewel pivot, glass over the lot | tap the compass for the device position, or pick a town (arrow keys walk the group) |
| support        | small glass tokens with an inlay arc along the bottom edge                   | tap any number; "Nothing to add" is a separate quiet control             |

The dial and the compass are lit as one object: a bright catch on the case's
upper-left, an inner wall dark where the light enters and lit where it lands, a
diagonal sheen across the face, fine concentric turning marks, a grain layer
whose luminance becomes alpha (so it speckles instead of washing the face out),
a window reflection with hard edges, and a two-layer cast shadow that falls
outside the case. The dial's scale stops 12° short of the top so zero and 110
never collide and the gap reads as the mechanism's end-stop.

Choosing a bone disc inks the engraved mark and lights a cyan inlay at the rim;
choosing a token lights the arc along its lower edge.

### Flow

`activeKey` is the only cursor. The open question renders on its instrument; every
answered question folds into a hairline strip of icon + value above it, and any
cell reopens its question. Tap answers (sex, pregnancy) advance after 320 ms, using
the question list *as it will exist after the answer is stored* — so choosing
`female` does open the pregnancy question. Continue jumps to the next unanswered
required question, or to the last card so Finish is one click away.

Support is optional, so it only earns a strip cell once it says something: an empty
one would claim an answered question. When the required set is complete, Finish
files C1, the rail runs its advance to C2, and the panel turns into a recap whose
last card — `C2 · Symptoms` — opens the next station.

## Symptoms — C2

C2 asks where it hurts, when it started, how bad it is, and whether anything on the
red-flag list is happening. It is built from the same four materials as C1, so the
two stations feel like one machine.

| question              | instrument                                                                 | gesture                                                        |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| where it hurts        | a body on a dark screen: etched silhouette in a steel plate, seven switchable regions with dashed contours | tap any region, or "All over"; Enter/Space when focused |
| when it started       | a milled rule with four stops and a carrier that glides between them         | tap a stop; ←/→                                                    |
| how bad right now     | a lit column in a steel tube, colour ramp from teal to rose, knurled grip    | drag or tap the tube; arrows ±1, PageUp/Down ±2, Home/End         |
| anything happening now| six ivory plates that light warm when pressed, plus a calm "none of these"   | tap; plates are real `aria-pressed` buttons                        |

The body plate powers up once with a beam that passes down the window, then settles
— a single pass that says "this is live" without a caption. Regions keep an etched
dashed contour so the segmentation is visible before anything is touched; hover
rinses them cyan, selection lights them amber with a glow, and the anatomy (ribs,
sternum, spine, pelvis) is drawn over the top so a selected region still reads as
a body rather than a patch of colour.

### Emergency branch

Any flagged answer is a hard stop. While the plates are open, a line under them
turns red and offers `108`; on Finish the recap is replaced by the ambulance card:
beacon, the line that matches the first flag, a `tel:108` action, and the nearest
facility resolved back in C1 (or "tell the operator where you are"). The rail does
not walk on to vitals — the visit ended at C2. "Review my answers" reopens the
station and puts the rail back.

`isEmergency()` is the predicate; it is one place, so a future rule (say severity 10
with chest pain) only changes there.

## Vitals — C3

C3 reads the four numbers a rural clinic takes before it decides anything:
temperature, pulse, blood pressure and oxygen. The instruments are the same machine
as C1 and C2 — dark anodised steel, glass, engraved scales — but the finding colour
is amber and the navigation colour stays teal.

| reading        | instrument                                                                                        | gesture                                                        |
| -------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| temperature    | a glass thermometer lying across the panel: silver thread, printed fever zone, a reader carriage on a rail above it | drag the tube; ←/→ ±0.1, PageUp/Down ±0.5, Home/End           |
| pulse          | a bedside ECG monitor with a scrolling beat and a milled fader below it                            | drag the fader; arrows ±1, PageUp/Down ±10, Home/End            |
| blood pressure | twin mercury columns in one steel case, each with its own bead and engraved scale                  | drag either bead; Tab moves between them; arrows ±1, PageUp/Down ±10 |
| oxygen         | a glass cell filled to the reading, with the 92% threshold cut into the glass                      | drag the fill; arrows ±1, PageUp/Down ±5, Home/End              |

The thermometer's thread and bulb turn amber above 37.5 °C, the monitor's trace and
heart turn amber above 120 bpm, the pressure bead turns amber outside 95–160, and
the oxygen cell turns amber below 92%. The ECG trace scrolls at the rate on the
fader — one beat per 60/bpm seconds — so the instrument agrees with its own number.

### Not taken

A rural clinic may have no working cuff, no oximeter, or no thermometer. Every
question has a quiet **Not taken** control that records the gap honestly instead of
inventing a number; the reason follows the instrument ("no working cuff", "no
oximeter"). A skipped reading still counts as answered, folds into the strip and the
recap as `Not taken`, and never reaches the critical thresholds.

### Critical vitals

When the file is finished, any of these ends the visit at C3: SpO₂ ≤ 91%, temperature
≥ 39.5 °C, pulse ≥ 130 or ≤ 45, systolic ≥ 180 or ≤ 90, diastolic ≥ 110. The panel
swaps to the same ambulance card C2 uses (`Station/Emergency.tsx`), with the line
listing the readings that tripped it, and the rail stays on C3. Otherwise the recap
names `C4 · History` and offers it.

## History — C4

C4 is the record, not a reading: what the body already lives with, what it takes
every day, and what it reacts to. None of it can end the visit, so there is no
emergency card here. The materials change with the question — steel switches, foil
and bone.

| question         | instrument                                                                   | gesture                                       |
| ---------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| long-term        | eight toggle switches on one steel plate, each with a lamp that lights amber   | tap or Space; "None of these" is separate     |
| daily medicines  | a foil blister of six tablets; pressing a pocket punches the dome through     | tap or Enter; "Nothing daily" is separate     |
| allergies        | bone tags hung three to a steel rod; a hung tag turns amber and shows its warning mark | tap or Space; "No allergies" is separate |

Each question is one instrument on a single plate, so the panel stays quiet. A
selection is stored, not toggled off by leaving; the quiet control is the explicit
"none" answer, and it lights when chosen. The recap names `C5 · Medicines` and
opens it.

## Medicines — C5

C5 is the part of a rural visit that happens outside the consulting room: which
facility can the patient actually reach, when can they come, and what does the
clinic hand over. It is also where **nearby hospitals** live — the feature is
built into the first question rather than a separate screen, because choosing a
hospital is the question.

| question | instrument | gesture |
| -------- | ---------- | ------- |
| where | a survey plate (real map) with numbered cut-stone pins, plus numbered facility rows | tap a row or a pin; drag / arrow keys pan; +/− zoom; Home recentres |
| when | three brass tokens in a steel dispenser | tap or Enter; the chosen token drops and keeps the light |

The step plate is a **real map, not a drawing**: OpenStreetMap raster tiles under a
dark teal chart wash, inside a machined steel frame with four screws, a scale bar
and the required `© OpenStreetMap` link. Tiles are the ground only — every label
that carries a decision (the four facilities, the route, where you are) is ours
and is drawn on top. If three tiles fail the plate falls back to a hand-inked
survey drawing, so the station still works with no network at all.

The pins are the rail's cut-stone diamonds, flattened and numbered so the map and
the list can be crossed without hunting; the amber diamond is the current choice,
and a dashed route runs from the "you" marker to it. The rows beneath are the
accessible control (a roving-tabindex radiogroup), the pins are pointer-only
duplicates — a map is not a good keyboard widget, so it does not pretend to be.

The map auto-fits the four facilities at the largest whole zoom where nothing
clips, then centres their little network rather than the patient, because the
useful question is "what is around me", not "am I in the middle". Panning and
zooming are integer tile steps; `Home` puts the patient back in the centre.

### Where the facilities come from

`facilities.ts` is a **demo gazetteer, not a live register.** The first entry is
the clinic C1's compass already named, at the distance and bearing the fix gave,
so the map agrees with the needle. The tier above it (taluk, district, mission) is
placed deterministically from the district name — a hash seeds the bearings, a
small separation pass keeps two doors from sharing a bearing, so a given village
always sees the same little network. Swapping `facilitiesFor` for a real feed
(data.gov.in health directory, or OSM `amenity=hospital` around the fix) leaves the
map, list, ticket and tray untouched.

Production notes: OSM's tile policy allows light demo traffic with attribution but
is not a free CDN for an app — self-host tiles or use a commercial provider before
this goes live. The included attribution link is mandatory either way.

### The plan

Finishing files the visit: a brass outpatient token (day, time, facility, distance,
road time, serial from the facility and slot), the two answers as receipts, and the
steel tray of what the clinic gives. The tray is derived from the file the patient
already built, so the same answers always produce the same doses:

- paracetamol when there is fever (≥ 37.5 °C) or pain (severity ≥ 4)
- the usual BP tablet when pressure is raised or already on the daily list
- the usual sugar tablet when diabetes is on file

Cautions ride under the tray: penicillin allergy, a blood thinner, SpO₂ ≤ 93,
possible pregnancy, under-12. With none of those triggers the tray shows the calm
state instead of an empty box. The filed plan opens `C6 · Care plan`.

## Care plan — C6

C6 turns the visit into something the patient carries home: when to come back,
three things to do, and the signs that mean come back now. Nothing here can end
the visit; it is the calm after triage.

| question | instrument | gesture |
| -------- | ---------- | ------- |
| when again | three bone return slips in a steel tray, brass interval tabs, an amber "suggested" pin | tap a slip; arrow keys move the choice |
| who tonight | three bone medallions — someone at home, a neighbour, no one | tap; arrow keys move |

The clinic already has a view, drawn from the file: fever ≥ 38.5 °C, pain ≥ 7,
SpO₂ ≤ 94, a child under five or a possible pregnancy suggests **two days**;
anything symptomatic suggests **a week**; an otherwise quiet file **three weeks**.
The suggestion is only a pin — the patient can take a later slip.

Finishing clips a **return stub** into the file: the date, morning OPD, the
facility chosen in C5, who is around tonight, and a rubber `RETURN` stamp in the
corner. Under it sit up to three **steel care tiles** — water, food with tablets,
salt or sugar — and three **amber warning tags** on a rod, chosen from the file's
own red flags (chest, breath, bleeding, confusion, fever) with calm fallbacks
when none fired. The check-in answer edits the stub line too: "no one tonight"
asks the desk for a call instead of pretending someone is there.

Dates are the device's local calendar, computed at render: two days, one week and
three weeks from today, with the weekday and date written the way the patient
would read them. The filed plan opens `C7 · Second read`.

## Second read — C7

C7 asks nothing. The file goes to a second reader — Mistral, server-side — and
comes back as one slip of paper on the glass of a steel reader. The station exists
so the record can be challenged once before it is signed.

| part | what it shows |
| ---- | ------------- |
| the reader | a steel housing with four screws, a lit glass bed and a sweep that crosses the sheet while the model works |
| the slip | masthead, one calm sentence, up to three possibilities, and the signs that mean come back |
| the beads | the likelihood, as one to three cut stones — the same diamond as the rail |
| the tag | `MINISTRAL 8B` when the model answered, `CLINIC RULEBOOK` when it could not |
| the note | `A second read, not a diagnosis.` |

Nothing here changes the plan. The design rule is that **the station is never
empty**: `localRead` is a deterministic clinic rulebook over the same answers, so
a missing key, a busy free tier, a timeout or an unreadable answer still leaves a
readable slip, tagged honestly, with **Try again** beside it. The read is cached
per file, so stepping back does not spend another call.

### What is sent

Only the clinical file, never an identifier or free text: age, sex, pregnancy,
town, the symptom areas/onset/severity/flags, the four readings, the history
lists, and the doses the clinic already plans. `app/api/read/route.ts` re-validates
every field and caps every list before the prompt is built.

`src/components/Read/server.ts` holds the system prompt and the contract:

```json
{"read":"one calm sentence","conditions":[{"name":"…","likelihood":"likely|possible|unlikely","why":"…"}],"watch":["…"],"concern":"calm|watch|urgent"}
```

The prompt is explicit that this is a second pair of eyes for a nurse, not a
diagnosis: it may not claim certainty, may not give a dose or a route, may not
name a medicine outside `plan.doses`, and must use words rather than numbers
because the sheet already prints the readings. The validator is a second fence:
it truncates every string, drops conditions without a name and a reason, and
removes any line that contains a strength (`650 mg`), a route (`IV`, `IM`) or an
injection. If nothing survives, the route answers `502` and the client falls back
to the rulebook.

`concern` is the model's own read of urgency, and the station compares it with
ours (vitals, severity, age, pregnancy, danger signs). When they differ the slip
says so — *The reader sees more to watch* or *The clinic would watch this more
closely* — instead of pretending there is one answer.

The model is `ministral-8b-latest` by default (the affordable tier that this key
can reach), overridable with `MISTRAL_MODEL`. A free-tier key is rate-limited, so
the client never retries by itself: one call per file, one manual **Try again**.

## Handoff — C8

C8 is the file read back. There is no new question; the whole visit is set on one
printed sheet under a steel clip, and a desk press beside it stamps the record.
The stamp is the only control, and the sheet is the answer surface:

| part | what it prints |
| ---- | -------------- |
| masthead | clinic, the C5 appointment, the C5 serial, the moment of printing |
| route | the eight stations as tiny cut stones, the same shape as the rail |
| patient | age, sex mark, possible pregnancy, support marks, home and distance |
| readings | four ruled cells with the value, unit, word and a position bar |
| symptoms | the body map with the marked areas in ink, severity cells, onset, red flags |
| history | condition / daily medicine / allergy chips, warnings in rust |
| take home | the C5 tray as a blister strip, plus the first caution |
| bottom | the C6 return date and tonight line, and the record code |
| footer | a serial barcode and the print date |

Pressing the stamp drives the head down, inks a rotated `HANDED OVER` ring into
the top-right corner and marks the rail complete. The button then reports
`aria-disabled`, and the live region says the record reached the desk. A compact
bar under the press reads `Filed at the desk` and offers **Next patient**, which
resets every answer and returns the rail to C1. The bar scrolls itself into view
on short screens, so the way out is never left under the fold.

### The record code

`qr.ts` is a small, dependency-free QR encoder — byte mode, error correction L,
versions 1–5, one Reed–Solomon block, all eight masks scored with the standard
penalty rules. It is not a picture of a QR: the code on the sheet was decoded back
with `jsQR` at both desktop and phone sizes during development. The payload is a
compact ASCII line of the same facts the paper shows:

```text
MX7|484|Kolar|20261116|72F|T38.4|P92|B146/94|O96|PARACETAMOL+BP|WEEK
```

Serial, place, date, age/sex, four readings, the dose keys and the return interval.
For production, point the payload at a real record URL or short token; `QrMark`
and the sheet do not care what the string means.

The sheet is ordinary DOM, not a canvas or an image, so the type stays selectable
and the code stays vector. The serial is `serialOf` of the facility and slot — the
same number C5's brass token carries — so the paper, the token, the barcode and
the QR all agree.

## Station router

`App.tsx` holds the eight stations' answers and which one is open. The active rail
node is derived, never set by hand:

```tsx
const activeIndex =
  station === 'c1' ? (c1Filed ? 1 : 0)
  : station === 'c2' ? (c2Filed && !c2Urgent ? 2 : 1)
  : station === 'c3' ? (c3Filed && !c3Urgent ? 3 : 2)
  : station === 'c4' ? (c4Filed ? 4 : 3)
  : station === 'c5' ? (c5Filed ? 5 : 4)
  : station === 'c6' ? (c6Filed ? 6 : 5)
  : station === 'c7' ? (c7Filed ? 7 : 6)
  : c8Filed ? 8 : 7
```

Finishing a station moves the node — and so the gem — before the panel changes, so
the spine is already waiting on the next station while the recap is still on screen.
Editing a filed answer calls `onReopen`, which puts the rail back where the patient
actually is. C2's recap pill opens C3, C3's opens C4, C4's opens C5, C5's opens C6,
and C6's opens C7. C7 has no question to file, so the rail moves the moment its
read lands. C8 asks nothing new either — stamping the sheet files it, the rail runs
past its last node to complete, and **Next patient** resets every answer and returns
the rail to C1. An urgent C2 or C3 keeps the rail on its own node, because the visit
ended there.

## Location

`Compass` asks the browser for a position once and resolves it through `places.ts`
— a 31-entry gazetteer of Karnataka district centres, haversine distance, bearing.
Anywhere in the state lands on a facility; past 300 km the compass says so
honestly, prints the coordinates it did get, and leaves the town list as the way
out. Asking someone in another country to pick a Karnataka taluk is worse than
admitting we could not place them.

The failures are named, not merged into one shrug: blocked permission, a page
that is not a secure context (a LAN address over plain http), no signal, a
timeout, and out-of-area each get their own line. The permission store is checked
before the request so an origin Chrome has already blocked does not flash the
sweep for nothing. While searching, a radar wedge turns under the glass and the
needle dims; the fixed position is not stored, it only decides which clinic, and
how far.

Only the eight catchment towns are offered for manual choice — the rest of the
gazetteer exists to recognise a device fix, not to become a 32-item menu.

## Demo scaffold

`?demo=1` reveals the checkpoint +/− and reset controls under the rail. They are
not part of the intake.

## Production

The app is deployed on Vercel as a Next.js project, with the Mistral key in the
project's environment — **never in this repo**.

| setting | value |
| ------- | ----- |
| `MISTRAL_API_KEY` | required for the second read; without it C7 uses the clinic rulebook |
| `MISTRAL_MODEL` | optional; defaults to `ministral-8b-latest` |
| `NEXT_PUBLIC_SITE_URL` | optional; canonical origin for metadata, sitemap and robots (`https://max-well-tau.vercel.app`) |

With no `NEXT_PUBLIC_SITE_URL`, the site URL falls back to Vercel's
`VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`, then `localhost:3000`, so
preview deployments describe themselves correctly.

What ships with the page:

- **Metadata** — title template, description, canonical, Open Graph and Twitter
  card, `en_IN` locale, dark `theme-color`, `viewport-fit=cover`, keywords.
- **Icons** — a faceted cut-stone mark: `icon.svg` for browsers, 192/512 PNGs for
  the manifest, a 180px Apple touch icon, and a maskable entry.
- **A real share card** — `app/opengraph-image.tsx` draws the 1200×630 image with
  `next/og` (no font files to carry), so every link preview is the rail, not a
  screenshot of a form.
- **Manifest, robots and sitemap** — generated by `app/manifest.ts`,
  `app/robots.ts` and `app/sitemap.ts`; `/api/` is disallowed for crawlers.
- **Headers** — `nosniff`, a same-origin frame policy, a strict referrer policy,
  and a permissions policy that closes everything except geolocation on this
  origin (C1 needs it). `x-powered-by` is off.

Deploy from the repository root: Vercel's Next.js preset needs no configuration.
The key is added once per environment in the project settings, then
`vercel --prod` (or a push to `main`) picks it up.

On screens under 900px the spine keeps the first screen and the check-in continues
below it, with a small chevron at the foot of the rail as the cue. Reduced motion
(`prefers-reduced-motion: reduce`) drops every transition and animation on the
panel.
