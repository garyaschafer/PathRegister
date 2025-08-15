import nodemailer from 'nodemailer';
import { type Registration, type Event, type Ticket } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('Email credentials not configured. Email sending will be logged to console.');
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendConfirmationEmail(
    registration: Registration,
    event: Event,
    tickets: Ticket[]
  ): Promise<void> {
    const subject = `Register Path Confirmation - ${event.title}`;
    const htmlContent = this.generateConfirmationHTML(registration, event, tickets);
    const textContent = this.generateConfirmationText(registration, event, tickets);

    await this.sendEmail(
      registration.email,
      subject,
      textContent,
      htmlContent
    );
  }

  async sendReminderEmail(
    registration: Registration,
    event: Event,
    tickets: Ticket[]
  ): Promise<void> {
    const subject = `Register Path Reminder - ${event.title} Tomorrow`;
    const htmlContent = this.generateReminderHTML(registration, event, tickets);
    const textContent = this.generateReminderText(registration, event, tickets);

    await this.sendEmail(
      registration.email,
      subject,
      textContent,
      htmlContent
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string
  ): Promise<void> {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'Register Path <noreply@registerpath.org>',
      to,
      subject,
      text,
      html,
    };

    if (this.transporter) {
      try {
        await this.transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${subject}`);
      } catch (error) {
        console.error('Error sending email:', error);
        throw error;
      }
    } else {
      // Development mode - log to console
      console.log('=== EMAIL (Development Mode) ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text}`);
      console.log('=== END EMAIL ===');
    }
  }

  private generateConfirmationHTML(
    registration: Registration,
    event: Event,
    tickets: Ticket[]
  ): string {
    const ticketLinks = tickets.map(ticket => 
      `<a href="${process.env.BASE_URL}/ticket/${ticket.ticketCode}" style="color: #004080;">View Ticket ${ticket.ticketCode}</a>`
    ).join('<br>');

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Register Path Confirmation</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .header { background-color: #004080; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .ticket-info { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #004080; margin: 20px 0; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Register Path</h1>
              <p>Registration Confirmation</p>
          </div>
          
          <div class="content">
              <h2>Thank you for registering, ${registration.firstName}!</h2>
              
              <p>Your registration for <strong>${event.title}</strong> has been confirmed.</p>
              
              <div class="ticket-info">
                  <h3>Event Details:</h3>
                  <p><strong>Event:</strong> ${event.title}</p>
                  <p><strong>Date:</strong> ${new Date(event.startTime).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}</p>
                  <p><strong>Location:</strong> ${event.room}, ${event.location}</p>
                  <p><strong>Seats:</strong> ${registration.seats}</p>
                  ${Number(registration.totalAmount) > 0 ? `<p><strong>Amount Paid:</strong> $${registration.totalAmount}</p>` : ''}
              </div>
              
              <h3>Your QR Tickets:</h3>
              <p>${ticketLinks}</p>
              
              <p>Please bring your QR ticket(s) to the event for check-in.</p>
          </div>
          
          <div class="footer">
              <p>Register Path - Events & Community Management</p>
              <p>If you have any questions, please contact us.</p>
          </div>
      </body>
      </html>
    `;
  }

  private generateConfirmationText(
    registration: Registration,
    event: Event,
    tickets: Ticket[]
  ): string {
    const ticketCodes = tickets.map(t => t.ticketCode).join(', ');
    
    return `
Register Path - Registration Confirmation

Thank you for registering, ${registration.firstName}!

Your registration for "${event.title}" has been confirmed.

Event Details:
- Event: ${event.title}
- Date: ${new Date(event.startTime).toLocaleDateString()}
- Time: ${new Date(event.startTime).toLocaleTimeString()} - ${new Date(event.endTime).toLocaleTimeString()}
- Location: ${event.room}, ${event.location}
- Seats: ${registration.seats}
${Number(registration.totalAmount) > 0 ? `- Amount Paid: $${registration.totalAmount}` : ''}

Your Ticket Codes: ${ticketCodes}

Please bring your QR ticket(s) to the event for check-in.
View your tickets online: ${process.env.BASE_URL}/ticket/${tickets[0]?.ticketCode}

Register Path - Events & Community Management
    `;
  }

  private generateReminderHTML(
    registration: Registration,
    event: Event,
    tickets: Ticket[]
  ): string {
    return this.generateConfirmationHTML(registration, event, tickets)
      .replace('Registration Confirmation', 'Event Reminder')
      .replace('Thank you for registering', 'Reminder: Your event is tomorrow');
  }

  private generateReminderText(
    registration: Registration,
    event: Event,
    tickets: Ticket[]
  ): string {
    return this.generateConfirmationText(registration, event, tickets)
      .replace('Registration Confirmation', 'Event Reminder')
      .replace('Thank you for registering', 'Reminder: Your event is tomorrow');
  }
}

export const emailService = new EmailService();
