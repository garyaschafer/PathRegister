import {
  events,
  sessions,
  registrations,
  tickets,
  payments,
  type Event,
  type Session,
  type Registration,
  type Ticket,
  type Payment,
  type InsertEvent,
  type InsertSession,
  type InsertRegistration,
  type InsertTicket,
  type InsertPayment,
  type EventWithSessions,
  type SessionWithEvent,
  type RegistrationWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Events
  getEvents(status?: string): Promise<EventWithSessions[]>;
  getEvent(id: string): Promise<EventWithSessions | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;

  // Sessions
  getSessions(eventId?: string): Promise<SessionWithEvent[]>;
  getSession(id: string): Promise<SessionWithEvent | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  updateSessionCapacity(id: string, remaining: number): Promise<void>;

  // Registrations
  getRegistrations(sessionId?: string): Promise<RegistrationWithDetails[]>;
  getRegistration(id: string): Promise<RegistrationWithDetails | undefined>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration>;
  deleteRegistration(id: string): Promise<void>;

  // Tickets
  getTickets(registrationId?: string): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketByCode(ticketCode: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket>;
  checkInTicket(ticketCode: string): Promise<Ticket>;

  // Payments
  getPayments(registrationId?: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByIntentId(paymentIntentId: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;

  // Analytics
  getEventStats(): Promise<{
    totalEvents: number;
    activeSessions: number;
    totalRegistrations: number;
    revenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Events
  async getEvents(status?: string): Promise<EventWithSessions[]> {
    const query = db.select().from(events);
    if (status) {
      query.where(eq(events.status, status as any));
    }
    const eventsData = await query.orderBy(asc(events.startTime));
    
    const eventsWithSessions = await Promise.all(
      eventsData.map(async (event) => ({
        ...event,
        sessions: await db.select().from(sessions).where(eq(sessions.eventId, event.id)).orderBy(asc(sessions.startTime)),
      }))
    );
    
    return eventsWithSessions;
  }

  async getEvent(id: string): Promise<EventWithSessions | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;
    
    const eventSessions = await db.select().from(sessions).where(eq(sessions.eventId, id)).orderBy(asc(sessions.startTime));
    
    return {
      ...event,
      sessions: eventSessions,
    };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Sessions
  async getSessions(eventId?: string): Promise<SessionWithEvent[]> {
    const query = db
      .select({
        session: sessions,
        event: events,
      })
      .from(sessions)
      .innerJoin(events, eq(sessions.eventId, events.id));
    
    if (eventId) {
      query.where(eq(sessions.eventId, eventId));
    }
    
    const result = await query.orderBy(asc(sessions.startTime));
    
    return result.map(({ session, event }) => ({
      ...session,
      event,
    }));
  }

  async getSession(id: string): Promise<SessionWithEvent | undefined> {
    const [result] = await db
      .select({
        session: sessions,
        event: events,
      })
      .from(sessions)
      .innerJoin(events, eq(sessions.eventId, events.id))
      .where(eq(sessions.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.session,
      event: result.event,
    };
  }

  async createSession(session: InsertSession): Promise<Session> {
    const sessionData = {
      ...session,
      remaining: session.capacity, // Set remaining to capacity initially
    };
    const [newSession] = await db.insert(sessions).values(sessionData).returning();
    return newSession;
  }

  async updateSession(id: string, session: Partial<InsertSession>): Promise<Session> {
    const [updatedSession] = await db
      .update(sessions)
      .set(session)
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async updateSessionCapacity(id: string, remaining: number): Promise<void> {
    await db
      .update(sessions)
      .set({ remaining })
      .where(eq(sessions.id, id));
  }

  // Registrations
  async getRegistrations(sessionId?: string): Promise<RegistrationWithDetails[]> {
    const query = db
      .select({
        registration: registrations,
        session: sessions,
        event: events,
      })
      .from(registrations)
      .innerJoin(sessions, eq(registrations.sessionId, sessions.id))
      .innerJoin(events, eq(sessions.eventId, events.id));
    
    if (sessionId) {
      query.where(eq(registrations.sessionId, sessionId));
    }
    
    const result = await query.orderBy(desc(registrations.createdAt));
    
    const registrationsWithDetails = await Promise.all(
      result.map(async ({ registration, session, event }) => {
        const ticketList = await db.select().from(tickets).where(eq(tickets.registrationId, registration.id));
        
        return {
          ...registration,
          session: {
            ...session,
            event,
          },
          tickets: ticketList,
        };
      })
    );
    
    return registrationsWithDetails;
  }

  async getRegistration(id: string): Promise<RegistrationWithDetails | undefined> {
    const [result] = await db
      .select({
        registration: registrations,
        session: sessions,
        event: events,
      })
      .from(registrations)
      .innerJoin(sessions, eq(registrations.sessionId, sessions.id))
      .innerJoin(events, eq(sessions.eventId, events.id))
      .where(eq(registrations.id, id));
    
    if (!result) return undefined;
    
    const ticketList = await db.select().from(tickets).where(eq(tickets.registrationId, id));
    
    return {
      ...result.registration,
      session: {
        ...result.session,
        event: result.event,
      },
      tickets: ticketList,
    };
  }

  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    const [newRegistration] = await db.insert(registrations).values(registration).returning();
    return newRegistration;
  }

  async updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration> {
    const [updatedRegistration] = await db
      .update(registrations)
      .set(registration)
      .where(eq(registrations.id, id))
      .returning();
    return updatedRegistration;
  }

  async deleteRegistration(id: string): Promise<void> {
    await db.delete(registrations).where(eq(registrations.id, id));
  }

  // Tickets
  async getTickets(registrationId?: string): Promise<Ticket[]> {
    const query = db.select().from(tickets);
    if (registrationId) {
      query.where(eq(tickets.registrationId, registrationId));
    }
    return await query.orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketByCode(ticketCode: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketCode, ticketCode));
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set(ticket)
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async checkInTicket(ticketCode: string): Promise<Ticket> {
    const [checkedInTicket] = await db
      .update(tickets)
      .set({ 
        checkedIn: true, 
        checkedInAt: new Date() 
      })
      .where(eq(tickets.ticketCode, ticketCode))
      .returning();
    return checkedInTicket;
  }

  // Payments
  async getPayments(registrationId?: string): Promise<Payment[]> {
    const query = db.select().from(payments);
    if (registrationId) {
      query.where(eq(payments.registrationId, registrationId));
    }
    return await query.orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntentId));
    return payment || undefined;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  // Analytics
  async getEventStats(): Promise<{
    totalEvents: number;
    activeSessions: number;
    totalRegistrations: number;
    revenue: number;
  }> {
    const [eventsCount] = await db.select({ count: sql`count(*)` }).from(events);
    const [sessionsCount] = await db.select({ count: sql`count(*)` }).from(sessions).where(eq(sessions.status, 'active'));
    const [registrationsCount] = await db.select({ count: sql`count(*)` }).from(registrations);
    const [revenueSum] = await db.select({ sum: sql`coalesce(sum(total_amount), 0)` }).from(registrations).where(eq(registrations.paymentStatus, 'completed'));

    return {
      totalEvents: Number(eventsCount.count) || 0,
      activeSessions: Number(sessionsCount.count) || 0,
      totalRegistrations: Number(registrationsCount.count) || 0,
      revenue: Number(revenueSum.sum) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
