# Design guide

How osustats.app looks, and **why**. Every rule here was decided on purpose,
usually after trying something else first. Before changing anything visual,
read the relevant section. If a change goes against a rule, change the rule
here too and say why.

**The one rule above all others:** if you spot a problem, fix it properly.
"Good enough" and "diminishing returns" don't apply on this site.

---

## 1. The big ideas

1. **The page is calm. The pictures bring the colour.** Map covers and player
   banners are colourful, so the interface around them stays neutral (dark
   greys, white and grey text).
2. **Colour has to mean something.** A colour is allowed only if it tells the
   reader something, like which mod, how good the accuracy is, or whether
   rank went up or down. Colour used only to decorate is not allowed.
3. **One accent colour for the brand:** osu! pink and purple. Use it only for
   things you can click or that are selected, plus the logo.
4. **Same thing, same look, everywhere.** Every card has the same frame. Every
   stats row uses the same "label above, value below" pattern. There's one
   tooltip style, and one word for one thing.
5. **Measure, don't guess.** Text contrast and chart colours are measured in a
   browser against the worst case (for example a pure-white banner), not
   judged by eye.

---

## 2. Colours

### Base

| Use | Colour |
|---|---|
| Page background | `#050505` (also set on `html`/`body`, so fast scrolling never flashes white) |
| Cards | Tailwind `gray-800` background, `gray-700` border, `rounded-lg` |
| Main values (numbers, names) | white |
| Labels | `gray-400`, small, UPPERCASE, wide letter spacing |
| Brand purple `osu-purple` | `#b84ed6`: main Search button, row hover bar |
| Brand pink `osu-pink` | `#ff6b9d`: anything **selected or active** (time-filter chip, active-row edge bar, sort arrow, peak-month bar) |

### Colours that carry meaning (allowed)

| What | Colours | Where it's set |
|---|---|---|
| **Mods** | NM sky, HD indigo, HR rose, DT amber, EZ/HT emerald, FL slate, SD/PF orange, SO pink, TD cyan, MR fuchsia | `modUtils.js` → `MOD_COLORS` (the only place mod colours are defined) |
| **Accuracy** | 100% pink, ≥99 green, ≥97 light green, ≥95 yellow, ≥90 orange, below that red | `ScoresList.jsx` |
| **Rank change** | green ▲ / red ▼, on a small dark pill | `UserProfile.jsx` → `RankDelta` |
| **Activity status** | a small coloured dot inside a grey outlined badge | `ImprovementVelocity.jsx` → `buildVerdict` |
| **Archetype** | the icon ring and the title in the archetype's colour | `PlaystyleCard.jsx` → `ARCHETYPES` |
| **Traits** | the same colour as the mod they're about (HD Stacker = HD indigo, HDDT Stacker = DT amber, HDHR Stacker = HR rose) | `PlaystyleCard.jsx` → `TRAITS` |

Mod colours come in three strengths, all from the same table:
- `badge`: a faint tint with an outline (score table).
- `chip`: stronger (selected filter chip).
- `bar`: solid (playstyle breakdown bars).

### Rejected (don't bring these back)

- **Coloured bars along the tops of cards, and a coloured strip down the left.** Every card in a different style looked messy. All cards now share one plain frame.
- **"Rainbow" stat numbers** (cyan rank, pink country rank, purple pp). This looked amateur. Stat numbers are white.
- **Neon gradients and pulsing animations** (the old chart bars, the pulsing status badge).
- **A colour wash behind the playstyle header.** On warm colours (amber, green, rose) it turned a muddy olive-brown.
- **Grey trait badges.** That was tried to cut down colour and was **wrong**: the trait colours carry meaning because they match the mods. The loud part was the *neon solid fill*, not the colour itself. Traits use the muted tinted-outline style.
- **Cyan pp and blue lazer tag** in the score table. pp is white, and the lazer tag is neutral grey.

---

## 3. Text and wording

