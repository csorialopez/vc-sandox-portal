
"use client";

import { TrustSourcesSection } from "./trust-sources-section";
import { RootsOfTrustSection } from "./roots-of-trust-section";

export function TrustRoots() {
	return (
		<div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Trust Roots</h2>
			</div>
			<TrustSourcesSection />
			<RootsOfTrustSection />
		</div>
	);
}
