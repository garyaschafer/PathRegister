# Overview

Register Path is a comprehensive library events management application that enables public libraries to create events with direct registration, payment processing, QR-coded ticket generation, and staff check-in functionality. The system provides a complete end-to-end solution for event management, from creation through attendee check-in, with integrated payment processing via Stripe and automated email notifications.

## Recent Changes (August 2025)

- **Architecture Simplified**: Successfully migrated from Event->Session->Registration to direct Event->Registration model
- **Database Migration**: Removed sessions table and moved capacity, room, price, allowWaitlist fields directly to events
- **Registration Flow**: Users now register directly for events with copy functionality for different times
- **Copy Feature**: Admin can duplicate events and modify timing/details for recurring events
- **Session References Cleanup**: Completed comprehensive review and removal of all remaining session references from codebase including QR ticket component, email service, and reminder jobs
- **Modal Fix (Aug 13)**: Resolved persistent runtime error by replacing complex Radix/React Hook Form modal with simple HTML-based modal. Registration now works successfully.
- **Registration List View (Aug 14)**: Added comprehensive registration list functionality to admin dashboard - admins can view attendee details, check-in status, and ticket information for each event
- **Delete Confirmation (Aug 14)**: Implemented double-confirmation delete functionality for events in admin dashboard with clear warnings about permanent data loss

# User Preferences

Preferred communication style: Simple, everyday language. Keep solutions simple - avoid overengineering when a basic approach works.

# System Architecture

## Frontend Architecture

The application uses a modern React-based frontend built with Vite as the build tool and bundler. The frontend follows a component-based architecture with:

- **Component Library**: Radix UI components with shadcn/ui styling system for consistent, accessible UI elements
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom CSS variables for theming, following a library-friendly design system with deep blue (#004080) accent colors
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **TypeScript**: Full TypeScript implementation for type safety across the application

## Backend Architecture

The backend is built as an Express.js server with TypeScript:

- **API Design**: RESTful API endpoints with clear separation between public and admin routes
- **Session Management**: Express sessions with PostgreSQL session storage for admin authentication
- **Middleware Stack**: Request logging, JSON parsing, and error handling middleware
- **Development Setup**: Vite middleware integration for seamless development experience

## Database Layer

The application uses PostgreSQL with Drizzle ORM:

- **Database Provider**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Connection Pooling**: Neon connection pooling with WebSocket support for serverless environments
- **Data Models**: Strongly-typed schema definitions with relationships between events, sessions, registrations, tickets, and payments

## Core Data Models

- **Events**: Complete event entities with title, description, location, timing, capacity, room, pricing, waitlist settings, and publication status
- **Registrations**: User bookings linked directly to events with personal information, seat counts, and payment status tracking
- **Tickets**: Individual QR-coded tickets generated per seat with unique verification codes
- **Payments**: Stripe payment intent tracking with status management

## Authentication & Authorization

Simple admin authentication system using environment variable-based password protection with session-based persistence. No complex user roles - single admin access level for event management.

## Email System

Automated email notifications using Nodemailer with SMTP configuration:

- **Confirmation Emails**: Sent upon successful registration with embedded QR tickets
- **Reminder Emails**: Automated 24-hour reminders sent via cron job scheduling
- **Template System**: HTML and text email templates with Register Path branding
- **Development Mode**: Console logging fallback when email credentials are not configured

## Payment Processing

Stripe integration for handling paid events:

- **Payment Intents**: Secure payment processing with webhook confirmation
- **Webhook Handling**: Server-side payment status verification and registration confirmation
- **Capacity Management**: Atomic seat reservation tied to successful payment completion
- **Free Events**: Immediate confirmation bypass for zero-cost sessions

## QR Code & Ticketing System

Comprehensive ticketing solution with QR code generation:

- **Unique Codes**: Cryptographically secure ticket codes with timestamp and random elements
- **QR Generation**: Server-side QR code creation with verification URL embedding
- **Check-in System**: Camera-based QR scanning with manual code entry fallback
- **Duplicate Prevention**: Server-side check-in status tracking to prevent multiple scans

## Background Jobs

Cron-based job scheduling for automated tasks:

- **Reminder Service**: 10-minute interval job checking for upcoming events requiring 24-hour reminders
- **Email Queue**: Batch processing of reminder emails with error handling and logging

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling and WebSocket support
- **Drizzle ORM**: Database abstraction layer with TypeScript-first schema definitions

## Payment Processing
- **Stripe**: Payment intent creation, webhook processing, and transaction management
- **Stripe React**: Frontend payment form integration with secure payment collection

## Email Services
- **Nodemailer**: SMTP email sending with HTML template support
- **SMTP Provider**: Configurable email service (Gmail, SendGrid, or custom SMTP)

## UI & Styling
- **Radix UI**: Headless component primitives for accessible interface elements
- **Tailwind CSS**: Utility-first CSS framework with custom design system variables
- **Lucide React**: Icon library for consistent iconography throughout the application

## Development Tools
- **Vite**: Frontend build tool and development server with hot module replacement
- **TypeScript**: Static typing system for enhanced developer experience and code reliability
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates

## Utility Libraries
- **QRCode**: Server-side QR code generation for ticket creation
- **Zod**: Runtime type validation for API payloads and form data
- **Node Cron**: Scheduled task execution for automated reminder emails
- **Nanoid**: Unique identifier generation for secure ticket codes