
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
import { Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, MoreHorizontal } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface TrustSourcesItem {
	id: number;
	trustSource: string;
	issuer: string;
	credentialDocType: string;
	active: "Yes" | "No";
}

const PAGE_SIZE = 20;

const TRUST_SOURCES_DATA: TrustSourcesItem[] = [
	{
		id: 1,
		trustSource: "Default",
		issuer: "All",
		credentialDocType: "All",
		active: "Yes",
	},
	{
		id: 2,
		trustSource: "Default trusted list",
		issuer: "-",
		credentialDocType: "-",
		active: "No",
	},
	{
		id: 3,
		trustSource: "Keystore",
		issuer: "-",
		credentialDocType: "-",
		active: "No",
	},
];

export function TrustSources() {
	const [data, setData] = useState<TrustSourcesItem[]>([]);
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
				// Simulate fetch from hardcoded data
				const startIdx = (currentPage - 1) * PAGE_SIZE;
				const endIdx = startIdx + PAGE_SIZE;
				const paginatedData = TRUST_SOURCES_DATA.slice(startIdx, endIdx);

				setData(paginatedData);
				setTotalElements(TRUST_SOURCES_DATA.length);
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
		(item) =>
			item.id.toString().includes(searchTerm.toLowerCase()) ||
			item.trustSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.issuer.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.credentialDocType.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.active.toLowerCase().includes(searchTerm.toLowerCase())
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
						<TableHead>Trust Source</TableHead>
						<TableHead>Issuer</TableHead>
						<TableHead>Credential DocType</TableHead>
						<TableHead>Active</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredCredentials.map((item) => (
						<TableRow key={item.id}>
							<TableCell>{item.trustSource}</TableCell>
							<TableCell>{item.issuer}</TableCell>
							<TableCell>{item.credentialDocType}</TableCell>
							<TableCell>{item.active}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Trust Sources</h2>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Trust Sources Configuration</CardTitle>
					<CardDescription>
						A list of all trust sources and their configuration.
					</CardDescription>
					<div className="relative pt-2">
						<Search className="absolute left-2.5 top-4.5 h-10 w-4 text-muted-foreground" />
						<Input
							placeholder="Search by trust source, issuer, or status..."
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
