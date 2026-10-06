# bmc-frontend

Next.js 16 + Tailwind CSS v4 panel for BongoMaker Control (control.bongomaker.com) (fan + LED controllers and
monitor bar lights for now). Talks to `bmc-backend`.

## Run

```bash
cp .env.example .env.local    # API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:3000
```

## How it works

- The browser never sees a token. Server components and server actions call the API with the
  access token from an httpOnly cookie; `src/proxy.ts` renews it with the refresh token when it
  expires, so sessions survive the 15-minute access token.
- The selected organization is a cookie (`bm_org`), switched from the top bar.
- Device pages re-render every few seconds (`AutoRefresh`) to show reported state; sliders send
  one merged state patch 150 ms after the last change.

## Roles

| Role | Scope | Can |
|---|---|---|
| Super admin | Platform | Everything in every organization, users & staff roles |
| Developer | Platform | Provision devices, read every organization |
| Owner | Organization | Claim/remove devices, locations, members |
| Member | Organization | Control devices |
| Viewer | Organization | Read only |

Create the first super admin from the backend: `npm run user:role -- you@example.com super_admin`.
