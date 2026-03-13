# 🚩 Flagify - Feature Flag Management Platform

![Flagify Dashboard](screenshot.png)

A complete, self-hosted Feature Flag Management Platform. Manage feature flags, organizations, projects, and environments with a modern web interface and a powerful API.

🌐 **Live Demo**: [flagify.examplesart.de](https://flagify.examplesart.de/)  
📖 **Documentation**: [flagify.examplesart.de/docs](https://flagify.examplesart.de/docs)  
💻 **GitHub**: [github.com/nuvooo/flagify](https://github.com/nuvooo/flagify)

## ✨ Features

- 🔐 **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Owner, Admin, Member, Viewer)
  - Organization-based multi-tenant architecture

- 🏢 **Organizations & Projects**
  - Multiple organizations per user
  - Projects within organizations
  - Team management with invitations

- 🌍 **Environments**
  - Development, Staging, Production
  - Independent flag states per environment

- 🚦 **Feature Flags**
  - Multiple types: Boolean, String, Number, JSON
  - Targeting rules with conditions
  - Real-time updates

- 📊 **Audit Logs**
  - Traceability of all changes
  - Filtering by user, project, entity

- 🔑 **API Keys**
  - Server, Client, and SDK Keys
  - Expiration dates and revocation

- 🚀 **SDKs for Various Languages**
  - Official JavaScript/TypeScript SDK
  - Easy integration into applications

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/nuvooo/flagify.git
cd flagify
```

2. **Start Docker Containers**

```bash
docker-compose up -d
```

3. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Health: http://localhost:4000/health

### Demo Credentials

- **Email**: `demo@flagify.io`
- **Password**: `demo1234`

## 📁 Project Structure

```
flagify/
├── backend/           # Node.js/Express Backend API
│   ├── src/
│   │   ├── controllers/   # API Controllers
│   │   ├── middleware/    # Express Middleware
│   │   ├── routes/        # API Routes
│   │   ├── services/      # Business Logic
│   │   └── utils/         # Utilities
│   └── prisma/            # Database Schema
├── frontend/          # React/TypeScript Frontend
│   └── src/
│       ├── components/    # React Components
│       ├── pages/         # Page Components
│       └── store/         # Zustand Stores
├── sdk/               # Official SDKs
│   └── javascript/    # JS/TS SDK
└── docker-compose.yml # Docker Compose Configuration
```

## 🔧 Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Environment variables:
- `DATABASE_URL` - MongoDB connection URL
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - Secret key for JWT
- `PORT` - API port (default: 4000)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |

### Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organizations` | List organizations |
| POST | `/api/organizations` | Create organization |
| GET | `/api/organizations/:id` | Organization details |
| GET | `/api/organizations/:id/members` | List members |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/organization/:orgId` | List projects |
| POST | `/api/projects/organization/:orgId` | Create project |
| GET | `/api/projects/:id` | Project details |

### Feature Flags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feature-flags/project/:projectId` | List flags |
| POST | `/api/feature-flags/project/:projectId` | Create flag |
| POST | `/api/feature-flags/:id/toggle` | Toggle flag |
| PATCH | `/api/feature-flags/:id/value` | Change value |

### SDK Endpoints (for client applications)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sdk/flags/:environmentKey` | All flags |
| GET | `/sdk/flags/:environmentKey/:flagKey` | Single flag |
| POST | `/sdk/evaluate/:environmentKey/:flagKey` | Evaluate with context |

## 💻 SDK Integration

### JavaScript/TypeScript

```bash
npm install @flagify/sdk
```

```typescript
import { FlagifyClient } from '@flagify/sdk';

const client = new FlagifyClient({
  apiKey: 'your-api-key',
  environment: 'production',
  baseUrl: 'https://your-flagify-instance.com'
});

// Check boolean flag
const isEnabled = await client.isEnabled('new-feature');
if (isEnabled) {
  // Show new functionality
}

// Get string value
const message = await client.getString('welcome-message', 'Welcome!');

// Get number value
const limit = await client.getNumber('max-items', 10);

// Get JSON configuration
const config = await client.getJSON('app-config', {});

// With context (for targeting)
client.setContext({
  userId: '123',
  email: 'user@example.com',
  country: 'DE'
});
const isEnabledForUser = await client.isEnabled('beta-feature');
```

## 🏗️ Architecture

### Multi-Tenant Architecture

Flagify uses an organization-based multi-tenant architecture:

```
Users
  └── Organizations (Owner, Admin, Member, Viewer)
        └── Projects
              └── Environments (Dev, Staging, Prod)
                    └── Feature Flags
                          └── Targeting Rules
```

### Database Schema

- **MongoDB**: Document-based database for all data
- **Redis**: Caching for SDK requests (30s TTL)

### Security

- Passwords hashed with bcrypt
- JWT for session management
- API Keys for SDK access
- Role-based access control

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB URL | - |
| `REDIS_URL` | Redis URL | - |
| `JWT_SECRET` | JWT Secret | - |
| `PORT` | API Port | 4000 |
| `NODE_ENV` | Environment | development |

## 🧪 Testing

```bash
# Backend Tests
cd backend
npm test

# Frontend Tests
cd frontend
npm test
```

## 📦 Deployment

### Docker Production

```bash
# Build
docker-compose -f docker-compose.yml build

# Start
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

1. Install MongoDB and Redis
2. Install Node.js 20+
3. Build and start backend
4. Build and serve frontend

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Create a fork
2. Feature Branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push branch: `git push origin feature/AmazingFeature`
5. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Credits

- Built with React, Node.js, MongoDB, Redis
- Icons by Heroicons
