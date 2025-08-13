import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, DollarSign } from "lucide-react";
import { type EventWithRegistrations } from "@shared/schema";

interface EventCardProps {
  event: EventWithRegistrations;
  onRegister: (eventId: string) => void;
  onJoinWaitlist: (eventId: string) => void;
}

export function EventCard({ event, onRegister, onJoinWaitlist }: EventCardProps) {
  const getEventBadge = (price: string | number) => {
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    if (priceNum === 0) return <Badge className="library-badge-free">Free Event</Badge>;
    return <Badge className="library-badge-paid">Premium Workshop</Badge>;
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isFull = event.remaining <= 0;
  const price = typeof event.price === 'string' ? parseFloat(event.price) : event.price;
  const registeredCount = event.capacity - event.remaining;

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
            {getEventBadge(event.price)}
            <span className="text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 inline mr-1" />
              {formatDate(event.startTime)}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-4" data-testid={`text-title-${event.id}`}>
            {event.title}
          </h3>
          
          <p className="text-muted-foreground mb-6" data-testid={`text-description-${event.id}`}>
            {event.description}
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {event.location}{event.room && ` - ${event.room}`}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {registeredCount}/{event.capacity} registered
              </div>
              {price > 0 && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  ${price.toFixed(2)}
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              {!isFull ? (
                <Button 
                  className="library-button flex-1"
                  onClick={() => onRegister(event.id)}
                  data-testid={`button-register-${event.id}`}
                >
                  {price > 0 ? `Register - $${price.toFixed(2)}` : "Register Free"}
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="flex-1" disabled>
                    Event Full
                  </Button>
                  {event.allowWaitlist && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onJoinWaitlist(event.id)}
                      data-testid={`button-waitlist-${event.id}`}
                    >
                      Join Waitlist
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}