import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check } from "lucide-react";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { QRTicket } from "@/components/qr-ticket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Success() {
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would come from URL params or local storage
    // For demo purposes, we'll simulate a ticket code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('ticket') || 'RP-' + Date.now().toString(36).toUpperCase();
    setTicketCode(code);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="flex-1 py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="library-card">
            <CardContent className="p-8 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="text-success-title">
                  Registration Successful!
                </h2>
                <p className="text-lg text-muted-foreground" data-testid="text-success-description">
                  Your spot has been confirmed. Check your email for your QR ticket.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/">
                  <Button className="library-button" data-testid="button-back-events">
                    Back to Events
                  </Button>
                </Link>
                <Button variant="outline" data-testid="button-view-ticket">
                  View My Ticket
                </Button>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <Check className="w-4 h-4 inline mr-2 text-blue-500" />
                  A confirmation email with your QR ticket has been sent to your email address. 
                  Please bring this ticket (digital or printed) to the event for check-in.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Show QR Ticket if available */}
          {ticketCode && (
            <div className="mt-8">
              <QRTicket ticketCode={ticketCode} />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
