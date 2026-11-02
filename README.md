# Master Progress Dashboard (React + Firebase Auth + MongoDB)

Your single-file planner, ported to React. Same UI/CSS and logic, now with:

- **Firebase Auth** (Google + email/password) - each person only sees their own planner
- **MongoDB** (via Vercel serverless `/api/state`) - one document per user, synced across devices
- Offline-friendly: every change is also cached in `localStorage`; old `planner1` browser data is migrated on first login

```
api/state.js        GET / PUT / DELETE the signed-in user's planner (verifies Firebase ID token)
api/_lib/           mongo client + firebase-admin token check
src/store.jsx       state, debounced cloud sync, all actions (port of the old ACT table)
src/selectors.js    derived data (TD, TM, goals, sorting, events)
src/components/     views.jsx (8 tabs), shared.jsx, modals.jsx, Auth.jsx, ui.jsx
src/prayerData.js   prayer tables copied verbatim from your HTML
```

## 1. Firebase
1. console.firebase.google.com > create project > **Authentication > Sign-in method**: enable **Google** and **Email/Password**.
2. **Project settings > Your apps > Web app** - copy the config into `.env.local` (the `VITE_FIREBASE_*` values).
3. **Authentication > Settings > Authorized domains**: add your Vercel domain.
4. **Project settings > Service accounts > Generate new private key** - you need `project_id`, `client_email`, `private_key` for the backend.

## 2. MongoDB Atlas
1. Create a free cluster, a database user, and under **Network Access** allow `0.0.0.0/0` (Vercel IPs change).
2. Copy the connection string into `MONGODB_URI`. DB name defaults to `planner`.

## 3. Run locally
```bash
npm install
cp .env.example .env.local   # fill it in
npm i -g vercel
vercel dev                   # serves the React app AND /api together
```
(`npm run dev:ui` runs Vite only, but then `/api` does not exist.)

## 4. Deploy
Push to GitHub > import in Vercel > add every variable from `.env.example` in **Project > Settings > Environment Variables** > Deploy.
`FIREBASE_PRIVATE_KEY`: paste it with the `\n` sequences exactly as in the downloaded JSON.

## Notes
- Saves are debounced (~0.7s). If two devices edit at once, the second save gets a 409 and the app asks: *Load latest* or *Keep mine*.
- The whole planner is one document per user (limit 2 MB in the API). Fine for personal use; if it grows, split `tk` (tasks) into its own collection.
- Collapsible cards use a simple 450px cap + "Show more" instead of the old row-height balancing.
