
"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { credentialsData, type SupportedFormat } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FilePlus, ExternalLink } from "lucide-react";
import { IssuanceRequestDialog } from "./issuance-request-dialog";

type AuthorizationFlow = "identity-provider" | "pre-authorized";

export function CredentialIssuer() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<SupportedFormat>("mso_mdoc");
  const [authFlow, setAuthFlow] = useState<AuthorizationFlow>("identity-provider");
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [credentialOfferUri, setCredentialOfferUri] = useState<string | null>(null);


  const selectedCredential = useMemo(
    () => credentialsData.find((c) => c.id === selectedCredentialId),
    [selectedCredentialId]
  );
  
  useEffect(() => {
    if (selectedCredential) {
      if (!selectedCredential.supportedFormats.includes(selectedFormat)) {
        setSelectedFormat(selectedCredential.supportedFormats[0]);
      }
       if (selectedCredential.id === 'urn:org.caricom.csme:skills:1' && authFlow === 'identity-provider') {
        setAuthFlow('pre-authorized');
      }
       if (selectedCredential.id === 'eu.europa.ec.eudi.pid.1' && selectedFormat === 'dc+sd-jwt' && authFlow === 'identity-provider') {
        setAuthFlow('pre-authorized');
       }
    }
  }, [selectedCredential, selectedFormat, authFlow]);

  const handleSubmit = async () => {
    if (!selectedCredentialId || !selectedCredential) {
      toast({
        title: "Incomplete Selection",
        description: "Please select a credential type to issue.",
        variant: "destructive",
      });
      return;
    }
    
    if (authFlow === "pre-authorized") {
      if (selectedCredential.id === "org.iso.18013.5.1.mDL") {
        router.push("/credential-issuance/mdl-pre-authorized");
        return;
      }
      if (selectedCredential.id === "eu.europa.ec.eudi.pid.1" && selectedFormat === 'mso_mdoc') {
        router.push("/credential-issuance/pid-pre-authorized");
        return;
      }
      if (selectedCredential.id === "eu.europa.ec.eudi.pid.1" && selectedFormat === 'dc+sd-jwt') {
        router.push("/credential-issuance/pid-sd-jwt-pre-authorized");
        return;
      }
      if (selectedCredential.id === 'urn:org.caricom.csme:skills:1' && selectedFormat === 'dc+sd-jwt') {
        router.push('/credential-issuance/skills-pre-authorized');
        return;
      }
    }

    startTransition(async () => {
       if (authFlow === "identity-provider" && 
           ((selectedCredential.id === "eu.europa.ec.eudi.pid.1" && selectedFormat === "mso_mdoc") ||
            (selectedCredential.id === "org.iso.18013.5.1.mDL" && selectedFormat === 'mso_mdoc'))) {
        
        let credentialType = "";
        if (selectedCredential.id === "eu.europa.ec.eudi.pid.1") {
            credentialType = "eu.europa.ec.eudi.pid_mdoc";
        } else if (selectedCredential.id === "org.iso.18013.5.1.mDL") {
            credentialType = "eu.europa.ec.eudi.mdl_mdoc";
        }

        const requestBody = new URLSearchParams({
            "credential_offer_URI": "openid-credential-offer://",
            "Authorization Code Grant": "authorization_code",
            "credential_a": credentialType,
            "proceed": "true"
        });

        try {
            const response = await fetch(`/api/issuer/credential_offer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: requestBody.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create credential offer: ${response.status} ${errorText}`);
            }

            const htmlResponse = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlResponse, 'text/html');
            const imgTag = doc.querySelector('img[src^="data:image/png;base64,"]');
            const qrCodeData = imgTag ? imgTag.getAttribute('src') : null;

            const offerLink = doc.querySelector('a[href^="openid-credential-offer://"]');
            const offerUri = offerLink ? offerLink.getAttribute('href') : null;

            if (qrCodeData && offerUri) {
                setQrCodeValue(qrCodeData);
                setCredentialOfferUri(offerUri);
                setIsQrDialogOpen(true);
                 toast({
                    title: "Issuance Offer Created",
                    description: `Scan the QR code to accept the credential offer.`,
                });
            } else {
                throw new Error("Could not find QR code or offer URI in the response.");
            }

        } catch (error: any) {
            toast({
                title: "Issuance Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive",
            });
        }
       } else {
         // Simulate issuance for other credential types
         await new Promise(resolve => setTimeout(resolve, 1500));

         toast({
           title: "Issuance Initiated",
           description: `Issuance process started for ${selectedCredential.name}.`,
         });
       }
    });
  };
  
  const handleDialogClose = (open: boolean) => {
    setIsQrDialogOpen(open);
    if (!open) {
        setQrCodeValue(null);
        setCredentialOfferUri(null);
    }
  };

  const isMsoMdocSupported = selectedCredential?.supportedFormats.includes("mso_mdoc") ?? false;
  const isDcPlusSdJwtSupported = selectedCredential?.supportedFormats.includes("dc+sd-jwt") ?? false;

  const isIdProviderDisabled =
    isPending ||
    selectedCredential?.id === "urn:org.caricom.csme:skills:1" ||
    (selectedCredential?.id === "eu.europa.ec.eudi.pid.1" &&
      selectedFormat === "dc+sd-jwt");


  return (
    <>
    <div className="w-full container mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="flex items-center gap-3 mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Credential Issuance
          </h1>
      </header>
      <main className="w-full max-w-3xl">
          <Card className="overflow-hidden shadow-lg">
              <CardHeader className="bg-card">
              <CardTitle>Issue a New Credential</CardTitle>
              <CardDescription>
                  Select a credential type and policy to begin the issuance process.
              </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                  <Label htmlFor="credential-select" className="text-base font-semibold">
                  1. Select Credential Type
                  </Label>
                  <Select
                  value={selectedCredentialId}
                  onValueChange={setSelectedCredentialId}
                  disabled={isPending}
                  >
                  <SelectTrigger id="credential-select" className="w-full">
                      <SelectValue placeholder="Choose a credential to issue..." />
                  </SelectTrigger>
                  <SelectContent>
                      {credentialsData.map((credential) => (
                      <SelectItem key={credential.id} value={credential.id}>
                          <div className="flex items-center gap-2">
                          <credential.icon className="w-4 h-4 text-muted-foreground" />
                          <span>{credential.name}</span>
                          </div>
                      </SelectItem>
                      ))}
                  </SelectContent>
                  </Select>
              </div>

              {selectedCredential && (
                  <>
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">2. Select Policy</Label>
                        <RadioGroup
                        value={selectedFormat}
                        onValueChange={(value: SupportedFormat) =>
                            setSelectedFormat(value)
                        }
                        className="flex gap-4"
                        >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mso_mdoc" id="mso_mdoc" disabled={!isMsoMdocSupported || isPending} />
                            <Label htmlFor="mso_mdoc" className={`font-mono text-sm ${!isMsoMdocSupported ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>credentialType-mso_mdoc</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dc+sd-jwt" id="dc+sd-jwt" disabled={!isDcPlusSdJwtSupported || isPending}/>
                            <Label htmlFor="dc+sd-jwt" className={`font-mono text-sm ${!isDcPlusSdJwtSupported ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>credentialType-dc+sdjwt</Label>
                        </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">3. Select Authorization Flow</Label>
                        <RadioGroup
                        value={authFlow}
                        onValueChange={(value: AuthorizationFlow) =>
                            setAuthFlow(value)
                        }
                        className="flex gap-4"
                        >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="identity-provider" id="identity-provider" disabled={isIdProviderDisabled} />
                            <Label htmlFor="identity-provider" className={`${isIdProviderDisabled ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>Identity Provider</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pre-authorized" id="pre-authorized" disabled={isPending}/>
                            <Label htmlFor="pre-authorized" className={`${isPending ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>Pre Authorized Flow</Label>
                        </div>
                        </RadioGroup>
                    </div>
                  </>
              )}
              </CardContent>
              <CardFooter className="flex justify-end p-6 bg-muted/50">
              <Button
                  onClick={handleSubmit}
                  disabled={isPending || !selectedCredentialId}
                  size="lg"
              >
                  {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                  <FilePlus className="mr-2 h-4 w-4" />
                  )}
                  Issue Credential
              </Button>
              </CardFooter>
          </Card>
      </main>
    </div>
     {qrCodeValue && credentialOfferUri && (
        <IssuanceRequestDialog
          open={isQrDialogOpen}
          onOpenChange={handleDialogClose}
          qrCodeValue={qrCodeValue}
          credentialOfferUri={credentialOfferUri}
        />
      )}
    </>
  );
}
