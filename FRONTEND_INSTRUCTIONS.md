# WorldGym — Frontend Agent Instructions

## Visió general

Aplicació mòbil/web de gimnàs per registrar entrenaments. L'usuari pot:
- Gestionar una biblioteca d'exercicis (globals + propis)
- Crear rutines setmanals amb dies i exercicis planificats
- Iniciar sessions d'entrenament (workouts) i apuntar series, reps i pes en temps real
- Veure l'historial d'entrenaments

**API base URL:** `http://localhost:8000/api`
**Autenticació:** Bearer token a la capçalera `Authorization: Bearer {token}`

---

## Autenticació

### Login
```
POST /auth/login
Body: { "username": "email@exemple.com", "password": "..." }
Response: { "access": "TOKEN", "refresh": "REFRESH_TOKEN" }
```
Guarda `access` i `refresh` a localStorage/SecureStorage.
Afegeix `Authorization: Bearer {access}` a totes les crides autenticades.

### Refresh
```
POST /auth/refresh
Body: { "refresh_token": "REFRESH_TOKEN" }
Response: { "access": "NOU_TOKEN", "refresh": "NOU_REFRESH" }
```
Quan una crida retorni 401, fes refresh automàtic i reintenta.

### Dades de l'usuari autenticat
```
GET /userdata
Response: { "id": "uuid", "name": "Mateu", "nickname": "mateu", "email": "...", "isAdmin": true/false }
```

---

## Estructura de pantalles que has de crear

### 1. Auth
- **Login screen** — formulari email + password. En submit crida `POST /auth/login`, guarda tokens i redirigeix a Home.

---

### 2. Home / Dashboard
Pantalla principal amb:
- Últims 5 workouts (`GET /workouts?page=1`)
- Botó prominent "Entrenar avui" → obre modal per escollir rutina o crear workout buit
- Accés ràpid a Rutines i Exercicis

---

### 3. Exercicis (`/exercises`)

#### Llistat
```
GET /exercises
Query params opcionals: search, equipment_id, muscle_id, only_global, only_mine
Response: { data: [...], total, page, ... }
```
Cada exercici:
```json
{
  "id": 1,
  "name": "Bench Press",
  "description": null,
  "is_global": true,
  "user_id": null,
  "equipment": { "id": 1, "name": "Barra" },
  "muscles": [
    { "id": 1, "name": "Pectoral major", "pivot": { "is_primary": true } },
    { "id": 5, "name": "Tríceps", "pivot": { "is_primary": false } }
  ]
}
```
- Mostra filtre per grup muscular i equipament
- Tabs: "Tots" / "Globals" / "Els meus"
- Botó "+" per crear exercici personal

#### Crear/editar exercici
```
POST /exercises
PUT  /exercises/{id}
Body: {
  "name": "string",
  "description": "string|null",
  "equipment_id": 1,
  "is_global": false,
  "muscles": [
    { "muscle_id": 1, "is_primary": true },
    { "muscle_id": 5, "is_primary": false }
  ]
}
```
- Selector d'equipament: `GET /equipment` → `[{ "id": 1, "name": "Barra" }, ...]`
- Selector de músculs: `GET /muscles` → llista amb grup muscular. Permet marcar quins treballa i si és primari/secundari.
- Usuaris normals no poden crear exercicis globals (`is_global: false` sempre per no-admins)

---

### 4. Rutines (`/routines`)

#### Llistat
```
GET /routines
Response: { data: [{ "id": 1, "name": "Push/Pull 4 dies", "is_global": false, ... }] }
```

#### Detall d'una rutina
```
GET /routines/{id}
Response: {
  "id": 1,
  "name": "...",
  "days": [
    {
      "id": 1,
      "day_number": 1,
      "name": "Dia 1 - Pit i Tríceps",
      "exercises": [
        {
          "id": 1,
          "order_index": 1,
          "sets_target": 4,
          "reps_target": 8,
          "weight_target": 70,
          "rest_seconds": 90,
          "exercise": { "id": 1, "name": "Bench Press", "equipment": {...}, "muscles": [...] }
        }
      ]
    }
  ]
}
```
- Mostra els dies en ordre (`day_number`)
- Cada dia mostra els exercicis planificats amb els objectius (sets × reps @ kg)
- Botó "Entrenar aquest dia" → crida `POST /routines/{id}/days/{dayId}/start`

#### Crear/editar rutina
```
POST /routines     Body: { "name": "...", "description": "...", "is_global": false }
PUT  /routines/{id}
```

#### Gestió de dies
```
POST /routines/{routineId}/days     Body: { "day_number": 1, "name": "Dia 1 - Pit" }
PUT  /routines/{routineId}/days/{id}
DELETE /routines/{routineId}/days/{id}
```

#### Afegir exercici a un dia
```
POST /routines/{routineId}/days/{dayId}/exercises
Body: {
  "exercise_id": 1,
  "order_index": 1,
  "sets_target": 4,
  "reps_target": 8,
  "weight_target": 70.0,
  "rest_seconds": 90
}
PUT    /routines/{routineId}/days/{dayId}/exercises/{id}
DELETE /routines/{routineId}/days/{dayId}/exercises/{id}
```

