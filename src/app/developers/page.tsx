

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, FileJson, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function DevelopersPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Developers
      </h1>
      
      <div className="space-y-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>How to issue credentials</CardTitle>
            <CardDescription>
              Guides and resources for issuing verifiable credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <Badge variant="outline">Work in Progress</Badge>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>How to verify credentials</CardTitle>
            <CardDescription>
              Learn how to request and verify presentations from users.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <Button asChild variant="outline" size="sm">
              <Link href="/prod/js/pid-verifier-embed.js" download>
                <Download className="mr-2 h-4 w-4" />
                Download PID verifier embed.js
              </Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  How to embed in your web app
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>How to use the PID verifier embed script</DialogTitle>
                  <DialogDescription>
                    Follow these steps to add a "Verify my identity" flow to any third-party web app.
                    <span className="mt-1 block text-xs text-muted-foreground">
                      The download provides the JavaScript file used in production; include it directly from your HTML (for example, <code>prod/js/pid-verifier-embed.js</code>).
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-1">How to use (minimal)</h3>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>
                        Add a <span className="font-mono">Verify</span> button anywhere:
                        <pre className="mt-2 rounded-md bg-muted p-3 text-xs overflow-x-auto">
                          <code>{`<button data-verify-pid>Verify my identity</button>`}</code>
                        </pre>
                      </li>
                      <li>
                        Include the script (auto-inits by default):
                        <pre className="mt-2 rounded-md bg-muted p-3 text-xs overflow-x-auto">
                          <code>{`<script src="prod/js/pid-verifier-embed.js" data-auto-init="true"></script>`}</code>
                        </pre>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Clicking any element with <span className="font-mono">data-verify-pid</span> (or an element with <span className="font-mono">id="verifyPIDOnly"</span>) opens the modal and shows the QR.
                        </p>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-1">Optional configuration</h3>
                    <p className="text-xs text-muted-foreground mb-2">Initialize with options and callbacks:</p>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                      <code>{`<script>
  PIDVerifier.init({
    // Backend base URL (defaults shown)
    backendBaseUrl: 'https://verifier-backend.interfase.uy/ui',
    // 'mso_mdoc' (default) or 'dc+sd-jwt'
    format: 'mso_mdoc',
    // EUDI deep link params
    clientId: 'x509_san_dns:verifier-backend.interfase.uy',
    requestUriMethod: 'get',
    // UI wiring
    autoAttach: true,
    buttonSelector: '[data-verify-pid]',
    // Callbacks
    onSuccess: (status) => {
      // status.presentation_submission present -> verified
      // e.g., enable gated UI, navigate, etc.
      console.log('Verified', status);
    },
    onError: (err) => {
      console.error('Verification error', err);
    },
    onStateChange: (state) => {
      // 'starting' | 'qr_shown' | 'verified' | 'timeout' | 'error'
      console.log('State:', state);
    }
  });
</script>`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-1">Programmatic trigger (no button)</h3>
                    <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                      <code>{`<script>
  // After PIDVerifier.init(...)
  PIDVerifier.open();
</script>`}</code>
                    </pre>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>SD-JWT VC credentials Debugger</CardTitle>
            <CardDescription>
              Decode and inspect the contents of a SD-JWT verifiable credential.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/developers/sd-jwt-debugger">
                <FileJson className="mr-2 h-4 w-4" />
                Open Debugger
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>mDOC and mDL credentials Debugger</CardTitle>
            <CardDescription>
              Work in Progress
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <Badge variant="outline">Work in Progress</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