- **Say "top plays" everywhere,** never "scores" or "top scores", because they
  mean the same thing. For example: "Based on 200 top plays", "Mod breakdown ·
  200 top plays", "Top Plays for {name}", "NM on 90%+ of top plays".
  - Exception: the **Score** column, because that's the actual score number.
- **Plurals are correct:** "1 month ago", not "1 months ago"; "1 play".
- **Talk about the player as "the player" or "they",** never "you".
- **Archetype descriptions are one short line,** e.g. "Almost only plays nomod."
- **Tooltips never show counts like "(1)".** Counts go on the chip itself
  ("HD 173"); the tooltip just names the mod ("Hidden").
- **Long map titles and artist names stay on one line** and end in "…"; the
  full name shows on hover.
- **No developer language on the page.** No code-style (monospace) text, no
  "AND", "≥", or rule jargon like "Player threshold". Rules are written as
  plain sentences, e.g. "DT on 70%+ of top plays, with 97%+ average accuracy".
- **Dates look the same for every visitor** (`components/dateUtils.js`):
  - a day is written "18 Nov 2024", never "18/11/2024", which reads as
    11/18 in the US and can't be read at all for dates like 04/04;
  - a month is written "Apr 2026", never "Apr 26", which looks like the
    26th of April;
  - month names come from a fixed three-letter list, because UK English
    gives "Sept".
- **Two different accuracy numbers get two different names.** The player
  card's "Accuracy" is osu!'s weighted profile figure. The playstyle card's
  "Top play acc" is the plain average of the top plays, and its tooltip
  explains the difference.

---

## 4. Tooltips

There's **one tooltip component**: `components/Tooltip.jsx`. Never use the
browser's plain `title` box.

| Device | Opens on |
|---|---|
| Mouse | hover only. Clicking must **not** leave a tooltip stuck open; that was a real bug. |
| Keyboard | Tab focus (`focus-visible`) |
| Touch screens | tap (only on devices without hover) |

- **Looks:** dark `gray-900` box, `gray-600` border, small `gray-300` text,
  rounded, shadow.
- **Placements:** `top`, `top-start`, `bottom`, `left`.
- **It stays on screen:** when a tooltip opens near an edge, it moves itself
  sideways so it isn't cut off. Badges at the left edge of a card and on
  phones used to get clipped.

---

## 5. Player card (header with banner)

This went through several rounds; this version is "design B".

- **Layout:** the banner is the header. The avatar, name, flag and country sit
  bottom-left on the banner. **Global rank and pp sit big on the bottom-right.**
  Along the bottom is one strip of secondary stats (country rank, accuracy,
  play count, play time) with thin dividers between them. From 768px up it
  sits over the bottom of the banner, on the card's shadow; on phones it sits
  under the banner.
- **The banner, and how much of it shows** (`.player-card` in `App.css`).
  Banners are about 4:1.
  - **From 768px up the card is 4:1** (as a minimum: it grows if its content
    needs more room) and the banner fills the whole card, so all of it shows.
    The extra height is all picture, above the name.
  - **Below 768px the banner stays behind the header only.** There the full
    card would be too tall for its width and crop the banner harder. 768px
    is where the two cross over.
  - **Measured share visible:**

    | Width | Banner behind | Visible |
    |---|---|---|
    | 390 (phone) | header | 62% |
    | 640 | header | 97% |
    | 767 | header | 80% |
    | 768 | whole card | 81% |
    | 900 | whole card | 96% |
    | 1024 and up, comparison view | whole card | 98–100% |

  - **The card isn't clipped** (no `overflow-hidden` with a banner). Clipping
    makes the browser hold the card at exactly 4:1 and cut off the stats on
    narrower cards. The header and strip round their own corners instead.
- **Header height:** at least `h-36` (`h-28` in the comparison view). It
  grows to fill the 4:1 card.
