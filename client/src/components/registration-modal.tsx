import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  seats: z.number().min(1).max(4),
  terms: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface RegistrationModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
  onSuccess: (data: any) => void;
}

export function RegistrationModal({ open, onClose, sessionId, onSuccess }: RegistrationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      seats: 1,
      terms: false,
    },
  });

  // Get session details
  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId && open,
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const response = await apiRequest("POST", "/api/register", {
        ...data,
        sessionId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "payment_required") {
        // Handle payment flow
        setIsProcessing(true);
        toast({
          title: "Payment Required",
          description: "Redirecting to payment...",
        });
        
        // Here you would integrate with Stripe Elements
        // For now, we'll simulate success
        setTimeout(() => {
          setIsProcessing(false);
          onSuccess(data);
          handleClose();
        }, 2000);
      } else {
        toast({
          title: "Registration Successful!",
          description: data.message,
        });
        onSuccess(data);
        handleClose();
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setIsProcessing(false);
    onClose();
  };

  const onSubmit = (data: RegistrationForm) => {
    registrationMutation.mutate(data);
  };

  if (!session && !isLoading) return null;

  const sessionPrice = session ? parseFloat(session.price) : 0;
  const totalCost = sessionPrice * (form.watch("seats") || 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="library-modal-content max-w-2xl" data-testid="modal-registration">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Register for Session</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} data-testid="button-close-modal">
              <X className="w-5 h-5" />
            </Button>
          </div>
          {session && (
            <p className="text-muted-foreground">
              {session.event?.title} - {session.title}
            </p>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your first name" {...field} data-testid="input-firstName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your last name" {...field} data-testid="input-lastName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Seats</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue="1">
                    <FormControl>
                      <SelectTrigger data-testid="select-seats">
                        <SelectValue placeholder="Select number of seats" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 seat</SelectItem>
                      <SelectItem value="2">2 seats</SelectItem>
                      <SelectItem value="3">3 seats</SelectItem>
                      <SelectItem value="4">4 seats</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {sessionPrice > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg" data-testid="section-payment">
                <h4 className="font-semibold text-foreground mb-3">Payment Information</h4>
                <div className="flex justify-between items-center text-lg">
                  <span>Total Amount:</span>
                  <span className="font-bold text-primary" data-testid="text-total-cost">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Payment will be processed securely via Stripe.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-terms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        terms and conditions
                      </a>{" "}
                      *
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={handleClose}
                disabled={registrationMutation.isPending || isProcessing}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 library-button"
                disabled={registrationMutation.isPending || isProcessing}
                data-testid="button-submit-registration"
              >
                {isProcessing ? "Processing..." : registrationMutation.isPending ? "Submitting..." : "Complete Registration"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
