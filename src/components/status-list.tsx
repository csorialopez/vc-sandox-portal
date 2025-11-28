
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { format } from "date-fns";

interface StatusListItem {
  id: number;
  issueDate: string;
  expiryDate: string;
  credentialType: string;
  format: string;
  status: "ACTIVE" | "revoked" | string;
  statusList: {
    id: string;
  };
}

const PAGE_SIZE = 20;

export function StatusList() {
  const [data, setData] = useState<StatusListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    async function fetchData() {
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
    }
    fetchData();
  }, [currentPage]);

  const filteredCredentials = data.filter(
    (credential) =>
      credential.id.toString().includes(searchTerm.toLowerCase()) ||
      credential.credentialType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
                <TableHead>ID</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Credential Type</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Status List ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell className="font-mono text-xs">{credential.id}</TableCell>
                   <TableCell>
                    {format(new Date(credential.issueDate), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(credential.expiryDate), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{credential.credentialType}</Badge>
                  </TableCell>
                  <TableCell>{credential.format}</TableCell>
                   <TableCell className="font-mono text-xs">{credential.statusList.id}</TableCell>
                  <TableCell>
                    <Badge variant={credential.status.toLowerCase() === 'active' ? 'default' : 'destructive'}>
                      {credential.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Status List</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credential Status</CardTitle>
          <CardDescription>
            A list of all credentials and their current status.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, credential type, or status..."
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
  );
}
