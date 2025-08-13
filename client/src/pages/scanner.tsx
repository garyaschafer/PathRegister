import { QRScannerCamera } from "@/components/qr-scanner-camera";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Scanner() {
  return (
    <div className="library-qr-scanner min-h-screen py-8">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/admin">
            <Button variant="ghost" className="text-white hover:bg-white/10" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Scanner Component */}
        <QRScannerCamera />
      </div>
    </div>
  );
}