- **Readability on any banner:** one continuous layer of shading, with no
  band, no line and no frost (`.player-card` in `App.css`):
  - **a shadow rising from the bottom of the card,** darkest behind the
    stats strip (85% at the bottom edge) and easing out towards the top
    (8%), so the top of the art stays bright. Its stops are in px from the
    bottom, so the strip is covered the same way at any card height, and
    it's eased (many small steps), because a sudden change in how fast it
    fades reads as a line;
  - **soft dark pools** behind the name (bottom-left) and the headline stats
    (bottom-right). They have fixed pixel sizes, so they still cover the
    text on the narrow comparison cards. From 768px up they're painted on
    the whole card: painted inside the header, they stopped dead at its
    bottom edge, which made a visible line;
  - **phones:** the banner sits behind the header only, which darkens from
    15% at the top to 75% at the bottom, and the strip sits below it on the
    plain card;
  - strip labels are `gray-300`, a step lighter than elsewhere;
  - the header text has a drop shadow;
  - everything was measured against a pure-white banner, the worst case, at
    desktop, comparison and phone width, and passes.
- **Both big stats have the same structure:** label above, number below,
  lined up exactly. The rank change (▲18) sits in the **label line**, so it
  can't push the number out of line.
- **Flag:** osu!'s own flag image (`osu.ppy.sh/assets/images/flags/...svg`),
  not an emoji, because Windows shows emoji flags as letters. If the image
  fails to load, it hides itself and just the country name shows.
