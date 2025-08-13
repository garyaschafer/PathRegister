import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Users, QrCode, Plus, Download, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EventForm } from "@/components/event-form";
import { SessionForm } from "@/components/session-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type EventWithSessions } from "@shared/schema";

export function AdminEventsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<EventWithSessions | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  const { data: events, isLoading } = useQuery<EventWithSessions[]>({
    queryKey: ["/api/admin/events"],
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/admin/events/${eventId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Event Deleted",
        description: "Event has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportRegistrations = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/export`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registrations.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Registrations exported to CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export registrations.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "bg-green-100 text-green-800",
      draft: "bg-gray-100 text-gray-800",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.draft}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEventFormSuccess = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
  };

  const handleSessionFormSuccess = () => {
    setShowSessionForm(false);
    setSelectedEvent(null);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
  };

  if (isLoading) {
    return (
      <Card className="library-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="library-card overflow-hidden">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Events Management</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-filter-events">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
              <DialogTrigger asChild>
                <Button className="library-button" size="sm" data-testid="button-new-event">
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEvent ? "Edit Event" : "Create New Event"}
                  </DialogTitle>
                </DialogHeader>
                <EventForm 
                  event={selectedEvent} 
                  onSuccess={handleEventFormSuccess}
                  onCancel={() => setShowEventForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {events?.map((event) => {
                const totalRegistrations = event.sessions.reduce((sum, session) => 
                  sum + (session.capacity - session.remaining), 0
                );
                const totalCapacity = event.sessions.reduce((sum, session) => 
                  sum + session.capacity, 0
                );

                return (
                  <tr key={event.id} data-testid={`row-event-${event.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground" data-testid={`text-event-title-${event.id}`}>
                          {event.title}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-event-location-${event.id}`}>
                          {event.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-event-date-${event.id}`}>
                      {formatDate(event.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-event-sessions-${event.id}`}>
                      {event.sessions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-event-registrations-${event.id}`}>
                      {totalRegistrations}/{totalCapacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventForm(true);
                          }}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-registrations-${event.id}`}
                            >
                              <Users className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Sessions for {event.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {event.sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                                  <div>
                                    <h4 className="font-medium">{session.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {session.capacity - session.remaining}/{session.capacity} registered
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportRegistrations(session.id)}
                                    data-testid={`button-export-${session.id}`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={showSessionForm} onOpenChange={setShowSessionForm}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                              data-testid={`button-add-session-${event.id}`}
                            >
                              <Plus className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Add Session to {event.title}</DialogTitle>
                            </DialogHeader>
                            <SessionForm 
                              eventId={event.id}
                              onSuccess={handleSessionFormSuccess}
                              onCancel={() => setShowSessionForm(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {!events || events.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-foreground mb-2">No Events Created</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started.</p>
              <Button 
                className="library-button"
                onClick={() => setShowEventForm(true)}
                data-testid="button-create-first-event"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
