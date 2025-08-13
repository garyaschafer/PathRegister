import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const sessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  room: z.string().min(1, "Room is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  price: z.number().min(0, "Price cannot be negative"),
  allowWaitlist: z.boolean(),
});

type SessionForm = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  eventId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SessionForm({ eventId, onSuccess, onCancel }: SessionFormProps) {
  const { toast } = useToast();

  const form = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      room: "",
      startTime: "",
      endTime: "",
      capacity: 20,
      price: 0,
      allowWaitlist: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SessionForm) => {
      const payload = {
        ...data,
        eventId,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        price: data.price.toFixed(2),
      };
      
      const response = await apiRequest("POST", "/api/admin/sessions", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Session Created",
        description: "Session has been successfully created.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SessionForm) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter session title" {...field} data-testid="input-session-title" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="room"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room/Location *</FormLabel>
              <FormControl>
                <Input placeholder="Enter room or location" {...field} data-testid="input-session-room" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-session-start-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} data-testid="input-session-end-time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="20"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-session-capacity"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    data-testid="input-session-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="allowWaitlist"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox 
                  checked={field.value} 
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-allow-waitlist"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow waitlist when session is full</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1" 
            onClick={onCancel}
            disabled={createMutation.isPending}
            data-testid="button-cancel-session"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1 library-button"
            disabled={createMutation.isPending}
            data-testid="button-save-session"
          >
            {createMutation.isPending ? "Creating..." : "Create Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