#### Iniciar workout des d'un dia de rutina ⭐
```
POST /routines/{routineId}/days/{dayId}/start
Body: { "date": "2026-03-08", "notes": null }
Response: workout complet amb tots els exercicis i series ja creats amb els valors objectiu
```
Redirigeix directament a la pantalla d'entrenament actiu amb el workout retornat.

---

### 5. Entrenaments — Historial (`/workouts`)

#### Llistat
```
GET /workouts
Query: date_from, date_to
Response: { data: [{ "id": 1, "date": "2026-03-07", "notes": "Dia 2 - Esquena i Bíceps", ... }] }
```
Mostra llista ordenada per data desc. Cada item mostra data, notes i un resum.

#### Detall d'un workout
```
GET /workouts/{id}
Response: {
  "id": 1,
  "date": "2026-03-07",
  "notes": "...",
  "workout_exercises": [
    {
      "id": 1,
      "order_index": 1,
      "exercise": { "name": "Bench Press", "equipment": {...}, "muscles": [...] },
      "sets": [
        { "id": 1, "set_number": 1, "reps": 8, "weight": 70.00, "rest_seconds": 90, "notes": null },
        { "id": 2, "set_number": 2, "reps": 8, "weight": 68.00, "rest_seconds": 90, "notes": null }
      ]
    }
  ]
}
```

---

### 6. Entrenament actiu ⭐ (pantalla principal de l'app)

Aquesta és la pantalla més important. S'activa quan:
- L'usuari fa "Iniciar workout des d'una rutina" (`/start`)
- O crea un workout buit manualment

**Flux:**

1. **Crear workout** (si és buit):
```
POST /workouts   Body: { "date": "2026-03-08", "notes": "Dia lliure" }
→ { "id": 3 }
```

2. **Afegir exercici al workout** (si no ve de rutina):
```
POST /workouts/{workoutId}/exercises
Body: { "exercise_id": 1, "order_index": 1 }
→ { "id": 10, ... }
```

3. **Per cada exercici, afegir series en temps real:**
```
POST /workouts/{workoutId}/exercises/{workoutExerciseId}/sets
Body: { "set_number": 1, "reps": 8, "weight": 70, "rest_seconds": 90 }
```

4. **Editar una sèrie** (per corregir reps/pes):
```
PUT /workouts/{workoutId}/exercises/{workoutExerciseId}/sets/{id}
Body: { "reps": 7, "weight": 68 }
```

5. **Esborrar sèrie:**
```
DELETE /workouts/{workoutId}/exercises/{workoutExerciseId}/sets/{id}
```

**UI recomanada per l'entrenament actiu:**
- Llista d'exercicis en vertical, plegables (accordion)
- Cada exercici mostra una taula de series: Set# | Reps | Kg | Descans
- Botó "+" per afegir nova sèrie (auto-increment de set_number)
- Cada fila de sèrie és editable in-line
- Temporitzador de descans opcional (rest_seconds com a referència)
- Botó "Afegir exercici" al final per afegir exercicis addicionals

---

## Catàlegs de referència (per selectors)

Aquests endpoints s'usen per omplir dropdowns i filtres:

```
GET /muscle-groups   → [{ "id": 1, "name": "Pit" }, { "id": 2, "name": "Esquena" }, ...]
GET /muscles         → [{ "id": 1, "name": "Pectoral major", "muscle_group": { "id": 1, "name": "Pit" } }, ...]
GET /muscles?muscle_group_id=1   → filtra per grup
GET /equipment       → [{ "id": 1, "name": "Barra" }, { "id": 2, "name": "Mancuerna" }, ...]
```

---

## Format de resposta de l'API

Totes les respostes segueixen aquest format:
```json
{ "success": true, "data": { ... } }
```
o en llistats paginats:
```json
{ "success": true, "data": [ ... ], "total": 30, "page": 1, "per_page": 15 }
```
En cas d'error:
```json
{ "success": false, "error": "codi.error", "message": "Missatge llegible" }
```

---

## Errors comuns

| Codi HTTP | Significat |
|---|---|
| 401 | Token expirat → fes refresh |
| 403 | Acció no permesa (ex: editar exercici d'un altre usuari) |
| 404 | Recurs no trobat |
| 422 | Camp requerit que falta (el missatge indica quin) |

---

## Dades de prova disponibles

L'API ja té dades carregades:
- **Usuari:** `mateu@worldgym.local` / `password123`
- **Exercicis globals:** Bench Press (id:1), Pull Up (id:2), Leg Press (id:3), Bicep Curl (id:4), Tricep Pushdown (id:5)
- **Exercicis personals:** Incline Dumbbell Press, Cable Fly, Dips, Hammer Curl
- **Rutina:** "Rutina Push/Pull - 4 dies" (id:1) amb 3 dies configurats
- **Workouts:** 5 de març (Pit, id:2) i 7 de març (Esquena, id:1) amb totes les series

---

## Prioritat d'implementació

1. **Auth** — login + gestió de tokens
2. **Entrenament actiu** — la funcionalitat core
3. **Historial de workouts** — veure el passat
4. **Rutines** — gestió i inici d'entrenament des de rutina
5. **Exercicis** — catàleg i creació personal
6. **Catàlegs** (grups musculars, músculs, equipament) — pantalles d'admin opcionals
