# Project Overview

## Overview

This is a full-stack web application with a React frontend and Django backend, designed for development on the Replit platform. The frontend is built with React 19, TypeScript, and Vite for fast development and modern tooling. The backend uses Django 5.0 with a clean project structure ready for API development and web services.

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
- **Framework**: Django 5.0 following standard Django project structure
- **Project Structure**: Clean separation with `django_project` as the main configuration package
- **Deployment**: Pre-configured for Replit with environment-based domain handling
- **Security**: CSRF protection configured for multiple trusted origins
- **Server Configuration**: Both WSGI and ASGI support for different deployment scenarios

### Development Setup
- **Monorepo Structure**: Frontend and Backend as separate directories for clear separation of concerns
- **Environment Configuration**: Replit-specific settings for seamless cloud development
- **Hot Reload**: Frontend configured with Vite's fast refresh for rapid development cycles

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 19.1.1 and React DOM for modern component architecture
- **Development Tools**: 
  - Vite 7.1.7 for build tooling and development server
  - TypeScript 5.8.3 for static type checking
  - ESLint with React-specific plugins for code quality
- **Build Pipeline**: Vite with React plugin for optimized production builds

### Backend Dependencies
- **Core Framework**: Django 5.0 for web framework and ORM capabilities
- **Database**: Currently using Django's default SQLite (ready for PostgreSQL integration)
- **Authentication**: Django's built-in authentication system
- **Admin Interface**: Django admin for content management

### Platform Integration
- **Replit Platform**: Environment variables and domain configuration for seamless Replit deployment
- **Security Configuration**: CSRF and allowed hosts configured for Replit's domain structure
- **Development Environment**: Both frontend and backend configured for Replit's development workflow