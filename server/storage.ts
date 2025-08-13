import {
  events,
  registrations,
  tickets,
  payments,
  type Event,
  type Registration,
  type Ticket,
  type Payment,
  type InsertEvent,
  type InsertRegistration,
  type InsertTicket,
  type InsertPayment,
  type EventWithRegistrations,
  type RegistrationWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Events
  getEvents(status?: string): Promise<EventWithRegistrations[]>;
  getEvent(id: string): Promise<EventWithRegistrations | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  copyEvent(id: string, overrides?: Partial<InsertEvent>): Promise<Event>;
  updateEventCapacity(id: string, remaining: number): Promise<void>;

  // Registrations
  getRegistrations(eventId?: string): Promise<RegistrationWithDetails[]>;
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
    totalRegistrations: number;
    revenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Events
  async getEvents(status?: string): Promise<EventWithRegistrations[]> {
    let query = db.select().from(events);
    if (status) {
      query = query.where(eq(events.status, status as any));
    }
    
    const eventsData = await query.orderBy(desc(events.createdAt));
    
    // Get registrations for each event
    const eventsWithRegistrations = await Promise.all(
      eventsData.map(async (event) => {
        const eventRegistrations = await db
          .select()
          .from(registrations)
          .where(eq(registrations.eventId, event.id));
        
        return {
          ...event,
          registrations: eventRegistrations,
        };
      })
    );
    
    return eventsWithRegistrations;
  }

  async getEvent(id: string): Promise<EventWithRegistrations | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;
    
    const eventRegistrations = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, id));
    
    return {
      ...event,
      registrations: eventRegistrations,
    };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    // Set remaining to capacity when creating
    const eventData = {
      ...event,
      remaining: event.capacity,
    };
    
    const [created] = await db.insert(events).values(eventData).returning();
    return created;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event> {
    const [updated] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async copyEvent(id: string, overrides?: Partial<InsertEvent>): Promise<Event> {
    const originalEvent = await this.getEvent(id);
    if (!originalEvent) {
      throw new Error("Event not found");
    }

    const { id: _, createdAt, updatedAt, registrations, ...eventData } = originalEvent;
    const newEventData = {
      ...eventData,
      ...overrides,
      title: overrides?.title || `${eventData.title} (Copy)`,
      remaining: overrides?.capacity || eventData.capacity, // Reset remaining to capacity
    };

    return this.createEvent(newEventData);
  }

  async updateEventCapacity(id: string, remaining: number): Promise<void> {
    await db
      .update(events)
      .set({ remaining, updatedAt: new Date() })
      .where(eq(events.id, id));
  }

  // Registrations
  async getRegistrations(eventId?: string): Promise<RegistrationWithDetails[]> {
    let query = db
      .select()
      .from(registrations)
      .leftJoin(events, eq(registrations.eventId, events.id));

    if (eventId) {
      query = query.where(eq(registrations.eventId, eventId));
    }

    const results = await query.orderBy(desc(registrations.createdAt));
    
    return Promise.all(
      results.map(async (result) => {
        const registrationTickets = await db
          .select()
          .from(tickets)
          .where(eq(tickets.registrationId, result.registrations.id));
        
        return {
          ...result.registrations,
          event: result.events!,
          tickets: registrationTickets,
        };
      })
    );
  }

  async getRegistration(id: string): Promise<RegistrationWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(registrations)
      .leftJoin(events, eq(registrations.eventId, events.id))
      .where(eq(registrations.id, id));
    
    if (!result) return undefined;
    
    const registrationTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.registrationId, id));
    
    return {
      ...result.registrations,
      event: result.events!,
      tickets: registrationTickets,
    };
  }

  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    const [created] = await db.insert(registrations).values(registration).returning();
    return created;
  }

  async updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration> {
    const [updated] = await db
      .update(registrations)
      .set(registration)
      .where(eq(registrations.id, id))
      .returning();
    return updated;
  }

  async deleteRegistration(id: string): Promise<void> {
    await db.delete(registrations).where(eq(registrations.id, id));
  }

  // Tickets
  async getTickets(registrationId?: string): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    if (registrationId) {
      query = query.where(eq(tickets.registrationId, registrationId));
    }
    return await query.orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByCode(ticketCode: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketCode, ticketCode));
    return ticket;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [created] = await db.insert(tickets).values(ticket).returning();
    return created;
  }

  async updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket> {
    const [updated] = await db
      .update(tickets)
      .set(ticket)
      .where(eq(tickets.id, id))
      .returning();
    return updated;
  }

  async checkInTicket(ticketCode: string): Promise<Ticket> {
    const [updated] = await db
      .update(tickets)
      .set({ 
        checkedIn: true, 
        checkedInAt: new Date() 
      })
      .where(eq(tickets.ticketCode, ticketCode))
      .returning();
    return updated;
  }

  // Payments
  async getPayments(registrationId?: string): Promise<Payment[]> {
    let query = db.select().from(payments);
    if (registrationId) {
      query = query.where(eq(payments.registrationId, registrationId));
    }
    return await query.orderBy(desc(payments.createdAt));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByIntentId(paymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));
    return payment;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Analytics
  async getEventStats(): Promise<{
    totalEvents: number;
    totalRegistrations: number;
    revenue: number;
  }> {
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events);

    const [registrationCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations);

    const [revenueSum] = await db
      .select({ sum: sql<number>`coalesce(sum(${registrations.totalAmount}), 0)::float` })
      .from(registrations)
      .where(eq(registrations.paymentStatus, "completed"));

    return {
      totalEvents: eventCount.count || 0,
      totalRegistrations: registrationCount.count || 0,
      revenue: revenueSum.sum || 0,
    };
  }
}

export const storage = new DatabaseStorage();