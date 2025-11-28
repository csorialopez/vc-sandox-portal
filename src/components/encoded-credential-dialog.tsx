
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface EncodedCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encodedCredential: string | null;
}

export function EncodedCredentialDialog({
  open,
  onOpenChange,
  encodedCredential,
}: EncodedCredentialDialogProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (encodedCredential) {
      navigator.clipboard.writeText(encodedCredential);
      toast({
        title: "Copied to Clipboard",
        description: "The encoded credential has been copied.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>View Credential</DialogTitle>
          <DialogDescription>
            This is the raw encoded SD-JWT credential.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            readOnly
            value={encodedCredential || ""}
            className="h-64 font-code text-xs"
          />
        </div>
        <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleCopy} disabled={!encodedCredential}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
