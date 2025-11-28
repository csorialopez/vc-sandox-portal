
"use client";

import { useState } from "react";
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
import { activityLogData } from "@/lib/data";
import { Search, BadgeCheck, BadgeX, FilePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const eventIcons = {
  "Credential Issued": <FilePlus className="w-4 h-4 text-blue-500" />,
  "Verification Success": <BadgeCheck className="w-4 h-4 text-green-500" />,
  "Verification Failed": <BadgeX className="w-4 h-4 text-red-500" />,
};

const PAGE_SIZE = 15;

export function ActivityLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEvents = activityLogData.filter(
    (event) =>
      event.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.credential.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            A log of recent credential-related activities in the system.
          </CardDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by event or credential..."
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
                <TableHead>Event</TableHead>
                <TableHead>Credential</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEvents.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {eventIcons[log.event as keyof typeof eventIcons]}
                      <span className="font-medium">{log.event}</span>
                    </div>
                  </TableCell>
                   <TableCell>
                    <Badge variant="secondary">{log.credential}</Badge>
                   </TableCell>
                  <TableCell>{log.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            <strong>
              {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredEvents.length)} - {Math.min(currentPage * PAGE_SIZE, filteredEvents.length)}
            </strong>{" "}
            of <strong>{filteredEvents.length}</strong> events
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
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
