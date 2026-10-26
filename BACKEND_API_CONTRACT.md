# WorldGym — Backend API Contract

Document de referència per al backend. Descriu tots els endpoints que el frontend consumeix, els formats de request/response esperats, i el comportament requerit.

---

## Base URL

Configurable al frontend via variable d'entorn `_API_URL` (default: `http://localhost:8080/api`)

---

## Autenticació

Totes les peticions protegides envien:
```
Authorization: Bearer {access_token}
```

En cas de 401, el frontend fa automàticament refresh i reintenta la petició original.

---

## 1. AUTH

### `POST /auth/login`
```json
// Request
{ "username": "string", "password": "string" }

// Response 200
{ "access": "JWT_ACCESS_TOKEN", "refresh": "JWT_REFRESH_TOKEN" }

// Response 401
(qualsevol error → el frontend mostra "Credencials incorrectes")
```

### `POST /auth/refresh`
```json
// Request
{ "refresh_token": "string" }

// Response 200
{ "access": "string", "refresh": "string" }

// Response 401/error → el frontend deslogueja l'usuari
```

### `GET /userdata`
```json
// Response 200
{
  "id": "string",
  "name": "string",
  "email": "string",
  "nickname": "string",
  "isAdmin": false,
  "platforms": [{ "id": 1, "name": "string", "key": "string" }]
}
```

---

## 2. EXERCISES

### `GET /exercises`
Query params:
- `search` — string, filtre per nom
- `offset` — int, paginació
- `muscle_id` — int
- `muscle_group_id` — int
- `equipment_id` — int
- `only_global` — bool
- `only_mine` — bool

```json
// Response 200
{
  "items": [
    {
      "id": 1,
      "name": "string",
      "description": "string",
      "is_global": false,
      "is_bodyweight": false,
      "equipment": { "id": 1, "name": "string" },
      "muscles": [
        { "id": 1, "name": "string", "is_primary": true, "muscle_group": { "id": 1, "name": "string" } }
      ]
    }
  ],
  "total": 100,
  "pageSize": 10
}
```

### `POST /exercises`
```json
// Request
{
  "name": "string",
  "description": "string",
  "equipment_id": 1,
  "is_global": false,
  "is_bodyweight": false,
  "muscles": [{ "muscle_id": 1, "is_primary": true }]
}
// Response 201: Exercise object
```

### `PUT /exercises/{id}`
```json
// Request: (igual que POST)
// Response 200: Exercise object
```

### `DELETE /exercises/{id}`
```
// Response 204
```

---

## 3. CATÀLEGS (Muscles, Equipment)

### `GET /muscle-groups`
```json
// Response 200
{ "items": [{ "id": 1, "name": "string" }] }
```

### `GET /muscles`
Query: `muscle_group_id` (opcional)
```json
// Response 200
{ "items": [{ "id": 1, "name": "string", "muscle_group": { "id": 1, "name": "string" } }] }
```

### `GET /equipment`
```json
// Response 200
{ "items": [{ "id": 1, "name": "string" }] }
```

---

## 4. ROUTINES

### `GET /routines`
```json
// Response 200
{
  "items": [
    {
      "id": 1,
      "name": "string",
      "description": "string",
      "is_default": false,
      "is_global": false
    }
  ]
}
```

### `GET /routines/{id}`
```json
// Response 200
{
  "id": 1,
  "name": "string",
  "description": "string",
  "is_default": false,
  "is_global": false,
  "days": [
    {
      "id": 1,
      "day_number": 1,
      "name": "Dia 1 - Pit i Tríceps",
      "exercises": [
        {
          "id": 1,
          "exercise_id": 5,
          "exercise": { "id": 5, "name": "string", "equipment": {...}, "muscles": [...] },
          "order_index": 0,
          "sets_target": 4,
          "reps_target": 10,
          "weight_target": 80.0,
          "rest_seconds": 90
        }
      ]
    }
  ]
}
```

### `POST /routines`
```json
// Request
{ "name": "string", "description": "string", "is_global": false }
// Response 201: Routine object
```

### `PUT /routines/{id}`
```json
// Request: (igual que POST)
// Response 200: Routine object
```

### `DELETE /routines/{id}`
```
// Response 204
```

### `PUT /routines/{id}/set-default`
```
// No body
// Response 200
// Efecte: marca aquesta rutina com a default per l'usuari, desmarquei les altres
```

