
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
import { Badge } from "@/components/ui/badge";

interface AddVerificationTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVerificationTemplateDialog({
  open,
  onOpenChange,
}: AddVerificationTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Verification Template</DialogTitle>
          <DialogDescription>
            From here you will be able to define a verification template for a
            specific credential type, in order to request data from users.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center py-4">
          <Badge variant="outline">Coming soon!</Badge>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
