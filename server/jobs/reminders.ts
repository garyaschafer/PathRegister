import cron from 'node-cron';
import { storage } from '../storage';
import { emailService } from '../services/email';

class ReminderService {
  startReminderJob() {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        await this.sendReminders();
      } catch (error) {
        console.error('Error in reminder job:', error);
      }
    });
    
    console.log('Reminder job started - runs every 10 minutes');
  }

  private async sendReminders() {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyThreeHoursFromNow = new Date(now.getTime() + 23 * 60 * 60 * 1000);

    // Get all confirmed registrations for sessions starting in ~24 hours
    const registrations = await storage.getRegistrations();
    
    const remindersToSend = registrations.filter(registration => {
      const sessionStart = new Date(registration.session.startTime);
      return (
        registration.status === 'confirmed' &&
        registration.paymentStatus === 'completed' &&
        sessionStart >= twentyThreeHoursFromNow &&
        sessionStart <= twentyFourHoursFromNow
      );
    });

    console.log(`Found ${remindersToSend.length} reminder emails to send`);

    for (const registration of remindersToSend) {
      try {
        await emailService.sendReminderEmail(
          registration,
          registration.session,
          registration.session.event,
          registration.tickets
        );
        console.log(`Reminder sent to ${registration.email} for ${registration.session.event.title}`);
      } catch (error) {
        console.error(`Failed to send reminder to ${registration.email}:`, error);
      }
    }
  }
}

export const reminderService = new ReminderService();
