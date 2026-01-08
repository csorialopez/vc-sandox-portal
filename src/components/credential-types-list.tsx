
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

export function CredentialTypesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddIssuanceOpen, setIsAddIssuanceOpen] = useState(false);
  const [isAddVerificationOpen, setIsAddVerificationOpen] = useState(false);


  const filteredTypes = credentialTemplatesData.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.format.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <TableHead>Credential Name</TableHead>
                  <TableHead>Credential Type(Schema ID)</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <Badge variant={type.type === 'Issuance' ? 'default' : 'secondary'}>
                        {type.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{type.format}</Badge>
                    </TableCell>
                    <TableCell>{type.createdAt}</TableCell>
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
