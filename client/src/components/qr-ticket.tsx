import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail, Shield } from "lucide-react";

interface QRTicketProps {
  ticketCode: string;
}

export function QRTicket({ ticketCode }: QRTicketProps) {
  const { data: ticketData, isLoading } = useQuery({
    queryKey: ["/api/verify-ticket", ticketCode],
    enabled: !!ticketCode,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ticketData || !ticketData.valid) {
    return (
      <Card className="library-card">
        <CardContent className="p-8 text-center">
          <p className="text-red-600 font-medium">Invalid or expired ticket</p>
        </CardContent>
      </Card>
    );
  }

  const { ticket, registration, session, event } = ticketData;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="library-card">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Your Event Ticket</h2>
            <p className="text-lg text-muted-foreground">
              {ticket.checkedIn ? "Checked In" : "Ready for Check-in"}
            </p>
          </div>

          {/* QR Ticket */}
          <div className="bg-gray-50 rounded-xl p-8 mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">Event Details</h3>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-left flex-1">
                <h4 className="font-semibold text-foreground text-lg" data-testid={`text-event-title-${ticket.id}`}>
                  {event.title}
                </h4>
                <p className="text-muted-foreground" data-testid={`text-session-details-${ticket.id}`}>
                  {session.title} - {formatDate(session.startTime)}
                </p>
                <p className="text-muted-foreground">
                  {formatTime(session.startTime)} - {formatTime(session.endTime)} | {session.room}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ticket #: <span className="font-mono" data-testid={`text-ticket-code-${ticket.id}`}>{ticket.ticketCode}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Attendee: {registration.firstName} {registration.lastName}
                </p>
                <div className="text-xs text-muted-foreground mt-4 flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Register Path
                </div>
              </div>
              
              <div className="text-center">
                {/* QR Code placeholder - in a real app, this would be generated */}
                <div 
                  className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mb-2 relative"
                  data-testid={`qr-code-${ticket.id}`}
                >
                  {/* Simple QR pattern simulation */}
                  <div className="grid grid-cols-8 gap-1 transform scale-75">
                    {/* Top row */}
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    
                    {/* More rows would be generated in a real QR code */}
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                    <div className="w-2 h-2 bg-white"></div>
                    <div className="w-2 h-2 bg-black"></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Scan at event</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="library-button" data-testid={`button-download-${ticket.id}`}>
              <Download className="w-4 h-4 mr-2" />
              Download Ticket
            </Button>
            <Button variant="outline" data-testid={`button-print-${ticket.id}`}>
              <Printer className="w-4 h-4 mr-2" />
              Printer Ticket
            </Button>
            <Button variant="outline" data-testid={`button-email-${ticket.id}`}>
              <Mail className="w-4 h-4 mr-2" />
              Email Ticket
            </Button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <Shield className="w-4 h-4 inline mr-2 text-blue-500" />
              A confirmation email with your QR ticket has been sent to your email address. 
              Please bring this ticket (digital or printed) to the event for check-in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