### `GET /routines/{id}/next-day`
```json
// Response 200
{
  "day": {
    "id": 1,
    "day_number": 2,
    "name": "string",
    "exercises": [...]
  }
}
// Lògica: retorna el pròxim dia que toca entrenar d'aquesta rutina
// basat en l'historial d'entrenaments de l'usuari
```

### `POST /routines/{id}/days`
```json
// Request
{ "day_number": 1, "name": "string" }
// Response 201: Day object
```

### `PUT /routines/{id}/days/{dayId}`
```json
// Request: { "day_number": 1, "name": "string" }
// Response 200: Day object
```

### `DELETE /routines/{id}/days/{dayId}`
```
// Response 204
```

### `POST /routines/{id}/days/{dayId}/exercises`
```json
// Request
{
  "exercise_id": 5,
  "order_index": 0,
  "sets_target": 4,
  "reps_target": 10,
  "weight_target": 80.0,
  "rest_seconds": 90
}
// Response 201: RoutineExercise object
```

### `PUT /routines/{id}/days/{dayId}/exercises/{exerciseId}`
```json
// Request: (igual que POST)
// Response 200: RoutineExercise object
```

### `DELETE /routines/{id}/days/{dayId}/exercises/{exerciseId}`
```
// Response 204
```

### `POST /routines/{id}/days/{dayId}/start`
```json
// Request
{ "date": "2024-01-15", "notes": "string o null" }

// Response 201: Workout creat, amb exercises pre-populats del dia de rutina
{
  "id": 42,
  "date": "2024-01-15",
  "notes": null,
  "status": "active",
  "started_at": "2024-01-15T10:00:00Z",
  "finished_at": null,
  "workout_exercises": [
    {
      "id": 1,
      "exercise_id": 5,
      "exercise": { "id": 5, "name": "string", ... },
      "order_index": 0,
      "sets_target": 4,
      "reps_target": 10,
      "weight_target": 80.0,
      "rest_seconds": 90,
      "sets": []
    }
  ]
}
```

---

## 5. WORKOUTS

### `GET /workouts`
Query params:
- `date_from` — string YYYY-MM-DD
- `date_to` — string YYYY-MM-DD

```json
// Response 200
{
  "items": [
    {
      "id": 1,
      "date": "2024-01-15",
      "notes": "string o null",
      "status": "active | finished",
      "started_at": "ISO timestamp o null",
      "finished_at": "ISO timestamp o null"
    }
  ]
}
```

### `GET /workouts/active`
```json
// Response 200: Workout object (igual que GET /workouts/{id}) si n'hi ha un d'actiu
// Response 200: null si no n'hi ha cap
// IMPORTANT: Aquest endpoint ha d'estar ABANS de /workouts/{id} al router del backend
//            per evitar que "active" es tracti com un id numèric
```

### `GET /workouts/{id}`
```json
// Response 200
{
  "id": 1,
  "date": "2024-01-15",
  "notes": "string o null",
  "status": "active | finished",
  "started_at": "ISO timestamp o null",
  "finished_at": "ISO timestamp o null",
  "workout_exercises": [
    {
      "id": 1,
      "exercise_id": 5,
      "exercise": { "id": 5, "name": "string", "equipment": {...}, "muscles": [...] },
      "order_index": 0,
      "sets_target": 4,
      "reps_target": 10,
      "weight_target": 80.0,
      "rest_seconds": 90,
      "sets": [
        {
          "id": 1,
          "set_number": 1,
          "reps": 10,
          "weight": 80.0,
          "rest_seconds": 90,
          "notes": "string o null",
          "is_failed": false,
          "is_dropset": false
        }
      ]
    }
  ]
}
```

### `POST /workouts`
```json
// Request
{ "date": "2024-01-15", "notes": "string o null" }
// Response 201: Workout object (sense workout_exercises)
```

### `PUT /workouts/{id}`
```json
// Request
{
  "status": "active | finished",
  "finished_at": "2024-01-15T11:30:00Z"
}
// Response 200: Workout object
```

### `DELETE /workouts/{id}`
```
// Response 204
```

### `POST /workouts/{id}/exercises`
```json
// Request
{ "exercise_id": 5 }
// Response 201: WorkoutExercise object (amb sets buit)
{
  "id": 1,
  "exercise_id": 5,
  "exercise": { "id": 5, "name": "string", ... },
  "order_index": 0,
  "sets_target": null,
  "reps_target": null,
  "weight_target": null,
  "rest_seconds": null,
  "sets": []
}
```

