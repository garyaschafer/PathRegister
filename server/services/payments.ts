import Stripe from 'stripe';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Stripe secret key not configured. Payment functionality will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
}) : null;

class PaymentService {
  async createPaymentIntent(amount: number, metadata: Record<string, string> = {}): Promise<Stripe.PaymentIntent> {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update payment status in database
        const payment = await storage.getPaymentByIntentId(paymentIntentId);
        if (payment) {
          await storage.updatePayment(payment.id, { status: 'succeeded' });
          
          // Update registration payment status
          await storage.updateRegistration(payment.registrationId, { 
            paymentStatus: 'completed' 
          });
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    if (!stripe) {
      throw new Error('Stripe not configured');
    }
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      // Update payment status in database
      const payment = await storage.getPaymentByIntentId(paymentIntentId);
      if (payment) {
        await storage.updatePayment(payment.id, { status: 'cancelled' });
        
        // Update registration status
        await storage.updateRegistration(payment.registrationId, { 
          paymentStatus: 'refunded',
          status: 'cancelled'
        });
      }

      return refund;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw new Error('Failed to process refund');
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.confirmPayment(paymentIntent.id);
        break;
      
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        const failedPayment = await storage.getPaymentByIntentId(failedIntent.id);
        if (failedPayment) {
          await storage.updatePayment(failedPayment.id, { status: 'failed' });
          await storage.updateRegistration(failedPayment.registrationId, { 
            paymentStatus: 'failed' 
          });
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}

export const paymentService = new PaymentService();