- **Phones:** rank and pp move into the stats strip and are listed first.
- **"Updated 12 min ago · ↻ Refresh"** (`UpdatedNote.jsx`) sits on its own
  line **above** the card, right-aligned, 8px from it. The word "Refresh"
  ends exactly on the card's right edge.
  - It's there because the backend keeps osu! data for 30 minutes. Without
    it, a play set a few minutes ago could be missing with no hint why.
  - Small `gray-400` text with a `gray-300` button (no accent colour: it's
    a quiet utility, not a main action). Measured 7.8:1 and 13.4:1 on the
    page background.
  - The button only appears once the data is a minute old ("Updated just
    now" has none): the backend won't fetch anything newer before then.
  - While it works: "Refreshing…" with a spinning icon, and the player stays
    on screen. If it fails: "Couldn't refresh. Try again in a minute." in
    `red-300` (10.7:1), and the old data stays. Short on purpose: the
    advice is the same whatever went wrong, and a long message wrapped to
    four lines on phones.
  - **Comparison view:** the same line under each "PLAYER 1 / PLAYER 2"
    label, right above that player's card.

**Rejected:**
- **A frosted (blurred) stats band.** It smeared the banner into fog, and the
  band was lighter than the header bottom above it, so it read as a hazy
  bar.
- **A flat dark stats band, with or without frost.** Any band has a top edge,
  and that edge reads as a grey line. "Glass without the shadow above it"
  also failed contrast: with nothing behind the name, it measured 1.40 on a
  bright banner.
- **Banner behind the whole card at the old height.** It showed about 80%
  of the banner. Going to a full 4:1 card shows all of it for 53px more.
- **Banner behind the whole card with rainbow stats.** It was messy. (The
  banner covering the whole card came back later, and it works now because
  the numbers are neutral and a smooth shadow sits behind the stats.)
- **A 5:1 banner strip on top with the avatar hanging off its edge.** It
  "looked like a 10-year-old made it": a loud picture, a plain box under it,
  220px of extra height that held nothing, and a muddy fade.
- **Dark bands down both sides.** They didn't protect the corner text on
  bright banners.
- **The "Updated … · Refresh" note in a dark box on the banner's top-right
  corner.** A patch on the artwork, covering the part of the banner that's
  meant to stay bright.
- **The note on the same line as the centred "PLAYER 1" label.** On
  narrower comparison columns (1024px) it got cut off ("Updated 12 min a…"),
  and on phones the error message wrapped to four lines.

---

## 6. Score table rows (map covers)

- **Cover image:** the map's `card@2x` cover (800×280).
  - It covers only the **left 60%** of the row and fades out on an eased
    curve, so there's no visible edge.
  - Stretching it across the full row showed only a thin slice of the image,
    because the row is too wide and short.
  - Covers load only as rows come near the screen.
- **Rows inside the time filter, or all rows when the filter is "All":**
  - the cover is in **full colour** under a dark overlay that goes from 50%
    at the top to 75% at the bottom;
  - text stays white;
  - the text has a soft shadow, light enough that you mostly notice it on
    bright covers;
  - a **pink bar** marks the left edge (only when a filter is active).
- **Rows outside the time filter:**
  - the same cover in **greyscale**, darker (70% at the top to 85% at the
    bottom), so the coloured rows stand out;
  - text is toned down (titles and numbers `#858c98`, small text `#5b6270`);
  - pp, accuracy and mod badges are faded to 60%;
  - no text shadow, because a shadow made grey text look brighter;
  - **this text is deliberately below the 4.5:1 target** on bright covers
    (as low as about 1.3:1 on a pure-white one). These are the plays the
    reader filtered out, so they're meant to recede.
    Only the colour rows have to pass.
- **Badges on covers** (mods, accuracy, lazer tag) get a solid dark backing,
  so they read on any image.
- **Hover:** a purple bar on the left edge. The row does **not** get lighter,
  because that would hurt readability on bright covers.
- **Every row is the same height:** titles are cut to one line, and mod
  badges never wrap onto a second line.
- **Lazer plays:** a small grey "lazer" tag sits in the Mods column, **on
  its own line under the mods**. It isn't a mod (stable plays are the ones
  osu! marks, with a hidden "CL" mod), but like the mods it says how the
  play was set, and that column has room. On its own line, and grey, it
  reads apart from the mods at a glance. Its tooltip explains that a lazer
  play's score is the standardised one.
  - It's line 2 of the row (see below), so rows stay the same height.
  - An earlier lazer badge in the Mods column was removed: it was blue,
    styled like a mod (blue is NM's colour), and repeated the tag next to
    the score. Now it's the only lazer marker, and neutral.
  - Rejected: the tag in the same line as the mods. It read as one more
    mod at a glance.
- **Order:** pp order, like the osu! profile. Lazer plays keep their pp
  position and just show a smaller number.
- **Every row is two lines, the same in every column:** line 1 holds the
  main values (title, mods, accuracy, score, combo, pp, date), line 2 the
  details (artist, the lazer tag, the hit counts). Line 1 is 24px, line 2
  20px, rows 69px. Before this, accuracy, score and combo moved up to make
  room for the counts while pp and date stayed centred, and hung between
  the two levels.
- **Hit counts** (300s, 100s, 50s, misses) are line 2 under the score:
  "300 2,481  100 44  50 0  × 0".
  - Accuracy, score and combo share one cell whose grid uses the header's
    column widths, so each still sits under its heading.
  - The line is **centred under the score**, like every value in the table
    is centred on its column, and sized to its numbers: each label tight to
    its number, the same 12px between counts.
  - The miss cross is a drawn icon. The "✕" character isn't in the site's
    font, so the browser borrowed a thinner one from another font.
  - Numbers white; labels a step dimmer (`gray-400`, kept grey on covers,
    where other grey text is lightened, or they'd be almost as bright as
    the numbers). Misses red (`red-400`) only when there are any, faded to
    60% on grey rows. Measured over a pure-white cover: numbers 17.0:1,
    labels 6.5:1, red 6.4:1.

### On phones and tablets (narrower than 1024px)

The table needs about 950px, so narrower screens show each play as a card
instead ("B · Everything" from the mockup round). Nothing is left out:

```
1 Crystalia ................ 1,857pp
DJ TOTTO ..................... DT HD
97.44%  19,279,990  881x  24 Jan 2026
300 1,218  100 16  50 0  ✕ 1   lazer
```

- **The rank** sits on the title line, not in its own column, so the stats
  line gets the full width.
- **The "lazer" tag** ends the hit-count line, at the right: under the
  mods and the date, as in the table it's under the mods. (Directly under
  the mods is where the date is.)
