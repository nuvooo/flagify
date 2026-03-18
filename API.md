# Togglely API Dokumentation

## Übersicht

### Base URLs

| Service | Local Development | Production (Coolify) |
|---------|------------------|----------------------|
| API | `http://localhost:4000/api` | `https://api.deine-domain.de/api` |
| SDK | `http://localhost:4000/sdk` | `https://api.deine-domain.de/sdk` |
| Frontend | `http://localhost:3000` | `https://app.deine-domain.de` |

### Architektur-Optionen

#### Option A: Getrennte Domains (Empfohlen für Production)
```
┌─────────────────┐      ┌─────────────────┐
│   SDK Client    │──────►│ api.togglely.de │
│   (deine App)   │      │   (Backend)     │
└─────────────────┘      └─────────────────┘
                                │
┌─────────────────┐      ┌──────┴──────────┐
│   Browser       │──────►│ app.togglely.de │
│   (Dashboard)   │      │   (Frontend)    │
└─────────────────┘      └─────────────────┘
```

**Vorteile:**
- Backend direkt für SDK erreichbar (bessere Performance)
- Klare Trennung der Services
- Einfacheres Scaling

**Coolify Setup:**
1. Erstelle zwei Domains in Coolify:
   - `api.deine-domain.de` → Backend Service (Port 4000)
   - `app.deine-domain.de` → Frontend Service (Port 3000)
2. Setze Environment Variables:
   ```
   CORS_ORIGINS=https://app.deine-domain.de,https://deine-app.de
   FRONTEND_URL=https://app.deine-domain.de
   ```
3. SDK Config:
   ```typescript
   const client = new TogglelyClient({
     baseUrl: 'https://api.deine-domain.de',  // Backend direkt!
     apiKey: 'xxx',
     project: 'my-project',
     environment: 'production'
   });
   ```

#### Option B: Single Domain (Einfacher)
```
┌─────────────────┐      ┌─────────────────┐
│   SDK Client    │──────►│ togglely.de/sdk │
│   (deine App)   │      │   (Frontend)    │
└─────────────────┘      └────────┬────────┘
                                  │
                           ┌──────┴────────┐
                           │   Backend     │
                           │   (intern)    │
                           └───────────────┘
```

**Vorteile:**
- Nur eine Domain nötig
- Backend bleibt intern

**Coolify Setup:**
1. Erstelle eine Domain:
   - `togglely.de` → Frontend Service
2. SDK Config:
   ```typescript
   const client = new TogglelyClient({
     baseUrl: 'https://togglely.de',  // Frontend URL!
     apiKey: 'xxx',
     project: 'my-project',
     environment: 'production'
   });
   ```

## Authentifizierung

### POST /auth/login
**Request:**
```json
{
  "email": "demo@togglely.io",
  "password": "demo123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "demo@togglely.io",
    "name": "Demo User"
  }
}
```

### POST /auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### GET /auth/me
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "demo@togglely.io",
    "firstName": "Demo",
    "lastName": "User",
    "name": "Demo User",
    "organizationId": "...",
    "organization": {...}
  }
}
```

### PATCH /auth/profile
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "firstName": "New",
  "lastName": "Name"
}
```

## Organisationen

### GET /organizations
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "organizations": [
    {
      "id": "...",
      "name": "Demo Organization",
      "slug": "demo-organization",
      "role": "OWNER"
    }
  ]
}
```

### GET /organizations/my
Eigene Organisation abrufen.

### POST /organizations
**Request:**
```json
{
  "name": "My Org",
  "slug": "my-org"
}
```

### GET /organizations/:id/members
Mitglieder einer Organisation abrufen.

## Projekte

### GET /projects
Alle Projekte des Benutzers abrufen.

**Response:**
```json
{
  "projects": [
    {
      "id": "...",
      "name": "Sample Project",
      "key": "sample-project",
      "type": "SINGLE",
      "environments": [...]
    }
  ]
}
```

### GET /projects/organization/:orgId
Projekte einer Organisation abrufen.

### POST /projects/organization/:orgId
**Request:**
```json
{
  "name": "New Project",
  "key": "new-project",
  "type": "SINGLE",
  "description": "...",
  "allowedOrigins": []
}
```

### GET /projects/:id/flags-with-brands
Projekt mit allen Flags und Brand-Werten abrufen.

## Feature Flags

### GET /feature-flags
Alle Feature Flags abrufen.

**Query:** `?projectId=xxx`

### GET /feature-flags/project/:projectId
Feature Flags eines Projekts abrufen.

### POST /feature-flags/project/:projectId
Feature Flag erstellen.

**Request:**
```json
{
  "name": "Dark Mode",
  "key": "dark_mode",
  "type": "BOOLEAN",
  "description": "...",
  "initialValues": {
    "development": { "enabled": true, "value": "true" },
    "production": { "enabled": false, "value": "false" }
  }
}
```

### POST /feature-flags/:flagId/toggle
Feature Flag togglen.

**Request:**
```json
{
  "environmentId": "...",
  "enabled": true
}
```

### PATCH /feature-flags/:flagId/environments/:envId/value
Wert eines Feature Flags ändern.

**Request:**
```json
{
  "enabled": true,
  "value": "true",
  "brandId": "..." // optional für Brand-spezifische Werte
}
```

### DELETE /feature-flags/:flagId
Feature Flag löschen.

## Brands

### GET /brands/project/:projectId
Brands eines Projekts abrufen.

### GET /brands/:brandId/flags
Flags mit Brand-spezifischen Werten abrufen.

## SDK

### GET /sdk/:projectKey/:environmentKey/:flagKey
Flag-Wert für SDK abrufen.

**Query:** `?brandKey=xxx`

**Response:**
```json
{
  "value": true,
  "enabled": true,
  "flagType": "BOOLEAN"
}
```

## Environments

### GET /environments/project/:projectId
Umgebungen eines Projekts abrufen.

### POST /environments
Umgebung erstellen.

**Request:**
```json
{
  "name": "Staging",
  "key": "staging",
  "projectId": "...",
  "organizationId": "..."
}
```

## API Keys

### GET /api-keys/my
Eigene API Keys abrufen.

### POST /api-keys/organization/:orgId
API Key erstellen.

**Request:**
```json
{
  "name": "SDK Key",
  "type": "SDK",
  "expiresInDays": 365
}
```
