
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PresentationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeValue: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
}

const TIMEOUT_SECONDS = 25;

export function PresentationRequestDialog({
  open,
  onOpenChange,
  qrCodeValue,
  status,
}: PresentationRequestDialogProps) {
  
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start timeout bar only while dialog is open and waiting for wallet
    if (open && status === 'pending') {
      setProgress(100);

      const timeout = setTimeout(() => {
        onOpenChange(false);
      }, TIMEOUT_SECONDS * 1000);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const nextVal = prev - 100 / TIMEOUT_SECONDS;
          if (nextVal <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return nextVal;
        });
      }, 1000);

      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    // If dialog closes or status changes away from pending, stop the bar
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [open, status, onOpenChange]);
  
  if (!qrCodeValue) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeValue)}`;

  const renderStatus = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for wallet scan...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Verification Successful!</span>
          </div>
        );
      case 'error':
         return (
          <div className="flex items-center justify-center gap-2 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>Verification Failed/Timed Out.</span>
          </div>
        );
      default:
        return (
           <p className="text-sm text-muted-foreground text-center">
            Scan the QR code with your digital wallet to share your credential.
          </p>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan with your Wallet</DialogTitle>
          <DialogDescription asChild>
             {renderStatus()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center p-4 bg-white rounded-lg">
            {(status === 'pending' || status === 'idle') ? (
              <Image
                src={qrCodeUrl}
                alt="Presentation Request QR Code"
                width={300}
                height={300}
                priority
              />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-100 rounded-md">
                  {status === 'success' && <CheckCircle className="w-24 h-24 text-green-500" />}
                  {status === 'error' && <XCircle className="w-24 h-24 text-red-500" />}
              </div>
            )}
          </div>
          {status === 'pending' && (
            <div className="w-full pt-2">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-center flex-col items-center space-y-2">
            <Button asChild variant="default" size="sm">
              <a href={qrCodeValue} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open With Your Wallet
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