- **Hit counts get their own fourth line.** Each card is 105px tall. The
  labels are `gray-300` here: `gray-400` measured 3.4:1 over a pure-white
  cover, because the line sits higher in the cover's fade than in a table
  row. Now 5.9:1.
- **Every card is the same height** (105px) at 360px and up. On narrower
  screens the stats and hit lines wrap rather than cutting anything off.
- **Covers, grey and colour, the pink active bar, and the hover bar** all
  work as on the table rows.
  - Colour cards use a slightly stronger gradient (60% → 84%), because their
    title and artist sit higher in a taller card. They were measured at
    5.1:1 or better over a pure-white cover.
- **Sorting:**
  - a compact "PP ▾ ↓" control on the title line replaces the column
    headers;
  - the label shows only the current choice, and the real menu sits
    invisibly on top of it, so it opens the phone's own picker;
  - the arrow flips highest/lowest first.
- **Header:**
  - the title is just "Top Plays", since the name is in the player card
    right above;
  - the play count sits at the end of the time-filter line;
  - the mod chips are a little tighter, so five fit on one line at 360px.
- **Page gutter:** 16px on phones and 24px from 640px up.
- **Combos use thousands separators everywhere,** e.g. "1,204x".

**Rejected:**
- **Hit counts squeezed under the accuracy column alone.** No room for the
  300s, which players want to see.
- **Hit counts as their own column** (labels in the header, numbers in
  slots). It needed 24px more than the table has at 1024px, and the
  header labels ran together.
- **Hit counts in fixed-width slots across the three columns.** Slots sized
  for the worst case ("12,345") left holes after short numbers ("50 0"
  floated far from "100 44"), and the line started partway into Accuracy,
  tied to nothing above it.
- **"A · Compact"** (score and combo left out). People do look at those
  numbers, and B costs no extra height.
- Darkening the text on the coloured rows. Only the grey rows get darker
  text, as decided.
- A full-brightness cover with no overlay at all. White text became
  unreadable.
- Greying the out-of-range rows twice (grey cover *plus* a heavy fade).

---

## 7. Improvement Velocity (activity chart)

- **Bars:**
  - at most 24px wide, centred in their month with space between them;
  - rounded at the top, flat on the baseline;
  - empty months draw nothing.
- **Colours** (all measured: they pass 3:1 against the card, and colour-blind
  readers can tell them apart):
  - normal months `violet-500` (`#8b5cf6`);
  - peak month brand pink, with its count written on top;
  - this month `gray-300`.
- **Scale:** the top of the chart rounds up to a clean number (29 becomes 30),
  and the top and middle gridlines are labelled (30 / 15).
  - The labels are `gray-400` (5.8:1). `gray-500` was too faint, at 3.2:1.
  - Gridlines are faint solid lines; the baseline is a step brighter.
- **Month labels:** under every bar on desktop and in the comparison view;
  every third month on phones.
- **Comparison view:** both players' charts share one scale (the larger of
  the two), so equal bar heights mean equal counts.
- **Legend:** only lists a colour if that bar is actually on the chart.
  - If the peak month is older than the 18 months shown, the legend instead
    says "Peak month is older than this chart", so nobody looks for a pink
    bar that isn't there.
