# CRM System

A modern Customer Relationship Management (CRM) system built with React, TypeScript, Node.js, and PostgreSQL. Features comprehensive dashboard, account management, contact tracking, task management, Gmail integration, and team user management.

## 🚀 Features

### Core Functionality
- **Dashboard**: Overview of key metrics, recent activities, and account health scores
- **Account Management**: Full CRUD operations for customer accounts with tier-based categorization
- **Contact Management**: Comprehensive contact tracking with detailed profiles
- **Task Management**: Task creation, assignment, and tracking with due dates and priorities
- **Notes System**: Rich text notes with Google Docs-like formatting and export functionality
- **Health Scoring**: Account health monitoring with customizable scoring criteria
- **Activity Tracking**: Detailed activity logs for all account interactions

### 🔧 New in v2.3.0: Gmail Integration
- **Gmail API Integration**: Full OAuth2 authentication with Gmail API
- **Email-Contact Linking**: Automatic email thread management linking emails to CRM contacts
- **CSM Workflow Support**: Enhanced email linking for Customer Success Manager to Client workflows
- **Email History Display**: Complete email conversation history in contact detail pages
- **Advanced Email Sync**: Bidirectional email syncing with debug capabilities
- **Email Management**: Send, reply, and manage emails directly from the CRM

### 👥 New in v2.3.0: User Management System
- **Team User Management**: Create, edit, and manage internal team users
- **Role-Based Access Control**: Five role types (Admin, Manager, Sales, Support, User)
- **User Creation Wizard**: Streamlined user creation with automatic password generation
- **Enhanced Authentication**: Support for both Google SSO and internal user accounts
- **Admin Security**: Secure admin-only endpoints with proper authorization middleware

### Technical Features
- **Modern UI**: Material-UI components with responsive design and role-based indicators
- **TypeScript**: Full type safety across frontend and backend
- **Docker Support**: Containerized development and deployment
- **PostgreSQL**: Robust relational database with proper indexing
- **RESTful API**: Clean, documented API endpoints with role-based security
- **Authentication**: JWT-based authentication system with Google OAuth2 integration
- **Real-time Updates**: WebSocket support for live data updates

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **React Quill** for rich text editing
- **Vite** for build tooling

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **TypeORM** for database ORM
- **PostgreSQL** database
- **JWT** for authentication
- **CORS** enabled for cross-origin requests

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for multi-container orchestration
- **PostgreSQL 15** as the database

**Connectivity:** This CRM uses its own database and ports. For GitHub Pages frontends and Tailscale routing (one Tailscale install for two projects/frontends), see **TAILSCALE.md**. Port segregation is documented in **PORTS.md**. To host the frontend on GitHub Pages, see **GITHUB_PAGES.md**.

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Docker** and **Docker Compose**
- **Node.js** (v16 or higher) - for local development
- **Git**

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/bennyg83/csmcrm.git
   cd csmcrm
   ```

2. **Start the development environment**
   ```bash
   # On Windows
   .\start-dev.ps1
   
   # Or manually
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3002 (default; port 3000 not used)
   - Database: localhost:5432

### Local Development

1. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   # Edit backend/.env with your database credentials
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your API URL
   ```

3. **Start the services**
   ```bash
   # Backend (in backend directory)
   npm run dev
   
   # Frontend (in frontend directory)
   npm run dev
   ```

## 📁 Project Structure

```
crm-2/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # API route controllers
│   │   ├── entities/       # TypeORM database entities
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic services
│   │   └── scripts/        # Database seeding scripts
│   ├── Dockerfile.dev      # Development Docker configuration
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── Dockerfile.dev      # Development Docker configuration
│   └── package.json
├── docker-compose.yml      # Multi-container orchestration
├── start-dev.ps1          # Windows development startup script
├── stop-dev.ps1           # Windows development shutdown script
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_db
DB_USER=crm_user
DB_PASSWORD=crm_password
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3002/api
```

### Database Setup

The database will be automatically created when you first run the application. You can also seed it with sample data:

```bash
# Using Docker
docker-compose exec backend npm run seed

# Or locally
cd backend
npm run seed
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (authenticated)
- `GET /api/auth/users/public` - Get all users (public, for development)

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID
- `POST /api/accounts` - Create new account
- `PATCH /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Contacts
- `GET /api/accounts/:accountId/contacts` - Get contacts for account
- `GET /api/accounts/:accountId/contacts/:contactId` - Get contact by ID
- `POST /api/accounts/:accountId/contacts` - Create new contact
- `PATCH /api/accounts/:accountId/contacts/:contactId` - Update contact
- `DELETE /api/accounts/:accountId/contacts/:contactId` - Delete contact

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🧪 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run seed         # Seed database with sample data
npm run typeorm      # Run TypeORM CLI commands
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose build --no-cache

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec postgres psql -U crm_user -d crm_db
```

## 🔒 Security

- JWT tokens for authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization
- SQL injection prevention through TypeORM

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Please contact the project maintainer for contribution guidelines.

## 📞 Support

For support and questions, please contact the development team. 