
"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { credentialsData, type SupportedFormat } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Share2, CheckCircle, AlertTriangle } from "lucide-react";
import { PresentationRequestDialog } from "./presentation-request-dialog";

type VerificationStatus = 'idle' | 'pending' | 'success' | 'error';

type DecodedCredential = {
  format: SupportedFormat;
  claims: Record<string, unknown>;
  vct?: string | null;
};

// ---- Helpers to decode vp_token (mdoc / dc+sd-jwt) ----
// These are adapted from the government1 eudi-wallet-backend.js implementation.

function isJwt(token: unknown): token is string {
  return (
    typeof token === "string" &&
    /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(token)
  );
}

function base64UrlDecode(input: string): string {
  try {
    let str = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = str.length % 4;
    if (pad) str += "=".repeat(4 - pad);
    const decoded = atob(str);
    try {
      // handle UTF-8
      return decodeURIComponent(
        decoded
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      );
    } catch {
      return decoded;
    }
  } catch (e) {
    console.warn("base64UrlDecode failed:", e);
    return "";
  }
}

function base64UrlToBytes(input: string): Uint8Array | null {
  try {
    let str = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = str.length % 4;
    if (pad) str += "=".repeat(4 - pad);
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function parseJwt(token: string): { header: any; payload: any } {
  const [headerB64, payloadB64] = token.split(".").slice(0, 2);
  const header = JSON.parse(base64UrlDecode(headerB64));
  const payload = JSON.parse(base64UrlDecode(payloadB64));
  return { header, payload };
}

// --- Minimal CBOR decoder (definite lengths) for parsing mdoc/DeviceResponse ---
function cborDecode(data: Uint8Array | DataView): any {
  const dv =
    data instanceof DataView
      ? data
      : new DataView(
          (data as Uint8Array).buffer,
          (data as Uint8Array).byteOffset || 0,
          (data as Uint8Array).byteLength || (data as Uint8Array).length || 0
        );
  let offset = 0;

  function read(n: number): Uint8Array {
    const start = offset;
    offset += n;
    return new Uint8Array(dv.buffer, dv.byteOffset + start, n);
  }

  function readUint(ai: number): number {
    if (ai < 24) return ai;
    if (ai === 24) return dv.getUint8(offset++);
    if (ai === 25) {
      const v = dv.getUint16(offset);
      offset += 2;
      return v;
    }
    if (ai === 26) {
      const v = dv.getUint32(offset);
      offset += 4;
      return v;
    }
    if (ai === 27) {
      const high = dv.getUint32(offset);
      const low = dv.getUint32(offset + 4);
      offset += 8;
      return high * 4294967296 + low;
    }
    throw new Error("Unsupported additional info for uint: " + ai);
  }

  function decodeItem(): any {
    const ib = dv.getUint8(offset++);
    const mt = ib >> 5; // major type
    const ai = ib & 31; // additional info
    switch (mt) {
      case 0:
        return readUint(ai);
      case 1:
        return -1 - readUint(ai);
      case 2: {
        const len = readUint(ai);
        return read(len);
      }
      case 3: {
        const len = readUint(ai);
        const bytes = read(len);
        try {
          return new TextDecoder("utf-8").decode(bytes);
        } catch {
          return String.fromCharCode.apply(null, Array.from(bytes));
        }
      }
      case 4: {
        const len = readUint(ai);
        const arr = [] as any[];
        for (let i = 0; i < len; i++) arr.push(decodeItem());
        return arr;
      }
      case 5: {
        const len = readUint(ai);
        const obj: Record<string, any> = {};
        for (let i = 0; i < len; i++) {
          const k = decodeItem();
          const v = decodeItem();
          obj[k] = v;
        }
        return obj;
      }
      case 6: {
        // tag - ignore and return tagged content
        readUint(ai);
        return decodeItem();
      }
      case 7: {
        if (ai === 20) return false;
        if (ai === 21) return true;
        if (ai === 22) return null;
        if (ai === 23) return undefined;
        if (ai === 25) {
          // half float
          const ui = dv.getUint16(offset);
          offset += 2;
          const exp = (ui & 0x7c00) >> 10;
          const frac = ui & 0x03ff;
          const sign = ui & 0x8000 ? -1 : 1;
          if (exp === 0) return sign * Math.pow(2, -14) * (frac / 1024);
          if (exp === 31) return frac ? NaN : sign * Infinity;
          return sign * Math.pow(2, exp - 15) * (1 + frac / 1024);
        }
        if (ai === 26) {
          const v = dv.getFloat32(offset);
          offset += 4;
          return v;
        }
        if (ai === 27) {
          const v = dv.getFloat64(offset);
          offset += 8;
          return v;
        }
        throw new Error("Unsupported simple/float AI: " + ai);
      }
      default:
        throw new Error("Unknown major type: " + mt);
    }
  }

  const result = decodeItem();
  return result;
}

function decodeMdocDeviceResponse(bytes: Uint8Array): any | null {
  try {
    const root = cborDecode(bytes);
    // COSE_Sign1 structure: [ protected, unprotected, payload(bstr), signature ]
    if (Array.isArray(root) && root.length === 4 && root[2] instanceof Uint8Array) {
      try {
        return cborDecode(root[2] as Uint8Array);
      } catch {
        // fallthrough
      }
    }
    return root;
  } catch (e) {
    console.warn("CBOR decode failed for mdoc:", e);
    return null;
  }
}

function extractAttributesFromMdoc(obj: any): Record<string, unknown> | null {
  const acc: Record<string, unknown> = {};

  function toPrintable(v: any): any {
    if (v instanceof Uint8Array) {
      try {
        const s = new TextDecoder("utf-8", { fatal: false }).decode(v);
        if (/\uFFFD/.test(s))
          return "base64:" + btoa(String.fromCharCode.apply(null, Array.from(v)));
        return s;
      } catch {
        return "base64:" + btoa(String.fromCharCode.apply(null, Array.from(v)));
      }
    }
    if (Array.isArray(v)) return v.map((x) => toPrintable(x));
    if (v && typeof v === "object") {
      if ("elementValue" in v) return toPrintable((v as any).elementValue);
      if ("value" in v) return toPrintable((v as any).value);
    }
    return v;
  }

  function harvestFromNameSpaces(nsObj: any) {
    if (!nsObj || typeof nsObj !== "object") return;
    for (const [_, entries] of Object.entries(nsObj)) {
      if (Array.isArray(entries)) {
        // Array of elements - may be IssuerSignedItem CBOR-encoded as Uint8Array
        for (let item of entries as any[]) {
          if (item instanceof Uint8Array) {
            try {
              item = cborDecode(item);
            } catch {
              continue;
            }
          }
          if (!item || typeof item !== "object") continue;
          const k = (item as any).elementIdentifier || (item as any).identifier || (item as any).name;
          let v =
            (item as any).elementValue !== undefined
              ? (item as any).elementValue
              : (item as any).value !== undefined
              ? (item as any).value
              : item;
          if (k) acc[k] = toPrintable(v);
        }
      } else if (entries && typeof entries === "object") {
        // Map of attributeName -> { value | elementValue | ... }
        for (const [k, v] of Object.entries(entries)) {
          if (v && typeof v === "object") {
            const val =
              (v as any).elementValue !== undefined
                ? (v as any).elementValue
                : (v as any).value !== undefined
                ? (v as any).value
                : v;
            acc[k] = toPrintable(val);
          } else {
            acc[k] = toPrintable(v);
          }
        }
      }
    }
  }

  function collectAndHarvest(node: any): void {
    if (!node) return;
    if (Array.isArray(node)) {
      // COSE_Sign1 structure: [ protected, unprotected, payload(bstr), signature ]
      if (node.length === 4 && node[2] instanceof Uint8Array) {
        try {
          const inner = cborDecode(node[2] as Uint8Array);
          collectAndHarvest(inner);
        } catch {
          // ignore
        }
      }
      for (const it of node) collectAndHarvest(it);
      return;
    }
    if (typeof node === "object") {
      if ((node as any).nameSpaces && typeof (node as any).nameSpaces === "object") {
        harvestFromNameSpaces((node as any).nameSpaces);
      }
      for (const v of Object.values(node)) collectAndHarvest(v);
    }
  }

  if (obj && typeof obj === "object") {
    const docs = Array.isArray(obj)
      ? obj
      : (obj as any).documents || (obj as any).mdocDocuments || null;
    if (Array.isArray(docs)) {
      for (const d of docs) {
        if (d && typeof d === "object") {
          if ((d as any).issuerSigned) collectAndHarvest((d as any).issuerSigned);
          if ((d as any).deviceSigned) collectAndHarvest((d as any).deviceSigned);
        }
      }
    } else {
      collectAndHarvest(obj);
    }
  }

  if (Object.keys(acc).length) return acc;

  function flattenNamespaceMaps(node: any) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    for (const [ns, values] of Object.entries(node)) {
      const looksNs = typeof ns === "string" && (ns.includes(".") || ns.includes(":"));
      if (
        looksNs &&
        values &&
        typeof values === "object" &&
        !Array.isArray(values)
      ) {
        for (const [k, v] of Object.entries(values)) {
          acc[k] = toPrintable(v);
        }
      }
    }
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") flattenNamespaceMaps(v);
    }
  }

  flattenNamespaceMaps(obj);
  if (Object.keys(acc).length) return acc;

  function visit(node: any): void {
    if (!node) return;
    if (Array.isArray(node)) {
      if (node.length === 4 && node[2] instanceof Uint8Array) {
        try {
          visit(cborDecode(node[2] as Uint8Array));
        } catch {
          // ignore
        }
      }
      for (const item of node) visit(item);
      return;
    }
    if (typeof node === "object") {
      if (
        Object.prototype.hasOwnProperty.call(node, "elementIdentifier") &&
        Object.prototype.hasOwnProperty.call(node, "elementValue")
      ) {
        const k = (node as any).elementIdentifier;
        const v = toPrintable((node as any).elementValue);
        if (k) acc[k] = v;
      }
      if ((node as any).nameSpaces && typeof (node as any).nameSpaces === "object") {
        harvestFromNameSpaces((node as any).nameSpaces);
      }
      for (const v of Object.values(node)) visit(v);
    }
  }

  visit(obj);
  return acc;
}

