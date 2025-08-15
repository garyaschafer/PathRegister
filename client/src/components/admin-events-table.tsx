import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Users, QrCode, Plus, Download, Filter, Copy, Eye, Trash2, X, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo.toISOString().split('T')[0];
  });
  const [endDateFilter, setEndDateFilter] = useState("");

  const { data: allEvents, isLoading } = useQuery<EventWithRegistrations[]>({
    queryKey: ["/api/admin/events"],
  });

  // Filter events based on date range
  const events = allEvents?.filter(event => {
    const eventDate = new Date(event.startTime);
    const startDate = startDateFilter ? new Date(startDateFilter) : null;
    const endDate = endDateFilter ? new Date(endDateFilter) : null;
    
    if (startDate && eventDate < startDate) return false;
    if (endDate && eventDate > endDate) return false;
    return true;
  }) || [];

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

  const clearFilters = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    setStartDateFilter(sevenDaysAgo.toISOString().split('T')[0]);
    setEndDateFilter("");
  };

  const hasActiveFilters = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const defaultStartDate = sevenDaysAgo.toISOString().split('T')[0];
    return startDateFilter !== defaultStartDate || endDateFilter !== "";
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
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant={hasActiveFilters() ? "default" : "outline"} 
                  size="sm" 
                  data-testid="button-filter-events" 
                  title="Filter Events"
                  className={hasActiveFilters() ? "library-button" : ""}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {hasActiveFilters() && <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">ON</Badge>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filter Events</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="end-date" className="text-sm">End Date (Optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="flex-1"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setShowFilters(false)}
                        className="flex-1 library-button"
                      >
                        Apply
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Default: Shows events from 7 days ago to future
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
              <DialogTrigger asChild>
                <Button className="library-button" size="sm" data-testid="button-new-event" title="Create New Event">
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
      
      {/* Filter Results Summary */}
      {(hasActiveFilters() || events.length !== allEvents?.length) && (
        <div className="px-6 py-3 bg-blue-50 border-b text-sm text-blue-700">
          Showing {events.length} of {allEvents?.length || 0} events
          {hasActiveFilters() && " (filtered)"}
        </div>
      )}
      
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
                          title="Edit Event"
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
                          title="Export Registrations to CSV"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyEventMutation.mutate(event.id)}
                          disabled={copyEventMutation.isPending}
                          data-testid={`button-copy-event-${event.id}`}
                          title="Copy Event"
                        >
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-delete-event-${event.id}`}
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{event.title}"? This action cannot be undone. 
                                All registrations and tickets for this event will also be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid={`button-cancel-delete-${event.id}`}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteEventMutation.mutate(event.id)}
                                disabled={deleteEventMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                data-testid={`button-confirm-delete-${event.id}`}
                              >
                                {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                title="Create Your First Event"
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
