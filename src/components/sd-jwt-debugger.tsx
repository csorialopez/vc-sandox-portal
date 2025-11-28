"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileJson } from "lucide-react";
import { decodeSdJwt } from "@sd-jwt/decode";
import { digest } from "@sd-jwt/crypto-browser";

interface DecodedSdJwt {
    header: object;
    payload: object;
    disclosures: any[];
}


export function SdJwtDebugger() {
  const [encodedJwt, setEncodedJwt] = useState("");
  const [decodedJwt, setDecodedJwt] = useState<DecodedSdJwt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const { toast } = useToast();

  const handleDecode = async () => {
    if (!encodedJwt.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please paste an encoded SD-JWT to decode.",
      });
      return;
    }

    setIsDecoding(true);
    setError(null);
    setDecodedJwt(null);

    try {
      const decoded = await decodeSdJwt(encodedJwt.trim(), digest);

      setDecodedJwt({
        header: decoded.jwt.header,
        payload: decoded.jwt.payload,
        disclosures: decoded.disclosures,
      });
    } catch (err: any) {
      const message = err?.message || "Failed to decode SD-JWT. Please check the format.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Decoding Error",
        description: message,
      });
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="w-full container mx-auto p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          SD-JWT VC Debugger
        </h1>
        <p className="text-muted-foreground mt-2">
          Paste your encoded SD-JWT to decode and inspect its contents.
        </p>
      </header>
      <main className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Encoded SD-JWT</CardTitle>
            <CardDescription>
              Paste the full SD-JWT string (including disclosures) below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="h-40 font-code text-xs"
              value={encodedJwt}
              onChange={(e) => setEncodedJwt(e.target.value)}
              disabled={isDecoding}
            />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleDecode} disabled={isDecoding || !encodedJwt} size="lg">
            {isDecoding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="mr-2 h-4 w-4" />
            )}
            Decode
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted text-destructive p-4 rounded-md font-code break-all">
                {error}
              </pre>
            </CardContent>
          </Card>
        )}

        {decodedJwt && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Decoded Header</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-md font-code break-all">
                  {JSON.stringify(decodedJwt.header, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decoded Payload</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-md font-code break-all">
                  {JSON.stringify(decodedJwt.payload, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disclosures ({decodedJwt.disclosures.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {decodedJwt.disclosures.map((disc, index) => (
                  <div key={index} className="border p-4 rounded-md">
                     <h4 className="font-semibold mb-2">Disclosure #{index + 1}</h4>
                     <pre className="text-sm bg-muted p-4 rounded-md font-code break-all">
                        {JSON.stringify(disc, null, 2)}
                    </pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
