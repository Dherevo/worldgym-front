# WorldGym Frontend — Memory

## Project Overview
Vue 3 app (Vite + vue-facing-decorator) for a gym training tracker. Uses a custom `lib` framework (Phyrus).

## API
- Base URL: `http://localhost:8080/api`
- Auth: Bearer token in `Authorization` header
- **REAL response format for lists**: `{ total, pageSize, offset, items: [...] }` → use `res.items`
- **REAL response format for single objects**: returned directly (no wrapper) → use `res`
- Login returns: `{ access: "TOKEN", refresh: "REFRESH_TOKEN" }` directly
- Test credentials: `mateu@worldgym.local` / `password123`

## Key Patterns
- **Components**: Class-based with `vue-facing-decorator` (@Component, @Prop, toNative)
- **Navigation**: `this.to('/path')` (mixin), `this.param('id')` for route params
- **HTTP**: `http.get('/endpoint').data({}).then().catch().finally()`
- **Notifications**: `App.notification('text').setType('error').show()`
- **Confirm dialogs**: `App.confirm('msg').then((ok: boolean) => {...})`
- **Token**: Stored as `Bearer ${token}` in localStorage, auto-loaded at startup

## Pages Created
- `/` → Home/Dashboard (home.ts/vue/scss) — last 5 workouts + train button
- `/exercises` → Exercises (exercises.ts/vue/scss) — list with tabs/filters + CRUD
- `/routines` → Routines list (routines.ts/vue/scss)
- `/routines/:id` → Routine detail (routine-detail.ts/vue/scss) — days + exercises
- `/workouts` → Workout history (workouts.ts/vue/scss)
- `/workouts/:id` → Workout detail (workout-detail.ts/vue/scss)
- `/workout/:id` → Active workout (workout.ts/vue/scss) — main training screen
- `/login` → Login page

## Layout Structure
- `default` layout: redirects to `/` if already logged in (for login page)
- `backoffice` layout: requires auth, redirects to `/login` if not logged in

## File Structure
Each page in `src/pages/{name}/{name}.ts|vue|scss`
Layouts in `src/layouts/{name}/{name}.ts|vue|scss`

## Notes
- No TypeScript casts inside Vue templates (causes build errors)
- `.finally()` works because it chains on the Promise returned by `.then()`
- `http.token.loadFromStorage()` is called automatically in `App.init()`
