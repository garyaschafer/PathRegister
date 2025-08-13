import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import express from "express";
import Stripe from 'stripe';
import { storage } from "./storage";
import { emailService } from "./services/email";
import { qrService } from "./services/qr";
import { paymentService } from "./services/payments";
import { reminderService } from "./jobs/reminders";
import {
  insertEventSchema,
  insertSessionSchema,
  insertRegistrationSchema,
} from "@shared/schema";
import { z } from "zod";

// Extend session type to include admin property
declare module 'express-session' {
  interface SessionData {
    isAdmin?: boolean;
  }
}

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ message: "Admin password not configured" });
  }

  if (req.session?.isAdmin) {
    return next();
  }

  return res.status(401).json({ message: "Admin authentication required" });
};

// Session configuration
const sessionConfig = () => {
  const pgStore = connectPg(session);
  return session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET || "register-path-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(sessionConfig());

  // Start reminder job
  reminderService.startReminderJob();

  // Stripe webhook (before other body parsing)
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-06-20',
      });
      
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      await paymentService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Public API Routes

  // Get published events with sessions
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents("published");
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get specific event
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Register for session
  const registerSchema = insertRegistrationSchema.extend({
    sessionId: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    seats: z.number().min(1).max(4),
  });

  app.post("/api/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const { sessionId, firstName, lastName, email, phone, seats } = data;

      // Get session to check availability and price
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Check capacity
      if (session.remaining < seats) {
        if (session.allowWaitlist) {
          // Create waitlist registration
          const registration = await storage.createRegistration({
            sessionId,
            firstName,
            lastName,
            email,
            phone: phone || null,
            seats,
            status: "waitlist",
            totalAmount: "0.00",
            paymentStatus: "pending",
          });

          return res.json({
            success: true,
            status: "waitlist",
            registration,
            message: "Added to waitlist"
          });
        } else {
          return res.status(400).json({ message: "Session is full and waitlist not allowed" });
        }
      }

      const totalAmount = parseFloat(session.price) * seats;

      if (totalAmount === 0) {
        // Free event - confirm immediately
        const registration = await storage.createRegistration({
          sessionId,
          firstName,
          lastName,
          email,
          phone: phone || null,
          seats,
          status: "confirmed",
          totalAmount: "0.00",
          paymentStatus: "completed",
        });

        // Update session capacity
        await storage.updateSessionCapacity(sessionId, session.remaining - seats);

        // Generate tickets
        const tickets = [];
        for (let i = 0; i < seats; i++) {
          const ticketCode = qrService.generateTicketCode();
          const qrData = qrService.generateQRData(ticketCode);
          
          const ticket = await storage.createTicket({
            registrationId: registration.id,
            ticketCode,
            qrData,
          });
          tickets.push(ticket);
        }

        // Send confirmation email
        await emailService.sendConfirmationEmail(
          registration,
          session,
          session.event,
          tickets
        );

        return res.json({
          success: true,
          status: "confirmed",
          registration,
          tickets,
          message: "Registration confirmed"
        });
      } else {
        // Paid event - create payment intent
        const registration = await storage.createRegistration({
          sessionId,
          firstName,
          lastName,
          email,
          phone: phone || null,
          seats,
          status: "confirmed",
          totalAmount: totalAmount.toFixed(2),
          paymentStatus: "pending",
        });

        const paymentIntent = await paymentService.createPaymentIntent(totalAmount, {
          registrationId: registration.id,
          sessionId,
          eventTitle: session.event.title,
        });

        // Store payment record
        await storage.createPayment({
          registrationId: registration.id,
          stripePaymentIntentId: paymentIntent.id,
          amount: totalAmount.toFixed(2),
          status: "pending",
        });

        return res.json({
          success: true,
          status: "payment_required",
          registration,
          clientSecret: paymentIntent.client_secret,
          message: "Payment required"
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Complete paid registration (called after successful payment)
  app.post("/api/complete-registration", async (req, res) => {
    try {
      const { registrationId } = req.body;

      const registration = await storage.getRegistration(registrationId);
      if (!registration || registration.paymentStatus !== "completed") {
        return res.status(400).json({ message: "Registration not found or payment not completed" });
      }

      // Update session capacity
      const session = await storage.getSession(registration.sessionId);
      if (session) {
        await storage.updateSessionCapacity(registration.sessionId, session.remaining - registration.seats);
      }

      // Generate tickets
      const tickets = [];
      for (let i = 0; i < registration.seats; i++) {
        const ticketCode = qrService.generateTicketCode();
        const qrData = qrService.generateQRData(ticketCode);
        
        const ticket = await storage.createTicket({
          registrationId: registration.id,
          ticketCode,
          qrData,
        });
        tickets.push(ticket);
      }

      // Send confirmation email
      await emailService.sendConfirmationEmail(
        registration,
        registration.session,
        registration.session.event,
        tickets
      );

      res.json({
        success: true,
        registration,
        tickets,
        message: "Registration completed successfully"
      });
    } catch (error: any) {
      console.error("Complete registration error:", error);
      res.status(500).json({ message: "Failed to complete registration" });
    }
  });

  // Verify ticket for QR scanner
  app.get("/api/verify-ticket/:ticketCode", async (req, res) => {
    try {
      const { ticketCode } = req.params;
      const ticket = await storage.getTicketByCode(ticketCode);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const registration = await storage.getRegistration(ticket.registrationId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      res.json({
        valid: true,
        ticket,
        registration,
        session: registration.session,
        event: registration.session.event,
        checkedIn: ticket.checkedIn,
      });
    } catch (error: any) {
      console.error("Ticket verification error:", error);
      res.status(500).json({ message: "Ticket verification failed" });
    }
  });

  // Check in ticket
  app.post("/api/checkin/:ticketCode", async (req, res) => {
    try {
      const { ticketCode } = req.params;
      const ticket = await storage.getTicketByCode(ticketCode);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.checkedIn) {
        return res.status(400).json({ message: "Ticket already checked in" });
      }

      const checkedInTicket = await storage.checkInTicket(ticketCode);
      const registration = await storage.getRegistration(ticket.registrationId);

      res.json({
        success: true,
        ticket: checkedInTicket,
        registration,
        message: "Check-in successful"
      });
    } catch (error: any) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Check-in failed" });
    }
  });

  // Admin Routes

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return res.status(500).json({ message: "Admin password not configured" });
      }

      if (password === adminPassword) {
        req.session.isAdmin = true;
        res.json({ success: true, message: "Admin logged in" });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true, message: "Logged out" });
    });
  });

  // Check admin status
  app.get("/api/admin/status", (req, res) => {
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  // Get admin stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getEventStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin events management
  app.get("/api/admin/events", requireAdmin, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error: any) {
      console.error("Admin events error:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/admin/events", requireAdmin, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error: any) {
      console.error("Create event error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", requireAdmin, async (req, res) => {
    try {
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, eventData);
      res.json(event);
    } catch (error: any) {
      console.error("Update event error:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.json({ success: true, message: "Event deleted" });
    } catch (error: any) {
      console.error("Delete event error:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Admin sessions management
  app.post("/api/admin/sessions", requireAdmin, async (req, res) => {
    try {
      const sessionData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error: any) {
      console.error("Create session error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Get registrations for a session
  app.get("/api/admin/sessions/:id/registrations", requireAdmin, async (req, res) => {
    try {
      const registrations = await storage.getRegistrations(req.params.id);
      res.json(registrations);
    } catch (error: any) {
      console.error("Get registrations error:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Export registrations CSV
  app.get("/api/admin/sessions/:id/export", requireAdmin, async (req, res) => {
    try {
      const registrations = await storage.getRegistrations(req.params.id);
      
      // Generate CSV
      const headers = ['Name', 'Email', 'Phone', 'Seats', 'Status', 'Payment Status', 'Registration Date'];
      const rows = registrations.map(r => [
        `${r.firstName} ${r.lastName}`,
        r.email,
        r.phone || '',
        r.seats.toString(),
        r.status,
        r.paymentStatus,
        new Date(r.createdAt!).toLocaleDateString()
      ]);

      const csv = [headers, ...rows].map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
      res.send(csv);
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Export failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
