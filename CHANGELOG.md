# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.1-buggy] - 2025-08-18

### 🚨 **KNOWN ISSUES**
- **Client Portal Dashboard**: Shows internal server error due to `EntityPropertyNotFoundError: Property "notes" was not found in "Task"`
- **Task Management**: External task endpoints fail due to entity relation issues
- **Error Location**: `ExternalTaskController.getTaskDetails` method at line 112

### ✅ **WORKING FUNCTIONALITY**
- **Google SSO Authentication**: Fully functional without errors
- **Internal User Login**: Working correctly
- **Password Reset**: Available at `/client/password-reset` and functioning
- **External User Portal**: Basic login and password reset working
- **Core CRM Features**: Accounts, contacts, basic operations functional

### 🔧 **TECHNICAL STATE**
- **API Configuration**: Using direct `localhost:3000` connection (working)
- **Database**: PostgreSQL running on port 5434, connected and functional
- **Services**: Backend, frontend, and database all running successfully
- **Version Rollback**: Successfully restored from broken entity relation fixes

### 📝 **NOTES**
- This version represents a stable state with core authentication working
- Client portal dashboard functionality is limited due to entity relation errors
- Version marked as "-buggy" to indicate known issues while preserving working functionality
- Can be used as a restore point for future debugging attempts

## [2.4.0] - 2025-08-14

### 🔧 Major Features Added

#### Welcome Email System
- **Automatic Welcome Emails**: New users now receive professional welcome emails when accounts are created
- **Gmail Integration**: Leverages existing Gmail API integration for sending system emails
- **SMTP Fallback**: Backup email service using SMTP if Gmail integration fails
- **Professional Templates**: Both plain text and HTML email templates with branding
- **Enhanced Onboarding**: Users receive login credentials and app URLs automatically

#### Task Management Improvements
- **Unified Task Components**: Standardized TaskTable and KanbanBoard across Account and Contact pages
- **Full-Width Layout**: Tasks sections now match Notes section width for consistent UI
- **Enhanced Task Display**: Tasks on contact pages now use the same components as main tasks page
- **Improved Task Filtering**: Better task assignment and filtering for client users

#### Global Search Enhancement
- **Cross-Page Search**: Search functionality available from any screen in the UI
- **Multi-Entity Search**: Search across accounts, contacts, tasks, and emails
- **Direct Navigation**: Search results lead directly to relevant detail pages
- **Pre-filled Search**: Global search can pre-populate search fields on target pages

### 🎨 UI/UX Enhancements
- **Consistent Layout**: Account and Contact pages now have matching task section layouts
- **Better Task Integration**: Contact pages display tasks with full table/kanban functionality
- **Improved Navigation**: Better flow between different sections and pages
- **Enhanced User Experience**: More intuitive task management and user onboarding

### 🔐 Security & Authentication
- **Enhanced User Creation**: Admin-created users now receive proper onboarding emails
- **Better Password Management**: Temporary passwords are securely communicated via email
- **Improved User Flow**: New users can immediately access the system with provided credentials

### 🚀 Technical Improvements
- **Email Service Architecture**: Robust email service with fallback capabilities
- **Component Reusability**: Shared TaskTable component across multiple pages
- **Better Error Handling**: Graceful degradation when email services are unavailable
- **Code Organization**: Improved separation of concerns and service architecture

---

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

**Full Changelog**: [2.2.0...2.3.0](https://github.com/bennyg83/csmcrm/compare/v2.2.0...v2.3.0) 