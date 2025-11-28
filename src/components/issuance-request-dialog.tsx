
"use client";

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
import { ExternalLink } from "lucide-react";

interface IssuanceRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeValue: string | null;
  credentialOfferUri: string | null;
}

export function IssuanceRequestDialog({
  open,
  onOpenChange,
  qrCodeValue,
  credentialOfferUri,
}: IssuanceRequestDialogProps) {
  
  if (!qrCodeValue || !credentialOfferUri) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan to Receive Credential</DialogTitle>
          <DialogDescription>
            Scan the QR code with your digital wallet to accept the credential offer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4 bg-white rounded-lg">
          <Image
            src={qrCodeValue}
            alt="Credential Offer QR Code"
            width={300}
            height={300}
            priority
          />
        </div>
        <DialogFooter className="sm:justify-center flex-col items-center space-y-2">
            <Button asChild variant="default" size="sm">
              <a href={credentialOfferUri} target="_blank" rel="noopener noreferrer">
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
