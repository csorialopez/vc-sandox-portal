
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { credentialsData, type SupportedFormat } from "@/lib/data";
import { Button } from "./ui/button";
import { FileCheck, FilePlus, MoreHorizontal, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { AddCredentialTemplateDialog } from "./add-credential-template-dialog";
import { AddVerificationTemplateDialog } from "./add-verification-template-dialog";

// Helper function to format the format string
function formatFormat(format: SupportedFormat): string {
  debugger
  if (format === "mso_mdoc") return "MDOC";
  if (format === "dc+sd-jwt") return "SD-JWT";
  return format;
}

export function CredentialTypesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddIssuanceOpen, setIsAddIssuanceOpen] = useState(false);
  const [isAddVerificationOpen, setIsAddVerificationOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Expand credentials data to show one row per credential type and format combination
  const credentialTypesList = credentialsData.flatMap((credential) =>
    credential.supportedFormats.map((format) => ({
      id: `${credential.id}-${format}`,
      credentialName: credential.name,
      technicalName: credential.id,
      format: format,
    }))
  );

  const filteredTypes = credentialTypesList.filter(
    (type) =>
      type.credentialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.technicalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatFormat(type.format).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCredTypeDetails = () => {
    setIsDialogOpen(true);
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Credential Types
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsAddVerificationOpen(true)}>
              <FileCheck className="mr-2 h-4 w-4" />
              Import Credential Type
            </Button>
            <Button onClick={() => setIsAddIssuanceOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Credential Type
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Types</CardTitle>
            <CardDescription>
              A list of all credential types in the system.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-4.5 h-10 w-4 text-muted-foreground" />
              <Input
                placeholder="Search credential types..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credential Name</TableHead>
                  <TableHead>Credential Type(Schema ID)</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.credentialName}</TableCell>
                    <TableCell className="font-mono text-sm">{type.technicalName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatFormat(type.format)}</Badge>
                    </TableCell>
                    <TableCell>Default</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={handleCredTypeDetails} >
                            View Credential Type
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Credential Type details</DialogTitle>
              <DialogDescription>
                Work in progress.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <AddCredentialTemplateDialog open={isAddIssuanceOpen} onOpenChange={setIsAddIssuanceOpen} />
      <AddVerificationTemplateDialog open={isAddVerificationOpen} onOpenChange={setIsAddVerificationOpen} />
    </>
  );
}
