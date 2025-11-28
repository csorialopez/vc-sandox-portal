
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  activityLogData,
  monthlyVerifications,
  getCredentialTypeAlias,
} from "@/lib/data";
import { MoreHorizontal, ArrowRight, BadgeCheck, BadgeX, FilePlus, EyeOff, Loader2, AlertTriangle, Users, Fingerprint, ClipboardList, User } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useSettings } from "@/context/settings-context";
import { format } from "date-fns";

const eventIcons = {
  "Credential Issued": <FilePlus className="w-4 h-4 text-blue-500" />,
  "Verification Success": <BadgeCheck className="w-4 h-4 text-green-500" />,
  "Verification Failed": <BadgeX className="w-4 h-4 text-red-500" />,
};

const chartConfig = {
  verifications: {
    label: "Successful",
    color: "hsl(var(--chart-2))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-1))",
  },
};

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

export function Dashboard() {
  const { userDataVisible } = useSettings();
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCredentialsCount, setTotalCredentialsCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/status-list?size=100");
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result = await response.json();
        if (result && Array.isArray(result.content)) {
          setCredentials(result.content);
          setTotalCredentialsCount(result.totalElements || result.content.length);
        } else {
          setCredentials([]);
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
  }, []);

  const recentCredentials = useMemo(() => credentials.slice(0, 10), [credentials]);
  const recentEvents = activityLogData.slice(0, 5);

  const credentialTypesData = useMemo(() => {
    const counts = credentials.reduce((acc, cred) => {
      const alias = getCredentialTypeAlias(cred.credentialType);
      acc[alias] = (acc[alias] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [credentials]);
  
  const totalUniqueUsers = useMemo(() => {
      return new Set(credentials.map(c => c.fullName).filter(Boolean)).size
  }, [credentials]);

  const dashboardStats = [
    {
      title: "Total Users",
      value: loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUniqueUsers,
      description: "Unique users in the system",
      icon: Users,
    },
    {
      title: "Total Credentials Issued",
      value: loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCredentialsCount,
      description: "Credentials issued to users",
      icon: Fingerprint,
    },
    {
      title: "Total Credential Templates",
      value: "5",
      description: "Available credential templates",
      icon: ClipboardList,
    },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF81E3", "#82ca9d"];
  const totalCredentialsInChart = credentials.length;

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
             <User className="w-4 h-4" />
             <span>Not available</span>
          </div>
      );
  }

  const renderRecentCredentials = () => {
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
            <p className="font-semibold">Error loading credentials</p>
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
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentCredentials.map((credential) => (
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
               <TableCell>
                  <Badge variant={credential.status?.toUpperCase() === 'ACTIVE' ? 'default' : 'destructive'}>
                    {credential.status || 'UNKNOWN'}
                  </Badge>
                </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View details</DropdownMenuItem>
                    <DropdownMenuItem>View Credential</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
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
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle>Verified Credentials</CardTitle>
                <CardDescription>
                    Number of credential verifications per month.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <LineChart data={monthlyVerifications} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                         <ChartLegend content={<ChartLegendContent />} />
                        <Line dataKey="verifications" stroke="var(--color-verifications)" strokeWidth={2} dot={false} />
                        <Line dataKey="failed" stroke="var(--color-failed)" strokeWidth={2} dot={false} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
          </Card>
          <Card>
           <CardHeader>
             <CardTitle>Issued Credentials</CardTitle>
             <CardDescription>
               Distribution of the last 100 credentials by type.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <ChartContainer config={{}} className="mx-auto aspect-square h-[240px]">
               <PieChart>
                 <ChartTooltip
                   cursor={false}
                   content={<ChartTooltipContent hideLabel />}
                 />
                 <Pie
                   data={credentialTypesData}
                   dataKey="value"
                   nameKey="name"
                   cx="50%"
                   cy="50%"
                   outerRadius={96}
                   labelLine={false}
                   label={false}
                 >
                   {credentialTypesData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
               </PieChart>
             </ChartContainer>
           </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    Showing distribution for the last {totalCredentialsInChart} credentials.
                </div>
                <div className="flex items-center gap-2 leading-none text-muted-foreground">
                    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                        {credentialTypesData.map((entry, index) => (
                            <li key={`legend-${index}`} className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span>{entry.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardFooter>
         </Card>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle>Recent Credentials</CardTitle>
            <CardDescription>
              Showing the 10 most recent credentials issued.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderRecentCredentials()}
          </CardContent>
          <CardFooter className="flex items-center justify-end">
              <Button asChild variant="outline" size="sm">
                  <Link href="/credentials">
                      View All
                      <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
          </CardFooter>
        </Card>

       <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            A log of the last 5 credential-related activities.
          </CardDescription>
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
              {recentEvents.map((log) => (
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
        <CardFooter className="flex items-center justify-end">
            <Button asChild variant="outline" size="sm">
                <Link href="/activity">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
