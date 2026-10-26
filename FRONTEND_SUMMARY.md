# WorldGym API — Frontend Reference

> Base URL: `https://<host>/api`
> All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Authentication

### Login
```
POST /auth/login
Body: { email|nickname, password }
Response: { access_token, refresh_token, user }
```

### Refresh token
```
POST /auth/refresh
Body: { refresh_token }
Response: { access_token, refresh_token }
```

### Get current user
```
GET /userdata
Response: { id(UUID), name, email, nickname, isAdmin }
```

### Change password
```
PUT /auth/password
Body: { current_password, password, password_confirmation }
```

### Request password reset
```
POST /auth/password/reset
Body: { email }
```

### Set new password
```
POST /auth/password/set
Body: { token, password, password_confirmation }
```

### Delete account
```
DELETE /account
```

---

## Muscle Groups

```
GET    /muscle-groups           → [{ id, name, created_at, updated_at }]
GET    /muscle-groups/{id}      → { id, name, muscles: [{ id, name, muscle_group_id }] }
POST   /muscle-groups           Body: { name }                          (admin)
PUT    /muscle-groups/{id}      Body: { name }                          (admin)
DELETE /muscle-groups/{id}                                              (admin)
```

---

## Muscles

```
GET    /muscles                 Query: ?muscle_group_id=&search=
                                → [{ id, name, muscle_group_id, muscleGroup: { id, name } }]
GET    /muscles/{id}            → { id, name, muscle_group_id, muscleGroup }
POST   /muscles                 Body: { name, muscle_group_id }         (admin)
PUT    /muscles/{id}            Body: { name, muscle_group_id }         (admin)
DELETE /muscles/{id}                                                    (admin)
```

---

## Equipment

```
GET    /equipment               Query: ?search=
                                → [{ id, name }]
GET    /equipment/{id}          → { id, name }
POST   /equipment               Body: { name }                          (admin)
PUT    /equipment/{id}          Body: { name }                          (admin)
DELETE /equipment/{id}                                                  (admin)
```

---

## Exercises

### List (global + personal)
```
GET /exercises
Query params: ?search= &equipment_id= &muscle_id= &is_global= &is_bodyweight=
Response: [{
  id, name, description, is_global, is_bodyweight,
  equipment: { id, name } | null,
  user_id: UUID | null,
  muscles: [{ id, name, pivot: { is_primary: bool } }]
}]
```

### Get exercise
```
GET /exercises/{id}
Response: { id, name, description, is_global, is_bodyweight, equipment, user_id,
            muscles, primaryMuscles, secondaryMuscles }
```

### Create exercise
```
POST /exercises
Body: {
  name,
  description?,
  equipment_id?,         // null = bodyweight
  is_bodyweight?,        // bool
  is_global?,            // bool, admin only
  muscles: [{ muscle_id, is_primary }]
}
```

### Edit exercise
```
PUT /exercises/{id}
Body: { name?, description?, equipment_id?, is_bodyweight?, muscles? }
(Only owner or admin)
```

### Delete exercise
```
DELETE /exercises/{id}   (Only owner or admin)
```

---

## Workouts

### List workouts
```
GET /workouts
Query: ?date_from=YYYY-MM-DD &date_to=YYYY-MM-DD &status=active|finished
Response: [{
  id, date, notes, status, started_at, finished_at,
  routine_day_id, created_at, updated_at
}]
```

### Get active workout
```
GET /workouts/active
Response: workout object (status=active) with exercises + sets, or null
```

### Get workout (full)
```
GET /workouts/{id}
Response: {
  id, date, notes, status, started_at, finished_at, routine_day_id,
  workoutExercises: [{
    id, exercise_id, order_index, notes,
    exercise: { id, name, equipment, muscles },
    sets: [{ id, set_number, reps, weight, rest_seconds, notes, is_failed, is_dropset }]
  }]
}
```

### Create workout
```
POST /workouts
Body: { date, notes?, started_at?, status? }
```

### Edit workout
```
PUT /workouts/{id}
Body: { date?, notes?, status?, finished_at?, started_at? }
```

### Delete workout
```
DELETE /workouts/{id}
```

---

## Workout Exercises (exercises inside a workout)

### List
```
GET /workouts/{workoutId}/exercises
Response: [{ id, workout_id, exercise_id, order_index, notes, exercise, sets }]
```

### Add exercise to workout
```
POST /workouts/{workoutId}/exercises
Body: { exercise_id, order_index?, notes? }
```

### Edit
```
PUT /workouts/{workoutId}/exercises/{id}
Body: { order_index?, notes? }
```

### Reorder exercises
```
PATCH /workouts/{workoutId}/exercises/reorder
Body: { exercises: [{ id, order_index }] }
```

### Remove exercise from workout
```
DELETE /workouts/{workoutId}/exercises/{id}
```

---

## Sets (within a workout exercise)

```
GET    /workouts/{wId}/exercises/{weId}/sets
→ [{ id, set_number, reps, weight, rest_seconds, notes, is_failed, is_dropset }]

GET    /workouts/{wId}/exercises/{weId}/sets/{id}

POST   /workouts/{wId}/exercises/{weId}/sets
Body: { set_number, reps?, weight?, rest_seconds?, notes?, is_failed?, is_dropset? }

PUT    /workouts/{wId}/exercises/{weId}/sets/{id}
Body: { reps?, weight?, rest_seconds?, notes?, is_failed?, is_dropset? }

DELETE /workouts/{wId}/exercises/{weId}/sets/{id}
```

