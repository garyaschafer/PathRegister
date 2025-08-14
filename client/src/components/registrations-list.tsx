import { useQuery } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { Mail, Phone, User, Calendar, QrCode, Check, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  seats: number;
  createdAt: string;
  tickets: Array<{
    id: string;
    ticketCode: string;
    checkedIn: boolean;
    checkedInAt?: string;
  }>;
}

interface RegistrationsListProps {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
}

export function RegistrationsList({ eventId, eventTitle, open, onClose }: RegistrationsListProps) {
  const { data: registrations, isLoading } = useQuery<Registration[]>({
    queryKey: ["/api/admin/events", eventId, "registrations"],
    enabled: !!eventId && open,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTotalSeats = (registrations: Registration[] | undefined) => {
    return registrations?.reduce((total, reg) => total + reg.seats, 0) || 0;
  };

  const getCheckedInCount = (registrations: Registration[] | undefined) => {
    return registrations?.reduce((total, reg) => {
      return total + reg.tickets.filter(ticket => ticket.checkedIn).length;
    }, 0) || 0;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Event Registrations</DialogTitle>
          <p className="text-muted-foreground">{eventTitle}</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{registrations?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Registrations</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{getTotalSeats(registrations)}</div>
                  <div className="text-sm text-muted-foreground">Total Seats</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{getCheckedInCount(registrations)}</div>
                  <div className="text-sm text-muted-foreground">Checked In</div>
                </CardContent>
              </Card>
            </div>

            {/* Registrations List */}
            {registrations && registrations.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Registered Attendees</h3>
                {registrations.map((registration) => (
                  <Card key={registration.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">
                                {registration.firstName} {registration.lastName}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {registration.email}
                                </div>
                                {registration.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {registration.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span>Registered {formatDistance(new Date(registration.createdAt), new Date(), { addSuffix: true })}</span>
                            </div>
                            <Badge variant="outline">
                              {registration.seats} seat{registration.seats > 1 ? 's' : ''}
                            </Badge>
                          </div>

                          {/* Tickets */}
                          <div className="mt-3 space-y-2">
                            <div className="text-sm font-medium">Tickets:</div>
                            {registration.tickets.map((ticket) => (
                              <div
                                key={ticket.id}
                                className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <QrCode className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-mono text-sm">{ticket.ticketCode}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {ticket.checkedIn ? (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <Check className="w-4 h-4" />
                                      <span className="text-sm">
                                        Checked in {ticket.checkedInAt ? formatDistance(new Date(ticket.checkedInAt), new Date(), { addSuffix: true }) : ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <X className="w-4 h-4" />
                                      <span className="text-sm">Not checked in</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Registrations Yet</h3>
                <p className="text-muted-foreground">This event doesn't have any registrations yet.</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}