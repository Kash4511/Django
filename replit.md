# Project Overview

## Overview

This is a comprehensive AI-Powered PDF Lead Magnet Generator platform built for architects. The application features a React frontend with dark Neebo-inspired aesthetic and Django REST framework backend with JWT authentication. The platform integrates APITemplate.io for professional PDF template selection and generation, along with an AI assistant (Forma AI) for architecture-related questions and content generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript for type safety and modern React features
- **Build Tool**: Vite for fast development server and optimized builds
- **Development Server**: Configured to run on `0.0.0.0:5000` for Replit compatibility
- **Code Quality**: ESLint with TypeScript integration and React-specific rules
- **Styling**: CSS modules with modern CSS features and responsive design patterns

### Backend Architecture
- **Framework**: Django 5.0 with Django REST Framework for API endpoints
- **Authentication**: JWT-based authentication using djangorestframework-simplejwt
- **Database Models**:
  - User accounts with firm profiles
  - Lead magnet management with generation data
  - Forma AI conversation tracking
  - Template selection with captured answers
- **External Services**:
  - APITemplate.io integration for PDF template management
  - Prepared for OpenAI/Perplexity integration for AI content generation
- **Security**: CORS configured, JWT tokens, API key management via environment variables

### Development Setup
- **Monorepo Structure**: Frontend and Backend as separate directories for clear separation of concerns
- **Environment Configuration**: Replit-specific settings for seamless cloud development
- **Hot Reload**: Frontend configured with Vite's fast refresh for rapid development cycles

### Lead Magnet Creation Workflow
1. **Firm Profile Setup**: User enters business information and branding preferences
2. **Lead Magnet Details**: User answers questions about target audience, topics, and desired outcomes
3. **Template Selection** (NEW): User selects from professional PDF templates fetched from APITemplate.io
4. **Content Generation** (Prepared): AI will generate tailored content based on captured answers
5. **PDF Generation**: Template populated with content and downloaded as PDF

### Recent Changes (September 30, 2025)
- ✅ Implemented complete PDF template selection workflow
- ✅ Integrated APITemplate.io API for template fetching
- ✅ Added step 3 to Create Lead Magnet flow for template selection
- ✅ Created database models for storing template selections and user answers
- ✅ Built responsive template selection UI with loading/error states
- ✅ Prepared backend for AI content generation (awaiting OpenAI API key)

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 19.1.1 with TypeScript for type-safe component architecture
- **Routing**: React Router for navigation
- **HTTP Client**: Axios for API communication with JWT token management
- **Animations**: Framer Motion for smooth UI transitions
- **Icons**: Lucide React for modern icon set
- **Development Tools**: 
  - Vite 7.1.7 for build tooling and development server
  - TypeScript 5.8.3 for static type checking
  - ESLint with React-specific plugins for code quality

### Backend Dependencies
- **Core Framework**: Django 5.0 with Django REST Framework 3.16+
- **Authentication**: djangorestframework-simplejwt for JWT tokens
- **CORS**: django-cors-headers for cross-origin requests
- **Image Processing**: Pillow for image handling
- **Database**: SQLite (development), ready for PostgreSQL (production)
- **External APIs**: 
  - APITemplate.io (configured with API key: APITEMPLATE_API_KEY)
  - OpenAI/Perplexity (prepared, awaiting OPENAI_API_KEY)

### Platform Integration
- **Replit Platform**: Environment variables and domain configuration for seamless Replit deployment
- **Security Configuration**: CSRF and allowed hosts configured for Replit's domain structure
- **Development Environment**: Both frontend and backend configured for Replit's development workflow