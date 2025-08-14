import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Users, QrCode, Plus, Download, Filter, Copy, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EventForm } from "@/components/event-form";
import { RegistrationsList } from "@/components/registrations-list";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type EventWithRegistrations } from "@shared/schema";

export function AdminEventsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<EventWithRegistrations | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<EventWithRegistrations | null>(null);

  const { data: events, isLoading } = useQuery<EventWithRegistrations[]>({
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

  const copyEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest("POST", `/api/admin/events/${eventId}/copy`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Event Copied",
        description: "Event has been successfully copied.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Copy Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportRegistrations = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/export`, {
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
    <>
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
                  Capacity
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
                const registrationsCount = event.capacity - event.remaining;

                return (
                  <tr key={event.id} data-testid={`row-event-${event.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-foreground" data-testid={`text-event-title-${event.id}`}>
                          {event.title}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-event-location-${event.id}`}>
                          {event.location}{event.room && ` - ${event.room}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-event-date-${event.id}`}>
                      {formatDate(event.startTime.toString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-event-capacity-${event.id}`}>
                      {event.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`text-event-registrations-${event.id}`}>
                      {registrationsCount}/{event.capacity}
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
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEventForRegistrations(event);
                            setShowRegistrations(true);
                          }}
                          data-testid={`button-view-registrations-${event.id}`}
                          title="View Registrations"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportRegistrations(event.id)}
                          data-testid={`button-export-registrations-${event.id}`}
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyEventMutation.mutate(event.id)}
                          disabled={copyEventMutation.isPending}
                          data-testid={`button-copy-event-${event.id}`}
                        >
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </Button>
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

      
      {/* Registrations List Dialog */}
      {showRegistrations && selectedEventForRegistrations && (
        <RegistrationsList
          eventId={selectedEventForRegistrations.id}
          eventTitle={selectedEventForRegistrations.title}
          open={showRegistrations}
          onClose={() => {
            setShowRegistrations(false);
            setSelectedEventForRegistrations(null);
          }}
        />
      )}
    </>
  );
}
