"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Button } from "./ui/button";

interface RootsOfTrustItem {
  id: number;
  rootsOfTrust: string;
  description: string;
}

const PAGE_SIZE = 20;

const ROOTS_OF_TRUST_DATA: RootsOfTrustItem[] = [
  {
    id: 1,
    rootsOfTrust: "PKI Root CA",
    description: "Main Trust Anchor: the root that starts the chain of trust in the DC environment",
  },
  {
    id: 2,
    rootsOfTrust: "Master Trusted List",
    description: "A definitive directory of trusted entities within the DC ecosystem",
  },
];

export function RootsOfTrustSection() {
  const [data, setData] = useState<RootsOfTrustItem[]>([]);
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
        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const endIdx = startIdx + PAGE_SIZE;
        const paginatedData = ROOTS_OF_TRUST_DATA.slice(startIdx, endIdx);

        setData(paginatedData);
        setTotalElements(ROOTS_OF_TRUST_DATA.length);
      } catch (err: any) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentPage]);

  const filteredData = data.filter(
    (item) =>
      item.id.toString().includes(searchTerm.toLowerCase()) ||
      item.rootsOfTrust.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Root of Trust</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Properties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.rootsOfTrust}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={false}>
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Properties</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roots of Trust Configuration</CardTitle>
        <CardDescription>A list of all roots of trust and their configuration.</CardDescription>
        <div className="relative pt-2">
          <Search className="absolute left-2.5 top-4.5 h-10 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by root of trust, description, or properties..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading || !!error}
          />
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
      {!loading && !error && data.length > 0 && (
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <strong>
              {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalElements)} - {Math.min(currentPage * PAGE_SIZE, totalElements)}
            </strong>{" "}
            of <strong>{totalElements}</strong> roots of trust
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
