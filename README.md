# Climate Refugee Pavilion landing page

Next.js (App Router) + Tailwind CSS v4 + Framer Motion, with an interactive
3D globe built on React Three Fiber.

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Backend recovery update

Before running the updated backend, apply migrations with `npm run db:migrate`
against the intended database. Migration `0008_backend_recovery` adds the Excel
decision batch position and backfills existing records missing from the sync
feed. It briefly locks the four source tables while taking the baseline; allow
time for this when scheduling deployment. The backfill excludes private identity
session links and IDs. `db:push` alone does not perform this data backfill.

Expired worker leases are reclaimed automatically. Email jobs whose first attempt
was more than 23 hours ago are parked for provider reconciliation, avoiding a
blind resend outside the provider's idempotency window. Recovery links are minted
at delivery and require a confirmation POST; an email scanner's GET does not
consume them. Existing applications are not retroactively marked as having given
explicit consent; new submissions must send `consent: true` after acceptance.

Excel rotates through batches of 200 decision rows. Editing reviewer fields
creates a new decision ID; replaying the same ID with different content through
the decisions API returns `conflict`. Changing only the system version is not a
new decision. Run `npm test` for disposable PostgreSQL integration tests.

See [BACKEND_SECURITY.md](BACKEND_SECURITY.md) for email confirmation, individual
operator credentials, VideoAsk form binding, and deployment requirements.

## Application verification

Configure Didit's webhook destination separately in its console, pointing to
`https://<your-domain>/api/webhooks/identity`, and set `DIDIT_WEBHOOK_SECRET`.
The session `callback` is a browser redirect to `/apply/complete`; it is not
the webhook destination. Only authenticated webhook events record approval.

Applicants who submit an email already on file can request a fresh, single-use resume link sent to that mailbox. The public form does not disclose
existing application IDs or grant access to existing verification sessions.

> **Build-time font fetch:** the `Outfit` body font is loaded via
> `next/font/google`, so `next build` needs network access to
> `fonts.googleapis.com`. In an offline/proxied environment either allow that
> host or self-host the font with `next/font/local`. The display font (`Trail`)
> is already self-hosted from `public/TrailFree-*`.

## Structure

- `app/page.tsx` composes the sections in order: `Header`, `Hero`,
  `PavilionPanel`, `PlatformSection`, `ContentGrid`, `GetInvolved`, `Waitlist`,
  `Sponsors`, `Footer`, plus the floating `GetInvolvedPill`.
- `components/SectionReveal.tsx` wraps content in the shared `whileInView`
  fade/slide. Backdrop layers (wordmarks, gradients, washes) are not animated.
- `components/DisplayWordmark.tsx` renders the large `Trail`-font section
  wordmarks (`Pavilion`, `Platform`, `Content`).
- Design tokens (colors, fonts, the 900px `desk` breakpoint, blob radii, the
  poster-scroll keyframes) live in `app/globals.css` under `@theme`. The shared
  hero/pavilion column width is the `--column-w` custom property.
- Copy and data live in `lib/`: `content.ts` (content posters), `nav.ts`
  (header links), and `pins.ts` (globe pin groups and locations).
- Fonts are declared once in `lib/fonts.ts` (`outfit`, `trail`).

## Platform globe

`components/platform/Globe.tsx` is the interactive 3D globe (React Three
Fiber), loaded through `components/platform/PlatformGlobe.tsx` with
`next/dynamic` (`ssr: false`) so it never runs on the server;
`GlobeLoading` reserves the footprint while the canvas mounts.

- It auto-rotates left→right and is drag-interactive: all directions on
  desktop (yaw + clamped pitch), horizontal only on touch. The canvas uses
  `touch-action: pan-y` so vertical page scrolling stays smooth on mobile.
- Rotation and hover/interaction are disabled under `prefers-reduced-motion`.
- Pins come from `lib/pins.ts` (`pins`, `pinGroups`), grouped into Beacons,
  Missions and Ambassadors; `PlatformSection` cycles/filters the visible groups.
- The earth texture is `public/textures/earth-tinted.png`.
