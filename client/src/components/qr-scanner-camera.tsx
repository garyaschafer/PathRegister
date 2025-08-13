import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Search, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScanResult {
  valid: boolean;
  ticket?: any;
  registration?: any;
  session?: any;
  event?: any;
  checkedIn?: boolean;
  message?: string;
}

export function QRScannerCamera() {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);

  const verifyTicketMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const response = await apiRequest("GET", `/api/verify-ticket/${ticketCode}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      if (data.valid && !data.checkedIn) {
        // Auto-check in if ticket is valid and not already checked in
        checkinMutation.mutate(data.ticket.ticketCode);
      }
    },
    onError: (error: Error) => {
      setScanResult({
        valid: false,
        message: error.message,
      });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (ticketCode: string) => {
      const response = await apiRequest("POST", `/api/checkin/${ticketCode}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Check-in Successful",
        description: `${data.registration.firstName} ${data.registration.lastName} checked in successfully.`,
      });
      
      // Add to recent check-ins
      setRecentCheckins(prev => [
        {
          name: `${data.registration.firstName} ${data.registration.lastName}`,
          time: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          id: data.ticket.id,
        },
        ...prev.slice(0, 4) // Keep only 5 most recent
      ]);
      
      setScanResult(null);
      setManualCode("");
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please use manual entry.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleManualLookup = () => {
    if (manualCode.trim()) {
      verifyTicketMutation.mutate(manualCode.trim().toUpperCase());
    }
  };

  const handleConfirmCheckin = () => {
    if (scanResult?.ticket?.ticketCode) {
      checkinMutation.mutate(scanResult.ticket.ticketCode);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 space-y-6">
      <div className="text-center text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Register Path Scanner</h2>
        <p className="text-gray-300">Scan QR tickets for event check-in</p>
      </div>
      
      {/* Camera Scanner */}
      <Card className="library-card overflow-hidden">
        <CardContent className="p-0">
          <div className="qr-scanner-viewfinder bg-gray-100 flex items-center justify-center relative">
            {isScanning ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                data-testid="video-scanner"
              />
            ) : (
              <div className="w-64 h-64 border-4 border-dashed border-primary rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Position QR code in frame</p>
                </div>
              </div>
            )}
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="qr-scanner-corners">
                <div className="qr-scanner-corner top-left"></div>
                <div className="qr-scanner-corner top-right"></div>
                <div className="qr-scanner-corner bottom-left"></div>
                <div className="qr-scanner-corner bottom-right"></div>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <Button 
              className={`w-full py-3 mb-3 ${isScanning ? 'bg-red-600 hover:bg-red-700' : 'library-button'}`}
              onClick={isScanning ? stopCamera : startCamera}
              data-testid="button-toggle-camera"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isScanning ? "Stop Camera" : "Start Camera"}
            </Button>
            
            {/* Manual entry option */}
            <div className="border-t pt-4">
              <label htmlFor="manualCode" className="block text-sm font-medium text-foreground mb-2">
                Manual Entry
              </label>
              <div className="flex gap-2">
                <Input 
                  id="manualCode"
                  type="text" 
                  placeholder="Enter ticket code" 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  data-testid="input-manual-code"
                />
                <Button 
                  variant="outline"
                  onClick={handleManualLookup}
                  disabled={verifyTicketMutation.isPending}
                  data-testid="button-manual-lookup"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Scan Results */}
      {scanResult && (
        <Card className="library-card" data-testid="card-scan-result">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                scanResult.valid ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {scanResult.valid ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <X className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {scanResult.valid ? (scanResult.checkedIn ? "Already Checked In" : "Valid Ticket") : "Invalid Ticket"}
              </h3>
            </div>
            
            {scanResult.valid && scanResult.ticket && (
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium" data-testid="text-scan-event-title">
                    {scanResult.event?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session:</span>
                  <span className="font-medium" data-testid="text-scan-session-title">
                    {scanResult.session?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attendee:</span>
                  <span className="font-medium" data-testid="text-scan-attendee-name">
                    {scanResult.registration?.firstName} {scanResult.registration?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket:</span>
                  <span className="font-medium font-mono" data-testid="text-scan-ticket-code">
                    {scanResult.ticket.ticketCode}
                  </span>
                </div>
              </div>
            )}

            {scanResult.message && (
              <p className="text-sm text-muted-foreground text-center mb-4">
                {scanResult.message}
              </p>
            )}
            
            {scanResult.valid && !scanResult.checkedIn && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                onClick={handleConfirmCheckin}
                disabled={checkinMutation.isPending}
                data-testid="button-confirm-checkin"
              >
                {checkinMutation.isPending ? "Checking In..." : "Confirm Check-In"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Recent Check-ins */}
      <Card className="library-card">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Check-ins</h3>
          <div className="space-y-3">
            {recentCheckins.length > 0 ? (
              recentCheckins.map((checkin) => (
                <div 
                  key={checkin.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  data-testid={`checkin-recent-${checkin.id}`}
                >
                  <div>
                    <p className="font-medium text-foreground" data-testid={`text-checkin-name-${checkin.id}`}>
                      {checkin.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-checkin-time-${checkin.id}`}>
                      {checkin.time}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent check-ins</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
