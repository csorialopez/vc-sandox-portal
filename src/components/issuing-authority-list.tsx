"use client";

import { useState, useCallback, useEffect } from "react";
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
import { credentialTemplatesData } from "@/lib/data";
import { Button } from "./ui/button";
import { FileCheck, FilePlus, MoreHorizontal, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { AddCredentialTemplateDialog } from "./add-credential-template-dialog";
import { AddVerificationTemplateDialog } from "./add-verification-template-dialog";
import { useSettings } from "@/context/settings-context";
import { getCredentialTypeAlias } from "@/lib/data";

interface CredentialListItem {
  id: number;
  fullName: string | null;
  credentialType: string;
  format: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: string;
}

const PAGE_SIZE = 20;

export function IssuingAuthorityList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddIssuanceOpen, setIsAddIssuanceOpen] = useState(false);
  const [isAddVerificationOpen, setIsAddVerificationOpen] = useState(false);
  const [isPropDialogOpen, setIsPropDialogOpen] = useState(false);
  const [isCSCDialogOpen, setIsCSCDialogOpen] = useState(false);
  const [data, setData] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { userDataVisible } = useSettings();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/status-list?page=${currentPage - 1}&size=${PAGE_SIZE}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const result = await response.json();
      if (result && Array.isArray(result.content)) {
        setData(result.content);
        setTotalElements(result.totalElements || 0);
      } else {
        setData([]);
        setTotalElements(0);
        console.warn("API did not return an array in result.content:", result);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique issuing authorities (take first occurrence of each)
  const uniqueIssuingAuthorities = Array.from(
    new Map(data.map((credential) => [credential.issuingAuthority, credential])).values()
  );

  const filteredCredentials = uniqueIssuingAuthorities.filter((credential) =>
    credential.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePropDetails = () => {
    setIsPropDialogOpen(true);
  };

  const handleCredSignCert = () => {
    setIsCSCDialogOpen(true);
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Issuing Authority
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsAddVerificationOpen(true)}>
              <FileCheck className="mr-2 h-4 w-4" />
              Import Issuer
            </Button>
            <Button onClick={() => setIsAddIssuanceOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              Create Issuer
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Issuers</CardTitle>
            <CardDescription>
              A list of all credential templates in the system.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-4.5 h-10 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issuers..."
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
                  <TableHead>Issuer Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Credential Signer Certificate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCredentials.map((credential) => (
                  <TableRow key={credential.id}>
                    <TableCell className="font-medium">{credential.issuingAuthority}</TableCell>
                    <TableCell>Default</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={handlePropDetails}>
                            View Properties
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={handleCredSignCert} >
                            View Credential Signer Certificate
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
        <Dialog open={isPropDialogOpen} onOpenChange={setIsPropDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Properties details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <div className="flex items-center">
                <span className="font-medium">Active:</span>
                <span className="text-muted-foreground">Yes</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Test:</span>
                <span className="text-muted-foreground">Default</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Test2:</span>
                <span className="text-muted-foreground">Default</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isCSCDialogOpen} onOpenChange={setIsCSCDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Credential Signer Certificate's details</DialogTitle>
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