function base64UrlJson(input: string): any {
  try {
    return JSON.parse(base64UrlDecode(input));
  } catch {
    return null;
  }
}

// Decode claims from a dc/sd-jwt vp_token by merging disclosures ("~" parts that are not JWTs)
function decodeSdJwtClaimsFromVpToken(vpToken: any): {
  claims: Record<string, unknown>;
  vct: string | null;
  sdJwtPayload: any;
  kbJwtPayload: any;
} {
  const claims: Record<string, unknown> = {};
  let vct: string | null = null;
  let sdJwtPayload: any = null;
  let kbJwtPayload: any = null;

  const handleString = (s: string) => {
    if (typeof s !== "string") return;
    const parts = s.split("~");
    for (const part of parts) {
      if (isJwt(part)) {
        try {
          const { payload } = parseJwt(part);
          if (!sdJwtPayload) sdJwtPayload = payload;
          else kbJwtPayload = payload;
          if (payload && payload.vct) vct = payload.vct;
          if (
            payload &&
            payload.vc &&
            payload.vc.credentialSubject &&
            typeof payload.vc.credentialSubject === "object"
          ) {
            Object.assign(claims, payload.vc.credentialSubject);
          }
        } catch {
          // ignore
        }
      } else {
        const arr = base64UrlJson(part);
        if (Array.isArray(arr)) {
          if (arr.length >= 3 && typeof arr[1] === "string") {
            claims[arr[1]] = arr[2];
          } else if (
            arr.length >= 2 &&
            arr[1] &&
            typeof arr[1] === "object" &&
            !Array.isArray(arr[1])
          ) {
            Object.assign(claims, arr[1]);
          } else if (arr.length === 1 && arr[0] && typeof arr[0] === "object") {
            Object.assign(claims, arr[0]);
          }
        } else if (arr && typeof arr === "object") {
          Object.assign(claims, arr);
        }
      }
    }
  };

  const handleObject = (o: any) => {
    if (!o || typeof o !== "object") return;
    if (typeof o.combined === "string") return handleString(o.combined);
    const parts: string[] = [];
    if (typeof o.sd_jwt === "string") parts.push(o.sd_jwt);
    if (Array.isArray(o.disclosures)) parts.push(...o.disclosures);
    if (typeof o.kb_jwt === "string") parts.push(o.kb_jwt);
    if (!parts.length) return;
    handleString(parts.join("~"));
  };

  if (Array.isArray(vpToken)) {
    for (const item of vpToken) {
      if (typeof item === "string") handleString(item);
      else handleObject(item);
    }
  } else if (typeof vpToken === "string") {
    handleString(vpToken);
  } else {
    handleObject(vpToken);
  }

  return { claims, vct, sdJwtPayload, kbJwtPayload };
}

