
"use client";

import { useState, useEffect, useRef } from "react";
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
import { ExternalLink, Copy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface PreAuthorizedIssuanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeValue: string | null;
  txCode: string | null;
  onTimeout: () => void;
}

const TIMEOUT_SECONDS = 30;

export function PreAuthorizedIssuanceDialog({
  open,
  onOpenChange,
  qrCodeValue,
  txCode,
  onTimeout,
}: PreAuthorizedIssuanceDialogProps) {
  
  const [progress, setProgress] = useState(100);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (open) {
      setProgress(100);
      const timer = setTimeout(() => {
        onTimeout();
      }, TIMEOUT_SECONDS * 1000);

      intervalRef.current = setInterval(() => {
        setProgress(prev => {
            const nextVal = prev - (100 / TIMEOUT_SECONDS);
            if(nextVal <= 0) {
                clearInterval(intervalRef.current);
                return 0;
            }
            return nextVal;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [open, onTimeout]);
  
  if (!qrCodeValue || !txCode) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeValue)}`;

  const copyTxCode = () => {
    navigator.clipboard.writeText(txCode);
    toast({
      title: "Copied to Clipboard",
      description: "Transaction code has been copied.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan to Receive Credential</DialogTitle>
          <DialogDescription>
            Scan the QR code or use the code below. This offer will expire in {TIMEOUT_SECONDS} seconds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg">
                <Image
                    src={qrCodeUrl}
                    alt="Credential Offer QR Code"
                    width={300}
                    height={300}
                    priority
                />
            </div>
            <div className="w-full flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Add your one-time code when asked:</p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md border">
                    <span className="text-2xl font-bold font-mono tracking-widest">{txCode}</span>
                    <Button variant="ghost" size="icon" onClick={copyTxCode}>
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            <div className="w-full pt-2">
                <Progress value={progress} className="h-2" />
            </div>
        </div>
        <DialogFooter className="sm:justify-center flex-col items-center space-y-2 pt-4">
            <Button asChild variant="default" size="sm">
              <a href={qrCodeValue} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open In Wallet
              </a>
            </Button>
             <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