> `weight` is in **kg** (decimal, e.g. 72.5)
> `is_failed` = set was attempted but failed
> `is_dropset` = drop-set technique

---

## Stats

### Overview
```
GET /stats/overview
Response: {
  total_workouts,
  current_streak,        // consecutive training days
  longest_streak,
  top_muscle_group: { id, name },
  total_sets,
  total_volume_kg
}
```

### Exercise evolution
```
GET /stats/exercises/{exerciseId}
Query: ?from=YYYY-MM-DD &to=YYYY-MM-DD
Response: [{
  date,
  max_weight,
  total_volume,
  total_sets,
  total_reps
}]
```

### Muscle group volume
```
GET /stats/muscle-groups/{muscleGroupId}
Query: ?from= &to=
Response: [{ date, total_volume, total_sets }]
```

### Personal records (all exercises)
```
GET /stats/records
Response: [{
  exercise: { id, name },
  max_weight,
  max_reps,
  max_volume_per_set,
  date
}]
```

### Personal record for one exercise
```
GET /stats/exercises/{exerciseId}/pr
Response: { max_weight, max_reps, max_volume_per_set, date }
```

---

## Routines

### List
```
GET /routines
Query: ?search= &is_global=
Response: [{
  id, name, description, is_global, is_default, user_id,
  days: [{ id, day_number, name }]
}]
```

### Get routine (full)
```
GET /routines/{id}
Response: {
  id, name, description, is_global, is_default, user_id,
  days: [{
    id, day_number, name,
    exercises: [{
      id, order_index, sets_target, reps_target, weight_target, rest_seconds, notes,
      exercise: { id, name, equipment, muscles }
    }]
  }]
}
```

### Create routine
```
POST /routines
Body: { name, description?, is_global? }
```

### Edit / Delete
```
PUT    /routines/{id}           Body: { name?, description?, is_global? }
DELETE /routines/{id}
```

### Set as default
```
PUT /routines/{id}/set-default
(Marks this routine as default, unsets previous default)
```

### Get next day to train
```
GET /routines/{id}/next-day
Response: { day: { id, day_number, name, exercises } }
(Returns next day based on last workout linked to this routine)
```

---

## Routine Days

```
GET    /routines/{rId}/days
GET    /routines/{rId}/days/{id}

POST   /routines/{rId}/days
Body: { day_number, name? }

PUT    /routines/{rId}/days/{id}
Body: { day_number?, name? }

DELETE /routines/{rId}/days/{id}
```

---

## Routine Day Exercises

```
POST   /routines/{rId}/days/{dId}/exercises
Body: {
  exercise_id,
  order_index?,
  sets_target?,     // planned number of sets
  reps_target?,     // target reps per set
  weight_target?,   // target weight in kg
  rest_seconds?,    // rest between sets
  notes?
}

PUT    /routines/{rId}/days/{dId}/exercises/{id}
Body: { order_index?, sets_target?, reps_target?, weight_target?, rest_seconds?, notes? }

DELETE /routines/{rId}/days/{dId}/exercises/{id}
```

---

## Start workout from routine

```
POST /routines/{routineId}/days/{dayId}/start
Response: {
  workout: {
    id, date, status: "active", started_at,
    workoutExercises: [ ...pre-populated from routine day... ]
  }
}
```

> This creates a Workout with status=active and pre-adds all exercises from the routine day.
> Sets are NOT pre-created — the user adds them during the workout.

---

## Admin: User Management

```
GET    /users                   Query: ?search=
GET    /users/{id}
POST   /users                   Body: { name, email, nickname, password, password_confirmation }
PUT    /users/{id}              Body: { name?, email?, nickname?, password? }
DELETE /users/{id}
```

---

## Data model overview

```
User
 └── Workout (date, status: active|finished, started_at, finished_at)
      └── WorkoutExercise (order_index)
           └── WorkoutSet (set_number, reps, weight kg, is_failed, is_dropset)

 └── Exercise (personal: user_id set, is_global=false)

Exercise (global: user_id=null, is_global=true)
 ├── Equipment (nullable, e.g. Barra, Mancuerna, Màquina, Cable, Pes corporal)
 └── Muscles (via exercise_muscles pivot, is_primary bool)
      └── MuscleGroup (e.g. Pit, Esquena, Cames, Espatlles, Braços, Core)

Routine (global or personal, one can be is_default)
 └── RoutineDay (day_number, name)
      └── RoutineDayExercise (sets_target, reps_target, weight_target)
           └── Exercise
```

---

## Typical workout flow

```
1. GET /routines/{id}/next-day           → know which day to train today
2. POST /routines/{rId}/days/{dId}/start → create active workout (pre-filled exercises)
3. For each exercise in workout:
   POST /workouts/{wId}/exercises/{weId}/sets   → add sets as user performs them
4. PUT /workouts/{id}  { status: "finished", finished_at: "..." }
5. GET /stats/overview                   → see updated stats
```

---

## Notes

- All IDs are **integers** except `user_id` which is a **UUID string**
- `weight` is always in **kg**
- Global exercises/routines are visible to all users but editable only by admins
- `is_default` routine is the one shown first / suggested by default
- Token expiry: consult backend config — implement refresh flow when 401 received
