# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2025-01-17

### Added
- Fully functional drag-and-drop Kanban board for task management
- Calendar view for task visualization and management
- Task detail page with comprehensive task information
- Enhanced task editing capabilities across all views
- Proper drop zones for Kanban columns and task cards
- Visual feedback for drag-and-drop operations

### Enhanced
- Task tracking between list view and Kanban board - changes now sync immediately
- Task editing functionality - works in both list and Kanban views
- User experience with better drag-and-drop interactions
- Console output - reduced warnings and debug messages
- Error handling for task updates and status changes
- Task status management with proper validation

### Fixed
- Task tracking issues between different views
- Backend 500 errors when updating tasks with empty UUID fields
- Edit button functionality in Kanban board task cards
- Drag-and-drop confusion between task IDs and status values
- React key prop warnings in UserAutocomplete component
- Console warnings and debug output cleanup
- UUID validation errors when saving tasks

### Technical
- Improved TypeScript typing for task status values
- Better separation of draggable and clickable areas in task cards
- Enhanced error handling for task operations
- Optimized component re-rendering and state management
- Cleaned up development console output

## [2.1.0] - 2024-12-19

### Added
- Ollama LLM integration for document processing
- Document upload component with drag-and-drop functionality
- Enhanced document extraction with rule-based parsing
- Integration of document processing into account onboarding
- Support for parsing handover documents with structured data extraction
- Docker Compose configuration for Ollama container
- Comprehensive version control with trunk-based development

### Enhanced
- Document processing capabilities with improved extraction logic
- Account onboarding workflow with document upload integration
- Backend stability and error handling
- Task management system with comprehensive features
- API error handling and validation

### Fixed
- Backend port conflicts (EADDRINUSE errors)
- DOM nesting warnings in React components
- Task creation 500 errors due to missing progress field
- Frontend-backend communication issues
- Docker container startup and networking issues

### Technical
- Updated dependencies and resolved compatibility issues
- Improved error handling and logging
- Enhanced API response formatting
- Better separation of concerns in document processing

## [2.0.0] - 2024-12-19

### Added
- Complete CRM system with React/TypeScript frontend
- Node.js/PostgreSQL backend with TypeORM
- User authentication and authorization system
- Account and contact management
- Task management with categories, priorities, and dependencies
- Dashboard with analytics and charts
- Docker containerization
- Comprehensive seeding scripts
- Health monitoring and scoring system

### Features
- Multi-user support with role-based access
- Real-time data updates
- Advanced filtering and sorting capabilities
- Responsive Material-UI interface
- RESTful API with proper error handling
- Database migrations and seeding
- Development and production configurations 