### `DELETE /workouts/{id}/exercises/{weId}`
```
// Response 204
```

### `POST /workouts/{id}/exercises/{weId}/sets`
```json
// Request
{
  "set_number": 1,
  "reps": 10,
  "weight": 80.0,
  "rest_seconds": 90,
  "notes": "string o null",
  "is_failed": false,
  "is_dropset": false
}
// Response 201: Set object
```

### `PUT /workouts/{id}/exercises/{weId}/sets/{setId}`
```json
// Request
{
  "reps": 10,
  "weight": 80.0,
  "rest_seconds": 90,
  "notes": "string o null",
  "is_failed": false,
  "is_dropset": false
}
// Response 200: Set object
```

### `DELETE /workouts/{id}/exercises/{weId}/sets/{setId}`
```
// Response 204
```

### `PATCH /workouts/{id}/exercises/reorder`
```json
// Request
{ "order": [{ "id": 1, "order_index": 0 }, { "id": 2, "order_index": 1 }] }
// Response 200
```

---

## 6. STATS

### `GET /stats/overview`
Query params: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
```json
// Response 200
{
  "total_workouts": 50,
  "this_month": 8,
  "total_volume_kg": 125000.0,
  "favorite_exercise": { "name": "Esquat", "times": 20 }
}
```

### `GET /stats/exercises/{exerciseId}`
```json
// Response 200
{
  "exercise": { "id": 5, "name": "string" },
  "sessions": [
    {
      "date": "2024-01-15",
      "max_weight": 100.0,
      "total_volume": 3200.0,
      "avg_reps": 9.5,
      "total_sets": 4,
      "total_reps": 38,
      "max_reps": 12,
      "is_pr": true
    }
  ]
}
```

### `GET /stats/exercises/{exerciseId}/pr`
```json
// Response 200
{
  "best_weight": { "weight": 120.0, "reps": 5, "date": "2024-01-10" },
  "best_volume": { "volume": 4500.0, "sets": 5, "date": "2024-01-05" }
}
```

### `GET /stats/muscle-groups/{muscleGroupId}`
```json
// Response 200
{
  "muscle_group": { "id": 1, "name": "Pectoral" },
  "sessions": [
    { "date": "2024-01-15", "total_volume": 5600.0 }
  ],
  "bests": [
    { "id": 5, "name": "Press de banca", "best_weight": 100.0, "best_reps": 10, "times_trained": 15 }
  ]
}
```

---

## Notes Importants

### 1. Usuari autenticat
Tots els endpoints retornen dades filtrades per l'usuari autenticat via JWT. El backend ha d'extreure l'usuari del token.

### 2. Exercises globals vs pròpies
- `is_global: true` → exercici del sistema, no editable per usuaris normals
- `is_global: false` → exercici creat per l'usuari, editable i eliminable

### 3. Workout status
- `active` → entrenament en curs
- `finished` → entrenament completat
- Només pot haver-hi un workout `active` per usuari (`GET /workouts/active`)

### 4. Rutines globals vs pròpies
- `is_global: true` → plantilla del sistema (no editable per usuaris)
- `is_global: false` → rutina de l'usuari (editable)
- `is_default: true` → la rutina que el frontend mostra per defecte al dashboard

### 5. Ordre dels workout exercises
- `order_index` comença a 0
- `PATCH /reorder` actualitza tots els order_index en una sola crida

### 6. Sets en workout de rutina
Quan es comença un workout des d'una rutina (`POST /routines/{id}/days/{dayId}/start`):
- El workout es crea amb `workout_exercises` pre-populats
- Cada `workout_exercise` té `sets_target`, `reps_target`, `weight_target`, `rest_seconds` de la rutina
- Els `sets` (els reals) estan buits inicialment
- El frontend va creant sets reals amb `POST /workouts/{id}/exercises/{weId}/sets`

### 7. is_pr al stats
El camp `is_pr` a sessions indica si aquella sessió és un rècord personal de l'exercici. El backend ho calcula comparant el `max_weight` o `total_volume` amb sessions anteriors.

---

## Errors Esperats

El frontend gestiona errors de forma genèrica (mostra notificació d'error). Formats recomanats:

```json
// 400 Bad Request
{ "error": "string descriptiu" }

// 401 Unauthorized
{ "error": "Token expired" }

// 404 Not Found
{ "error": "Resource not found" }

// 422 Validation Error
{ "error": "string", "details": { "field": ["missatge"] } }
```
