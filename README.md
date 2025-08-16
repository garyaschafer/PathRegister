# Register Path

A comprehensive events management platform for library events, workshops, and community gatherings. Register Path provides complete end-to-end event management from creation through attendee check-in, with integrated payment processing and automated notifications.

## 🌟 Features

- **Event Management**: Create, edit, and manage events with detailed information
- **Registration System**: User-friendly registration with capacity management and waitlists
- **QR Ticket System**: Automatic QR code generation for each ticket with secure verification
- **Admin Dashboard**: Comprehensive admin interface with filtering, analytics, and bulk operations
- **Payment Processing**: Integrated Stripe payment system for paid events
- **Email Notifications**: Automated confirmation and reminder emails
- **Check-in System**: Staff check-in interface with QR code scanning
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Date Range Filtering**: Advanced filtering to view events by date range

## 🏗️ Architecture

- **Frontend**: React with TypeScript, Vite build system, Tailwind CSS
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based admin authentication
- **Email**: Nodemailer with SMTP support
- **Payments**: Stripe integration for secure payment processing

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (version 18 or higher)
- A PostgreSQL database (we recommend [Neon](https://neon.tech) for easy cloud hosting)
- Basic knowledge of command line operations
- (Optional) Stripe account for payment processing
- (Optional) SMTP email service for notifications

## 🚀 Installation & Deployment Guide

### Step 1: Set Up PostgreSQL Database

#### Option A: Using Neon (Recommended)
1. Go to [Neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like `postgresql://username:password@host/database`)
4. Save this connection string - you'll need it for the `DATABASE_URL` environment variable

#### Option B: Using Local PostgreSQL
1. Install PostgreSQL on your system
2. Create a new database: `createdb register_path`
3. Your connection string will be: `postgresql://username:password@localhost:5432/register_path`

#### Option C: Using Replit Database
If deploying on Replit, the PostgreSQL database is automatically provided via the `DATABASE_URL` environment variable.

### Step 2: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/garyaschafer/PathRegister.git
cd PathRegister

# Install all dependencies
npm install
```

**What this does**: Downloads all required packages including React, Express, Tailwind CSS, Drizzle ORM, and other dependencies.

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory and add the following:

```env
# Required: Database connection
DATABASE_URL="your_postgresql_connection_string_here"

# Required: Admin authentication
ADMIN_PASSWORD="your_secure_admin_password_here"

# Optional: For production deployment
NODE_ENV="production"

# Optional: Email notifications (if you want email functionality)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_email_password_or_app_password"
FROM_EMAIL="your_email@gmail.com"
FROM_NAME="Your Organization Name"

# Optional: Stripe payments (if you want payment processing)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Optional: Base URL for email links
BASE_URL="https://your-domain.com"
```

**Important Notes**:
- Replace `your_postgresql_connection_string_here` with your actual database URL from Step 1
- Choose a strong admin password - this protects your admin dashboard
- Email and Stripe settings are optional but recommended for full functionality

### Step 4: Set Up Database Schema

Run the database migration to create all necessary tables:

```bash
npm run db:push
```

**What this does**: 
- Creates tables for events, registrations, tickets, payments, and admin sessions
- Sets up proper relationships between tables
- Applies the latest schema changes to your database

**Expected output**: You should see messages about tables being created successfully.

### Step 5: Start the Application

#### For Development:
```bash
npm run dev
```

#### For Production:
```bash
npm start
```

**What happens**:
- The Express server starts on port 5000
- The Vite development server provides the frontend
- You'll see messages confirming the server is running
- If email/Stripe aren't configured, you'll see warning messages (this is normal)

## 🌐 Accessing Your Application

Once the application is running:

- **Main Website**: Visit `http://localhost:5000` (or your deployment URL)
- **Admin Dashboard**: Click the "Admin" button in the header and log in with your `ADMIN_PASSWORD`

### First Time Setup

1. **Access Admin**: Go to the admin dashboard and log in
2. **Create First Event**: Click "New Event" to create your first event
3. **Test Registration**: Go back to the main site and register for your event
4. **Check Admin Features**: Explore the admin dashboard to see registrations, export data, etc.

## 🔧 Configuration Options

### Email Setup (Optional)

To enable email notifications:

1. **Gmail**: Use your Gmail credentials or create an App Password
2. **Other SMTP**: Any SMTP service (SendGrid, Mailgun, etc.)
3. **Testing**: Without email setup, notifications are logged to console

### Stripe Payment Setup (Optional)

To enable payment processing:

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Stripe dashboard
3. Add them to your `.env` file
4. Set up webhook endpoints for payment confirmation

### Environment-Specific Settings

#### Development Mode
- Detailed error messages
- Email logs to console
- Hot reloading enabled

#### Production Mode
- Set `NODE_ENV=production`
- Ensure all security environment variables are set
- Consider using a reverse proxy (nginx)

## 📁 Project Structure

```
register-path/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   └── lib/           # Utilities and configurations
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   └── services/          # Email, cron jobs, etc.
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── package.json           # Dependencies and scripts
└── drizzle.config.ts      # Database configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run db:push          # Apply database schema changes
npm run db:studio        # Open database browser (Drizzle Studio)

# Production
npm start               # Start production server
npm run build           # Build for production

# Maintenance
npm run lint            # Check code quality
npm run type-check      # Verify TypeScript types
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
- **Check**: Verify `DATABASE_URL` in `.env` file
- **Solution**: Test connection string manually or recreate database

#### Admin Login Not Working
- **Check**: Verify `ADMIN_PASSWORD` in environment variables
- **Solution**: Ensure password doesn't contain special characters that need escaping

#### Email Not Sending
- **Check**: SMTP settings in `.env` file
- **Note**: This is optional - the app works without email
- **Solution**: Verify SMTP credentials or use console logging for testing

#### Stripe Payments Failing
- **Check**: Stripe API keys and webhook configuration
- **Note**: This is optional - create free events without Stripe
- **Solution**: Verify Stripe dashboard settings and webhook endpoints

### Getting Help

1. **Check Logs**: Look at console output for specific error messages
2. **Verify Environment**: Ensure all required environment variables are set
3. **Database Issues**: Use `npm run db:studio` to inspect your database
4. **Network Issues**: Ensure no firewall blocking ports 5000/3000

## 🔐 Security Considerations

### For Production Deployment

1. **Environment Variables**: Never commit `.env` files to version control
2. **Admin Password**: Use a strong, unique password
3. **Database**: Ensure your database has proper access controls
4. **HTTPS**: Use SSL/TLS in production (handled automatically on most platforms)
5. **API Keys**: Rotate Stripe and other API keys regularly

## 📈 Scaling and Performance

### Database Optimization
- Regular backups of your PostgreSQL database
- Monitor connection pool usage
- Consider read replicas for high traffic

### Application Performance
- Enable gzip compression in production
- Use CDN for static assets
- Monitor memory usage and optimize queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For additional support:
- Check the troubleshooting section above
- Review the configuration examples
- Ensure all prerequisites are properly installed

---

Built with ❤️ for community organizations managing library events, workshops, and community gatherings.