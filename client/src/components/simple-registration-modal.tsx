import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type EventWithRegistrations } from "@shared/schema";

interface SimpleRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string | null;
  onSuccess: (data: any) => void;
}

export function SimpleRegistrationModal({ open, onClose, eventId, onSuccess }: SimpleRegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "", 
    email: "",
    phone: "",
    seats: 1,
    terms: false
  });

  // Get event details
  const { data: event, isLoading } = useQuery<EventWithRegistrations>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId && open,
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/register", {
        ...data,
        eventId,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Registration Successful",
        description: "You have been registered for the event!",
      });
      handleClose();
      onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "", 
      email: "",
      phone: "",
      seats: 1,
      terms: false
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.terms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    registrationMutation.mutate(formData);
  };

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="library-modal-content max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="library-modal-content max-w-2xl" data-testid="modal-registration">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Register for Event</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} data-testid="button-close-modal">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-muted-foreground">{event.title}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Enter your first name"
                data-testid="input-firstName"
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Enter your last name"
                data-testid="input-lastName"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your.email@example.com"
              data-testid="input-email"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              data-testid="input-phone"
            />
          </div>

          <div>
            <Label htmlFor="seats">Number of Seats</Label>
            <select
              id="seats"
              value={formData.seats}
              onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              data-testid="select-seats"
            >
              <option value={1}>1 seat</option>
              <option value={2}>2 seats</option>
              <option value={3}>3 seats</option>
              <option value={4}>4 seats</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms}
              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.checked }))}
              data-testid="checkbox-terms"
            />
            <Label htmlFor="terms">I agree to the terms and conditions *</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 library-button"
              disabled={isSubmitting}
              data-testid="button-submit-registration"
            >
              {isSubmitting ? "Submitting..." : "Complete Registration"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}