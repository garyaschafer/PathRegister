import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { type EventWithSessions } from "@shared/schema";

interface EventCardProps {
  event: EventWithSessions;
  onRegister: (sessionId: string) => void;
  onJoinWaitlist: (sessionId: string) => void;
}

export function EventCard({ event, onRegister, onJoinWaitlist }: EventCardProps) {
  const getEventBadge = (price: string) => {
    const priceNum = parseFloat(price);
    if (priceNum === 0) return <Badge className="library-badge-free">Free Event</Badge>;
    return <Badge className="library-badge-paid">Premium Workshop</Badge>;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="library-card overflow-hidden" data-testid={`card-event-${event.id}`}>
      <div className="md:flex">
        <div className="md:w-1/3">
          <img 
            src={event.heroImage || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
            alt={event.title}
            className="w-full h-64 md:h-full object-cover"
            data-testid={`img-event-${event.id}`}
          />
        </div>
        <div className="md:w-2/3 p-8">
          <div className="flex items-center justify-between mb-4">
            {getEventBadge(event.sessions[0]?.price || "0")}
            <span className="text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 inline mr-1" />
              {formatDate(event.startTime.toString())}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4" data-testid={`text-title-${event.id}`}>
            {event.title}
          </h3>
          
          <p className="text-muted-foreground mb-6" data-testid={`text-description-${event.id}`}>
            {event.description}
          </p>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Available Sessions:</h4>
            
            {event.sessions.map((session) => {
              const isFull = session.remaining <= 0;
              const price = parseFloat(session.price);
              
              return (
                <div 
                  key={session.id} 
                  className={`library-session-card ${isFull ? 'library-session-full' : ''}`}
                  data-testid={`card-session-${session.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-foreground" data-testid={`text-session-title-${session.id}`}>
                        {session.title}
                      </h5>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                        <span>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatTime(session.startTime.toString())} - {formatTime(session.endTime.toString())}
                        </span>
                        <span>
                          <MapPin className="w-4 h-4 inline mr-1" />
                          {session.room}
                        </span>
                        <span className={isFull ? "text-red-600 font-medium" : ""}>
                          <Users className="w-4 h-4 inline mr-1" />
                          {session.capacity - session.remaining} of {session.capacity} spots filled
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary" data-testid={`text-price-${session.id}`}>
                        {price === 0 ? 'FREE' : `$${price}`}
                      </span>
                      {isFull ? (
                        session.allowWaitlist ? (
                          <Button 
                            className="bg-yellow-500 text-white hover:bg-yellow-600"
                            onClick={() => onJoinWaitlist(session.id)}
                            data-testid={`button-waitlist-${session.id}`}
                          >
                            Join Waitlist
                          </Button>
                        ) : (
                          <Button disabled data-testid={`button-full-${session.id}`}>
                            Full
                          </Button>
                        )
                      ) : (
                        <Button 
                          className="library-button"
                          onClick={() => onRegister(session.id)}
                          data-testid={`button-register-${session.id}`}
                        >
                          Register
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
