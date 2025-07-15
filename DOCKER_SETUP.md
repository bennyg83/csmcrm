# CRM Application - Docker Development Setup

This guide will help you set up the CRM application using Docker, which eliminates port conflicts and process management issues.

## Prerequisites

1. **Docker Desktop** - Download and install from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Git** - For cloning the repository

## Quick Start

### Option 1: Using Batch Files (Windows)
```bash
# Start the development environment
start-dev.bat

# Stop the development environment
stop-dev.bat

# Reset everything (removes all containers, volumes, and images)
reset-dev.bat
```

### Option 2: Using Docker Compose Commands
```bash
# Start all services
docker-compose up --build

# Start in background
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f
```

## What's Included

The Docker setup includes:

- **PostgreSQL Database** (port 5432)
- **Backend API** (port 3000)
- **Frontend React App** (port 5173)
- **Automatic hot reload** for both frontend and backend
- **Persistent database** data

## Services

### Frontend (React + Vite)
- **URL**: http://localhost:5173
- **Hot Reload**: ✅ Enabled
- **Volume Mounts**: Source code changes reflect immediately

### Backend (Node.js + Express)
- **URL**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Hot Reload**: ✅ Enabled with nodemon
- **Database**: Connected to PostgreSQL container

### Database (PostgreSQL)
- **Host**: localhost
- **Port**: 5432
- **Database**: crm_db
- **Username**: crm_user
- **Password**: crm_password
- **Persistence**: Data survives container restarts

## Development Workflow

1. **Start the environment**:
   ```bash
   start-dev.bat
   ```

2. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Database: localhost:5432

3. **Make changes**:
   - Edit files in `frontend/` or `backend/`
   - Changes automatically reload

4. **Stop when done**:
   ```bash
   stop-dev.bat
   ```

## Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Stop all containers
docker-compose down

# Check what's using the ports
netstat -ano | findstr :3000
netstat -ano | findstr :5173
netstat -ano | findstr :5432

# Kill processes if needed
taskkill /PID <PID> /F
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build

# Or run seed script inside container
docker-compose exec backend npm run seed:comprehensive
```

### Container Issues
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Complete Reset
If everything is broken:
```bash
reset-dev.bat
start-dev.bat
```

## Benefits of This Setup

✅ **No Port Conflicts** - Each service runs in its own container  
✅ **Easy Cleanup** - One command stops everything  
✅ **Consistent Environment** - Works the same on any machine  
✅ **Hot Reload** - Development changes reflect immediately  
✅ **Isolated Dependencies** - No conflicts with system packages  
✅ **Easy Reset** - Start fresh anytime  

## Production Deployment

For production, you would:
1. Create production Dockerfiles (without dev dependencies)
2. Use environment variables for secrets
3. Set up proper logging and monitoring
4. Use a reverse proxy (nginx)
5. Set up SSL certificates

## Next Steps

1. Install Docker Desktop
2. Run `start-dev.bat`
3. Access the application at http://localhost:5173
4. Login with `admin@crm.com` / `admin123`

Enjoy development without port conflicts! 🚀 