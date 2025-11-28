
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search, ChevronLeft, ChevronRight, EyeOff, Loader2, AlertTriangle, User } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSettings } from "@/context/settings-context";
import { format } from "date-fns";
import { getCredentialTypeAlias } from "@/lib/data";
import { Badge } from "./ui/badge";
import { EncodedCredentialDialog } from "./encoded-credential-dialog";
import { useToast } from "@/hooks/use-toast";

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

export function CredentialsList() {
  const [data, setData] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const { userDataVisible } = useSettings();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [encodedCredential, setEncodedCredential] = useState<string | null>(null);
  const [isFetchingCredential, setIsFetchingCredential] = useState<number | null>(null);
  
  const [isRevokeAlertOpen, setIsRevokeAlertOpen] = useState(false);
  const [credentialToRevoke, setCredentialToRevoke] = useState<CredentialListItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

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
  
  const handleViewCredential = async (id: number) => {
    setIsFetchingCredential(id);
    try {
      const response = await fetch(`/api/status-list/v1/${id}/encoded`);
      if (!response.ok) {
        throw new Error(`Failed to fetch credential: ${response.statusText}`);
      }
      const result = await response.json();
      setEncodedCredential(result.data);
      setIsDialogOpen(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error fetching credential",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsFetchingCredential(null);
    }
  };

  const openRevokeDialog = (credential: CredentialListItem) => {
    setCredentialToRevoke(credential);
    setIsRevokeAlertOpen(true);
  }

  const handleRevokeCredential = async () => {
    if (!credentialToRevoke) return;

    setIsRevoking(true);
    try {
      const response = await fetch(`/api/status-list/v1/${credentialToRevoke.id}/revoke`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to revoke credential: ${response.status} ${errorText}`);
      }

      toast({
        title: "Credential Revoked",
        description: `Credential with ID ${credentialToRevoke.id} has been revoked.`,
      });
      
      setData(prevData => prevData.map(cred => 
        cred.id === credentialToRevoke.id ? { ...cred, status: 'revoked' } : cred
      ));

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Revocation Failed",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsRevoking(false);
      setIsRevokeAlertOpen(false);
      setCredentialToRevoke(null);
    }
  };

  const filteredCredentials = data.filter((credential) =>
    (userDataVisible && credential.fullName ? credential.fullName.toLowerCase() : "").includes(searchTerm.toLowerCase()) ||
    getCredentialTypeAlias(credential.credentialType).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };
  
  const renderUserCell = (credential: CredentialListItem) => {
      if (!userDataVisible) {
          return (
              <div className="flex items-center gap-3 text-muted-foreground">
                 <EyeOff className="w-4 h-4" />
                 <span>Hidden</span>
              </div>
          );
      }
      
      if (credential.fullName) {
          const initials = credential.fullName.split(' ').map(n => n[0]).join('');
          return (
               <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {initials || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                  <div className="font-medium">{credential.fullName}</div>
                </div>
              </div>
          )
      }

      return (
          <div className="flex items-center gap-3 text-muted-foreground">
             <EyeOff className="w-4 h-4" />
             <span>Not available</span>
          </div>
      );
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Error loading data</p>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Issuing Authority</TableHead>
              <TableHead>Issuance Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredentials.map((credential) => (
              <TableRow key={credential.id}>
                <TableCell>
                    {renderUserCell(credential)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getCredentialTypeAlias(credential.credentialType)}</Badge>
                </TableCell>
                <TableCell>{credential.format}</TableCell>
                <TableCell>{credential.issuingAuthority}</TableCell>
                <TableCell>{format(new Date(credential.issueDate), "yyyy-MM-dd")}</TableCell>
                <TableCell>{format(new Date(credential.expiryDate), "yyyy-MM-dd")}</TableCell>
                 <TableCell>
                   <Badge variant={credential.status?.toLowerCase() === 'active' ? 'default' : 'destructive'}>
                    {credential.status || 'UNKNOWN'}
                   </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={!!isFetchingCredential}>
                        <span className="sr-only">Open menu</span>
                         {isFetchingCredential === credential.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleViewCredential(credential.id)} disabled={credential.format === "mdoc"}>
                        View Credential
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => openRevokeDialog(credential)}
                        disabled={credential.status?.toLowerCase() === 'revoked'}
                      >
                        Revoke
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    );
  }

  return (
    <>
        <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Credentials</h2>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>All Credentials</CardTitle>
            <p className="text-sm text-muted-foreground">
                A list of all credentials in the system.
            </p>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by name or credential type..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading || !!error}
                />
            </div>
            </CardHeader>
            <CardContent>
            {renderContent()}
            </CardContent>
            {!loading && !error && data.length > 0 && (
            <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                Showing{" "}
                <strong>
                    {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalElements)} - {Math.min(currentPage * PAGE_SIZE, totalElements)}
                </strong>{" "}
                of <strong>{totalElements}</strong> credentials
                </div>
                <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
                </div>
            </CardFooter>
            )}
        </Card>
        </div>
        <EncodedCredentialDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            encodedCredential={encodedCredential}
        />
        <AlertDialog open={isRevokeAlertOpen} onOpenChange={setIsRevokeAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently revoke the credential
                with ID <span className="font-mono font-bold">{credentialToRevoke?.id}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevokeCredential}
                disabled={isRevoking}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