function extractClaimsFromVpToken(vpToken: any): DecodedCredential | null {
  if (!vpToken) return null;

  // Try SD-JWT first
  try {
    const sd = decodeSdJwtClaimsFromVpToken(vpToken);
    if (sd && sd.claims && Object.keys(sd.claims).length) {
      return { format: "dc+sd-jwt", vct: sd.vct, claims: sd.claims };
    }
  } catch (e) {
    console.warn("Failed to decode sd-jwt vp_token:", e);
  }

  // Fallback to mdoc
  try {
    const arr = Array.isArray(vpToken) ? vpToken : [vpToken];
    for (const item of arr) {
      if (typeof item !== "string") continue;
      const bytes = base64UrlToBytes(item);
      if (!bytes || !bytes.length) continue;
      const mdocPayload = decodeMdocDeviceResponse(bytes);
      if (mdocPayload) {
        const attrs = extractAttributesFromMdoc(mdocPayload);
        if (attrs && Object.keys(attrs).length) {
          return { format: "mso_mdoc", claims: attrs };
        }
      }
    }
  } catch (e) {
    console.warn("Failed to decode mdoc vp_token:", e);
  }

  return null;
}

export function CredentialVerifier() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<SupportedFormat>("mso_mdoc");
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verifiedClaims, setVerifiedClaims] = useState<Record<string, unknown> | null>(null);
  const [verifiedFormat, setVerifiedFormat] = useState<SupportedFormat | null>(null);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const selectedCredential = useMemo(
    () => credentialsData.find((c) => c.id === selectedCredentialId),
    [selectedCredentialId]
  );
  
  useEffect(() => {
    setVerificationStatus('idle');
    setVerifiedClaims(null);
    setVerifiedFormat(null);
    if (selectedCredential) {
      if (!selectedCredential.supportedFormats.includes(selectedFormat)) {
        setSelectedFormat(selectedCredential.supportedFormats[0]);
      }
      setSelectedAttributes(selectedCredential.attributes.map((attr) => attr.id));
    } else {
      setSelectedAttributes([]);
    }
  }, [selectedCredential, selectedFormat]);

  const handleAttributeChange = (attributeId: string, checked: boolean) => {
    setSelectedAttributes((prev) =>
      checked ? [...prev, attributeId] : prev.filter((id) => id !== attributeId)
    );
  };
  
  const pollPresentationStatus = async (txId: string) => {
    try {
        const response = await fetch(`https://verifier-backend.interfase.uy/ui/presentations/${txId}`);

        if (response.ok) {
            const status = await response.json();

            // Try to decode vp_token (mdoc or dc+sd-jwt) and store claims for UI rendering
            try {
              if (status && status.vp_token) {
                const decoded = extractClaimsFromVpToken(status.vp_token);
                if (decoded && decoded.claims && Object.keys(decoded.claims).length) {
                  setVerifiedClaims(decoded.claims);
                  setVerifiedFormat(decoded.format);
                }
              }
            } catch (e) {
              console.warn('Failed to process vp_token:', e);
            }

            if (status && status.presentation_submission) {
                setVerificationStatus('success');
                setIsQrDialogOpen(false);
                toast({
                    title: "Verification Complete",
                    description: "Credential verified successfully!",
                    className: "bg-green-600 text-white"
                });
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            } else if (status && status.error) {
                setVerificationStatus('error');
                setIsQrDialogOpen(false);
                toast({
                    variant: "destructive",
                    title: "Verification Failed",
                    description: status.error,
                });
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            }
        }
    } catch (err) {
        console.error("Polling error:", err);
    }
  };
  
  useEffect(() => {
      if (transactionId && verificationStatus === 'pending') {
          pollIntervalRef.current = setInterval(() => {
              pollPresentationStatus(transactionId);
          }, 3000);

          const timeout = setTimeout(() => {
              if (pollIntervalRef.current && verificationStatus === 'pending') {
                  clearInterval(pollIntervalRef.current);
                  setVerificationStatus('error');
                  setIsQrDialogOpen(false);
                  toast({
                      variant: "destructive",
                      title: "Verification Timed Out",
                      description: "No response from the wallet in time.",
                  });
              }
          }, 90000); 

          return () => {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              clearTimeout(timeout);
          };
      }
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
  }, [transactionId, verificationStatus]);


  const handleSubmit = async () => {
    if (!selectedCredentialId || !selectedCredential) {
      toast({
        title: "Incomplete Selection",
        description: "Please select a credential.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedAttributes.length === 0) {
      toast({
        title: "No Attributes Selected",
        description: "Please select at least one attribute to share.",
        variant: "destructive",
      });
      return;
    }

    setVerificationStatus('idle'); 
    setVerifiedClaims(null);
    setVerifiedFormat(null);

    startTransition(async () => {
      
      let requestBody: any;

      if (selectedCredential.id === 'org.iso.18013.5.1.mDL' && selectedFormat === 'mso_mdoc') {
          requestBody = {
              type: "vp_token",
              dcql_query: {
                  credentials: [
                      {
                          id: "query_0",
                          format: "mso_mdoc",
                          meta: {
                              "doctype_value": "org.iso.18013.5.1.mDL"
                          },
                          claims: selectedAttributes.map(attrId => ({
                            path: ["org.iso.18013.5.1", attrId],
                            intent_to_retain: false,
                          }))
                      }
                  ]
              },
              nonce: crypto.randomUUID(),
              request_uri_method: "get"
          };
      } else {
        let presentationDefinition;

        if (selectedFormat === 'dc+sd-jwt' && (selectedCredential.id === 'eu.europa.ec.eudi.pid.1' || selectedCredential.id === 'urn:org.caricom.csme:skills:1')) {
          const fields = selectedAttributes.map(attrId => {
            const attribute = selectedCredential.attributes.find(a => a.id === attrId);
            return { path: [`$.${attribute?.sdJwtPath || attrId}`], intent_to_retain: false };
          });

          if (selectedCredential.id === 'eu.europa.ec.eudi.pid.1') {
            fields.unshift({
              path: ["$.vct"],
              filter: {
                type: "string",
                const: "urn:eudi:pid:1"
              }
            });
          } else if (selectedCredential.id === 'urn:org.caricom.csme:skills:1') {
            fields.unshift({
              path: ["$.vct"],
              filter: {
                type: "string",
                const: "urn:org.caricom.csme:skills:1"
              }
            });
          }

          presentationDefinition = {
            id: crypto.randomUUID(),
            input_descriptors: [{
              id: crypto.randomUUID(),
              name: selectedCredential.name,
              purpose: "",
              format: {
                "dc+sd-jwt": {
                  "sd-jwt_alg_values": ["ES256"],
                  "kb-jwt_alg_values": ["ES256"]
                }
              },
              constraints: {
                fields: fields
              }
            }]
          };

        } else {
          presentationDefinition = {
              id: crypto.randomUUID(),
              input_descriptors: [{
                  id: selectedCredential.id,
                  format: { [selectedFormat]: { alg: ["ES256"] } },
                  constraints: {
                      limit_disclosure: "required",
                      fields: selectedAttributes.map(attrId => {
                        const attribute = selectedCredential.attributes.find(a => a.id === attrId);
                        return {
                          path: [`$['${selectedCredential.id}']['${attribute?.id || attrId}']`],
                          intent_to_retain: false
                        };
                      })
                  }
              }]
          };
        }
        
        requestBody = {
          type: "vp_token",
          presentation_definition: presentationDefinition,
          nonce: crypto.randomUUID(),
          request_uri_method: "get"
        };
      }


      try {
        const response = await fetch("https://verifier-backend.interfase.uy/ui/presentations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Backend verification request failed: ${response.status} ${errorData}`);
        }

        const jsonResp = await response.json();
        const requestUri = jsonResp.request_uri;
        const txId = jsonResp.transaction_id;

        if (!requestUri || !txId) {
            throw new Error("Invalid response from backend.");
        }

        const clientId = 'x509_san_dns:verifier-backend.interfase.uy';
        const openid4vpUrl = `eudi-openid4vp://?client_id=${encodeURIComponent(clientId)}&request_uri=${requestUri}`;
        
        setQrCodeValue(openid4vpUrl);
        setTransactionId(txId);
        setIsQrDialogOpen(true);
        setVerificationStatus('pending');

        toast({
          title: "Presentation Request Created",
          description: "Scan the QR code with your wallet to proceed.",
        });

      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unknown error occurred.",
          variant: "destructive",
        });
        setQrCodeValue(null);
        setIsQrDialogOpen(false);
      }
    });
  };
  
  const selectedCredentialAttributes = useMemo(
    () =>
      selectedCredential?.attributes.filter((attr) =>
        selectedAttributes.includes(attr.id)
      ) || [],
    [selectedCredential, selectedAttributes]
  );
  
  const handleDialogClose = (open: boolean) => {
    setIsQrDialogOpen(open);
    if (!open) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Keep verificationStatus and verifiedClaims so the user can still see the
      // result and decoded values in the Review Summary after closing the dialog.
      setTransactionId(null);
      setQrCodeValue(null);
    }
  };

  const isMsoMdocSupported =
    (selectedCredential?.supportedFormats.includes("mso_mdoc") ?? false) &&
    selectedCredential?.id !== "university_diploma_1";

  const isSdJwtSupported =
    (selectedCredential?.supportedFormats.includes("dc+sd-jwt") ?? false) &&
    selectedCredential?.id !== "eu.europa.ec.eudi.pid.1" &&
    selectedCredential?.id !== "university_diploma_1";

  const getAttributeValue = (attributeId: string): string | undefined => {
    if (!verifiedClaims || !selectedCredential) return undefined;

    const attribute = selectedCredential.attributes.find((a) => a.id === attributeId);
    if (!attribute) return undefined;

    const candidateKeys: string[] = [];

    // For sd-jwt, prefer the explicit sdJwtPath when present
    if (verifiedFormat === "dc+sd-jwt" && attribute.sdJwtPath) {
      candidateKeys.push(attribute.sdJwtPath);
    }

    // Generic fallback: use the attribute id
    candidateKeys.push(attribute.id);

    // Handle PID "birthdate" vs "birth_date" naming differences
    if (
      selectedCredential.id === "eu.europa.ec.eudi.pid.1" &&
      attribute.id === "birthdate"
    ) {
      candidateKeys.push("birth_date");
    }

    for (const key of candidateKeys) {
      const raw = (verifiedClaims as any)[key];
      if (raw === undefined || raw === null) continue;
      if (Array.isArray(raw)) return raw.join(", ");
      if (typeof raw === "object") return JSON.stringify(raw);
      return String(raw);
    }

    return undefined;
  };

  return (
    <>
      <div className="w-full container mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
        <header className="flex items-center gap-3 mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Credential Verifier
            </h1>
        </header>
        <main className="w-full max-w-3xl">
            <Card className="overflow-hidden shadow-lg">
                <CardHeader className="bg-card">
                <CardTitle>Create a Verifiable Presentation</CardTitle>
                <CardDescription>
                    Select a credential and choose which attributes you want to share.
                </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
                    <Label htmlFor="credential-select" className="text-base font-semibold">
                    1. Select Credential
                    </Label>
                    <Select
                    value={selectedCredentialId}
                    onValueChange={(id) => {
                      setSelectedCredentialId(id);
                      setVerificationStatus("idle");
                    }}
                    disabled={isPending}
                    >
                    <SelectTrigger id="credential-select" className="w-full">
                        <SelectValue placeholder="Choose a credential to verify..." />
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
                            <RadioGroupItem value="dc+sd-jwt" id="dc+sd-jwt" disabled={!isSdJwtSupported || isPending}/>
                            <Label htmlFor="dc+sd-jwt" className={`font-mono text-sm ${!isSdJwtSupported ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer'}`}>credentialType-dc+sdjwt</Label>
                        </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">
                        3. Select Attributes to Share
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 border rounded-lg bg-background">
                        {selectedCredential.attributes.map((attribute) => (
                            <div key={attribute.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors">
                            <Checkbox
                                id={attribute.id}
                                checked={selectedAttributes.includes(attribute.id)}
                                onCheckedChange={(checked) =>
                                handleAttributeChange(attribute.id, checked as boolean)
                                }
                                className="mt-1"
                                disabled={isPending}
                                aria-label={`Select ${attribute.name}`}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                htmlFor={attribute.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                {attribute.name}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                {attribute.description}
                                </p>
                            </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {selectedAttributes.length > 0 && (
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">4. Review Summary</Label>
                            <div className="p-4 border rounded-lg bg-background space-y-2">
                                {verificationStatus === 'success' && (
                                        <div className="flex items-center gap-3 p-3 rounded-md bg-green-100 border border-green-300">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <p className="text-sm font-medium text-green-800">Verification successful!</p>
                                        </div>
                                )}
                                {verificationStatus === 'error' && (
                                        <div className="flex items-center gap-3 p-3 rounded-md bg-red-100 border border-red-300">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                            <p className="text-sm font-medium text-red-800">Verification failed or timed out.</p>
                                        </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Credential</span>
                                    <span className="font-medium text-sm">{selectedCredential.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Format</span>
                                    <span className="font-mono text-sm">{selectedFormat}</span>
                                </div>
                                <Separator className="my-2" />
                                <h4 className="font-medium text-sm">Attributes to be shared:</h4>
                                <ul className="list-none space-y-1 pt-1">
                                    {selectedCredentialAttributes.map(attr => {
                                        const value = getAttributeValue(attr.id);
                                        const hasValue = value !== undefined && value !== "";
                                        const isVerified = verificationStatus === 'success' && hasValue;

                                        const isImageField = attr.id === 'portrait' || attr.id === 'picture';
                                        let imageSrc: string | null = null;
                                        if (isImageField && typeof value === 'string' && value) {
                                          if (value.startsWith('data:image')) {
                                            imageSrc = value;
                                          } else if (value.startsWith('base64:')) {
                                            imageSrc = `data:image/jpeg;base64,${value.substring(7)}`;
                                          } else {
                                            imageSrc = `data:image/jpeg;base64,${value}`;
                                          }
                                        }

                                        return (
                                          <li key={attr.id} className="flex items-center gap-2 text-sm text-foreground">
                                              <CheckCircle
                                                className={
                                                  `w-4 h-4 ` +
                                                  (isVerified
                                                    ? 'text-green-600'
                                                    : verificationStatus === 'pending'
                                                    ? 'text-yellow-500'
                                                    : 'text-muted-foreground')
                                                }
                                              />
                                              <span className="flex items-center gap-2">
                                                <strong className="font-semibold">{attr.name}</strong>
                                                {imageSrc ? (
                                                  <img
                                                    src={imageSrc}
                                                    alt={attr.name}
                                                    className="w-10 h-10 rounded object-cover border"
                                                  />
                                                ) : (
                                                  hasValue && <span>: {value}</span>
                                                )}
                                                {!hasValue && !imageSrc && verificationStatus === 'pending' && (
                                                  <span className="ml-1 text-xs text-muted-foreground">
                                                    (waiting from wallet...)
                                                  </span>
                                                )}
                                              </span>
                                          </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    )}
                    </>
                )}
                </CardContent>
                <CardFooter className="flex justify-end p-6 bg-muted/50">
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || selectedAttributes.length === 0 || (!isMsoMdocSupported && !isSdJwtSupported)}
                    size="lg"
                >
                    {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Share2 className="mr-2 h-4 w-4" />
                    )}
                    Create & Share Presentation
                </Button>
                </CardFooter>
            </Card>
        </main>
      </div>

      {qrCodeValue && (
        <PresentationRequestDialog
          open={isQrDialogOpen}
          onOpenChange={handleDialogClose}
          qrCodeValue={qrCodeValue}
          status={verificationStatus}
        />
      )}
    </>
  );
}

    

    

    