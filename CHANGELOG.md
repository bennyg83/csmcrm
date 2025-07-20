# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2025-01-20

### 🔧 Major Features Added

#### Gmail Integration
- **Full Gmail API Integration**: Complete OAuth2 authentication with Gmail API
- **Email-Contact Linking**: Automatic email thread management linking emails to CRM contacts
- **CSM Workflow Support**: Enhanced email linking for Customer Success Manager to Client workflows
- **Email History Display**: Complete email conversation history in contact detail pages
- **Advanced Email Sync**: Bidirectional email syncing with debug capabilities
- **Email Management**: Send, reply, and manage emails directly from the CRM

#### User Management System
- **Complete User CRUD**: Create, read, update, and delete internal team users
- **Role-Based Access Control**: Five role types (Admin, Manager, Sales, Support, User)
- **User Creation Wizard**: Streamlined user creation with automatic password generation
- **Enhanced Authentication**: Improved auth system supporting both Google SSO and internal users
- **Admin Security**: Secure admin-only endpoints with proper middleware protection

### 🎨 UI/UX Enhancements
- **Tabbed Settings Page**: Organized settings with User Management and Account Tiers tabs
- **Enhanced Email Page**: Improved email interface with sync and debug capabilities
- **Role-Based Indicators**: Visual role indicators with colors and icons throughout the UI
- **Improved Notifications**: Better error handling and success notifications
- **Modern UI Components**: Enhanced forms, dialogs, and interactive elements

### 🔐 Security Improvements
- **Enhanced Authentication Flow**: Improved token management and session handling
- **Role-Based Middleware**: Secure API endpoints with proper authorization
- **Password Security**: Enhanced password hashing with bcrypt
- **Google OAuth Integration**: Secure OAuth flow with proper scope management
- **Admin Protection**: Self-deletion prevention and secure admin operations

### 🐛 Bug Fixes
- **Email Linking Logic**: Fixed bidirectional email conversation linking
- **Authentication Context**: Resolved authentication state management issues
- **Protected Routes**: Fixed routing problems with authentication guards
- **Database Schema**: Updated user roles enum with proper migration
- **DOM Nesting Warnings**: Fixed React DOM nesting warnings in email components
- **OAuth URL Construction**: Fixed double `/api` in Google OAuth URLs

### 🔄 Technical Improvements
- **Database Migrations**: Automatic schema updates for new user roles
- **Enhanced Email Service**: Improved email processing and contact matching
- **Debug Endpoints**: Added debug functionality for troubleshooting email sync
- **API Enhancements**: Extended API with user management endpoints
- **Type Safety**: Updated TypeScript types for new user properties

### 📝 Documentation
- **Release Notes**: Comprehensive version history and feature documentation
- **API Documentation**: Updated endpoint documentation for new features

## [2.2.0] - 2024-12-15

### Added
- Fully functional drag-and-drop Kanban board
- Enhanced task editing capabilities in all views
- Calendar view for task management
- Enhanced task detail management

### Fixed
- Task tracking between list and Kanban views
- Backend UUID validation issues
- Console warnings and improved error handling

## [2.1.0] - 2024-11-30

### Added
- Ollama LLM integration for document processing
- Enhanced document upload and extraction capabilities
- Improved account onboarding with document parsing
- Enhanced task management with comprehensive features

### Fixed
- Backend port conflicts and stability issues

## [2.0.0] - 2024-11-01

### Added
- Complete CRM system with React/TypeScript frontend
- Node.js/PostgreSQL backend with TypeORM
- User authentication and authorization
- Account and contact management
- Task management with categories, priorities, and dependencies
- Dashboard with analytics and charts
- Docker containerization

---

**Full Changelog**: [2.2.0...2.3.0](https://github.com/your-org/crm-project/compare/v2.2.0...v2.3.0) 