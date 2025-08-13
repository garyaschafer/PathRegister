import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useLocation } from "wouter";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EventCard } from "@/components/event-card";
import { RegistrationModal } from "@/components/registration-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type EventWithSessions } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [registrationModal, setRegistrationModal] = useState({
    open: false,
    sessionId: null as string | null,
  });

  const { data: events, isLoading, error } = useQuery<EventWithSessions[]>({
    queryKey: ["/api/events"],
  });

  const handleRegister = (sessionId: string) => {
    setRegistrationModal({
      open: true,
      sessionId,
    });
  };

  const handleJoinWaitlist = (sessionId: string) => {
    // For now, use the same modal but could be differentiated
    setRegistrationModal({
      open: true,
      sessionId,
    });
  };

  const handleRegistrationSuccess = (data: any) => {
    if (data.status === "confirmed" || data.status === "payment_required") {
      setLocation("/success");
    } else if (data.status === "waitlist") {
      toast({
        title: "Added to Waitlist",
        description: "You've been added to the waitlist. We'll notify you if a spot opens up.",
      });
    }
  };

  const closeRegistrationModal = () => {
    setRegistrationModal({
      open: false,
      sessionId: null,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Events</h2>
            <p className="text-muted-foreground">Please try again later</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-section text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-hero-title">
              Welcome to Register Path
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90" data-testid="text-hero-description">
              Discover and register for exciting library events, workshops, and community gatherings
            </p>
            <a href="#events">
              <Button className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg" data-testid="button-browse-events">
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4" data-testid="text-events-title">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="text-events-description">
              Join us for these exciting library programs and workshops
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid gap-8 md:gap-12">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleRegister}
                  onJoinWaitlist={handleJoinWaitlist}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-foreground mb-2">No Events Available</h3>
              <p className="text-muted-foreground">Check back soon for upcoming events!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Registration Modal */}
      <RegistrationModal
        open={registrationModal.open}
        onClose={closeRegistrationModal}
        sessionId={registrationModal.sessionId}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