- **Status badge:** grey outline, grey text and a small coloured dot, with no
  pulsing. The tooltip explains the rule.
  - The labels must be clearly different from each other, from most to least
    active: Actively Improving, Steady Progress, Still Active, Slowing Down,
    Plateaued, Inactive.
  - **The badge and the insight line never disagree.** Both use the same
    "usual pace" calculation. A player whose last 90 days are clearly behind
    their usual pace (67% of it or less, where the line says "fewer than
    their usual …") can't be "Actively Improving", however recent their last
    top play. They get "Steady Progress" instead.
  - On phones the badge sits under the title.
- **Stats row:** the same divided strip as the player card. On phones it
  becomes stacked rows (label left, value right), because three columns get
  cut off ("60 da…").
- **Insight line:** compares the last 90 days with the player's own usual
  pace, for example "15 top plays set in the last 90 days — 1.6× their usual
  9 per 90 days."
  - It says "in line with" or "fewer than" when that's the case.
  - It says "most of their top plays are recent" when there isn't 90 days of
    earlier history to compare with.
  - With no recent top plays it still gives the number: "No top plays in the
    last 90 days, against their usual 9 per 90 days." It doesn't guess what
    happens next ("a return could mean new peaks soon" was cut as filler).

**Rejected:**
- "On the Rise" next to "Actively Improving": they couldn't be told apart.
- An insight line that said "a strong recent push" for any number of plays,
  so it told the reader nothing.
- Bars filling the whole month, which read as solid blocks.
- Purple at 60% opacity, which was too faint (2.09:1).
- Dashed gridlines.
- Labelling only every third month on desktop.
- Showing a legend for bars that aren't there.

---

## 8. Playstyle card

- **Header:** the archetype icon in a coloured ring, plus the archetype name
  in its colour. There's no background wash.
  - Under the name is the one-line plain description ("Lots of DT with high
    accuracy.").
  - The exact rule is in a tooltip on the name, and in the "?" popup. It
    isn't printed on the card and isn't repeated.
- **Mod breakdown:** a bar per mod in the mod's colour, with its count and
  percentage.
  - On its own, a player's list is sorted by count.
  - In the comparison view, both players get the **same mods in the same
    order** (NM first, then by combined count), including 0 rows, so
    matching rows sit side by side.
- **Traits:** coloured pills (see section 2), **pinned to the bottom of the
  card**, so in the comparison view both players' traits line up even when
  one has more mod rows.
- **"?" button:** opens the list of all archetypes and traits. It closes with
  Escape and works with the keyboard.

---

## 9. Page layout

- **Width:**
  - Normal pages use `max-w-6xl`.
  - The comparison view uses `max-w-[94rem]`, **only while two players are
    actually on screen**. `HomePage` tells `App` when that's the case; the
    width doesn't come from the URL.
- **The logo and the cards share one left edge.**
- **Search:** the main Search button is filled purple. The "Compare with…"
  button is a quieter **outlined** button, so the main action is obvious.
  - The search boxes always show the players currently on screen. They
    follow the page address, so back/forward and shared links never leave
    an old name in a box.
  - On phones the box shrinks to fit (`min-w-0`). Without that it kept its
    natural width and pushed the Search button 20–50px off the screen at
    390 and 360px.
- **Comparison view:**
  - Two columns. Each row holds the matching card of each player, and both
    are stretched to the same height.
  - Both players share a chart scale and a mod order (see sections 7 and 8).
  - It **splits into two columns the moment you search**. Player 2's column
    shows pulsing placeholder cards ("Loading name…") until their data
    arrives. This stopped a brief stretched-out single view.
  - If player 2 doesn't exist, it falls back to the normal single view and
    width, and shows an error.
- **Sizing:** the site does not scale itself up on big monitors (it used to;
  100% now looks like the old 80%).
- **Filter chips never move** when you switch filters: the counts sit in
  fixed-width slots.

---

## 10. Accessibility targets

| Thing | Minimum contrast |
|---|---|
| Normal text | 4.5 : 1 |
| Large text (the big name, big numbers) | 3 : 1 |
| Chart bars | 3 : 1 against the card |

- **Score titles are real links:** middle-click and "open in new tab" work.
- **Sort headers are buttons:** the first click sorts highest/newest first.
- **The archetypes popup:**
  - it closes with Escape;
  - screen readers announce it as a dialog;
  - keyboard focus moves into it and back out.
- **Labels:** the search boxes and icon buttons have names screen readers
  can read.

---

## 11. Known design issues still open

1. **A faint edge on the score table at 80% browser zoom** (Windows Chrome,
   seen near the table's left edge). Parked as a tiny edge case. It doesn't
   reproduce on Linux Chromium: there are no seams and no 1px overflow at any
   width from 1024 to 2100px. Needs a close-up screenshot to pin down.
2. **Feature:** the comparison view should highlight the differences between
   the players (who has more pp, better accuracy, and so on).
