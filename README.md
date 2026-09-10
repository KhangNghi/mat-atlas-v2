# Mat Atlas

Interactive mind map of Brazilian Jiu-Jitsu — **274 skills**, **12 chains**, and a YouTube clip on every technique.

Drag the radial map, open **Ladder** for attack sequences, or browse the **Library**. Filter Gi / No-Gi, bookmark moves, and mark them unseen / training / solid. Progress lives in your browser.

## Views

- **Map** — connected graph of fundamentals, standing, guards, half guard, passing, pins, the back, sweeps, submissions, escapes, legs, and concepts
- **Ladder** — ordered chains (Closed Guard Trinity, Berimbolo, Passing Ladder, …)
- **Library** — searchable catalog with Watch-on-YouTube clips (no nested embeds)

Mobile has a bottom tab bar and a details sheet. Add to Home Screen works as a PWA.

## Run

```bash
npm install
npm run dev
```

Then open the preview. Production build:

```bash
npm run build
```

## Stack

TanStack Start, React 19, Tailwind v4, Zustand (localStorage).
