
"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";

interface AddCredentialTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCredentialTemplateDialog({
  open,
  onOpenChange,
}: AddCredentialTemplateDialogProps) {
    const [jsonContent, setJsonContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            JSON.parse(jsonContent);
            // Simulate saving the template
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
                title: "Template Saved",
                description: "The new credential template has been added successfully.",
            });
            onOpenChange(false);
            setJsonContent("");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Invalid JSON",
                description: "The content you pasted is not valid JSON. Please check and try again.",
            });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setJsonContent("");
        }
        onOpenChange(isOpen);
    }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Credential Template</DialogTitle>
          <DialogDescription>
            Paste the JSON content of your new credential template below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder='{ "id": "my-new-credential", "name": "My Credential", ... }'
            className="h-64 font-code"
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !jsonContent}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
