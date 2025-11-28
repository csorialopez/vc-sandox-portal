
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
import { Input } from "@/components/ui/input";
import { credentialTemplatesData } from "@/lib/data";
import { Button } from "./ui/button";
import { FileCheck, FilePlus, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { AddCredentialTemplateDialog } from "./add-credential-template-dialog";
import { AddVerificationTemplateDialog } from "./add-verification-template-dialog";

export function CredentialTemplatesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddIssuanceOpen, setIsAddIssuanceOpen] = useState(false);
  const [isAddVerificationOpen, setIsAddVerificationOpen] = useState(false);


  const filteredTemplates = credentialTemplatesData.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.format.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Policy Templates
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsAddVerificationOpen(true)}>
              <FileCheck className="mr-2 h-4 w-4" />
              Create Verification Template
            </Button>
            <Button onClick={() => setIsAddIssuanceOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Issuance Template
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Templates</CardTitle>
            <CardDescription>
              A list of all credential templates in the system.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
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
                  <TableHead>Template Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant={template.type === 'Issuance' ? 'default' : 'secondary'}>
                        {template.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.format}</Badge>
                    </TableCell>
                    <TableCell>{template.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AddCredentialTemplateDialog open={isAddIssuanceOpen} onOpenChange={setIsAddIssuanceOpen} />
      <AddVerificationTemplateDialog open={isAddVerificationOpen} onOpenChange={setIsAddVerificationOpen} />
    </>
  );
}
