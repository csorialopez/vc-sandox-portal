"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileJson } from "lucide-react";

interface DecodedMdoc {
  rawStructure: any;
  attributes: Record<string, unknown>;
}

// Helper function to convert base64url to bytes
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

// Minimal CBOR decoder (definite lengths) for parsing mdoc/DeviceResponse
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

// Helper to convert Uint8Array and other binary types to JSON-serializable format
function makeSerializable(obj: any): any {
  if (obj instanceof Uint8Array) {
    return {
      __type: "Uint8Array",
      base64: btoa(String.fromCharCode.apply(null, Array.from(obj))),
      length: obj.length,
    };
  }
  if (Array.isArray(obj)) {
    return obj.map(makeSerializable);
  }
  if (obj && typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = makeSerializable(value);
    }
    return result;
  }
  return obj;
}

export function MdocDebugger() {
  const [encodedMdoc, setEncodedMdoc] = useState("");
  const [decodedMdoc, setDecodedMdoc] = useState<DecodedMdoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const { toast } = useToast();

  const handleDecode = async () => {
    if (!encodedMdoc.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please paste an encoded mDOC/mDL credential (base64url) to decode.",
      });
      return;
    }

    setIsDecoding(true);
    setError(null);
    setDecodedMdoc(null);

    try {
      // Convert base64url to bytes
      const bytes = base64UrlToBytes(encodedMdoc.trim());
      if (!bytes) {
        throw new Error("Failed to decode base64url string");
      }

      // Decode CBOR structure
      const rawStructure = decodeMdocDeviceResponse(bytes);
      if (!rawStructure) {
        throw new Error("Failed to decode mDOC structure. Please check the format.");
      }

      // Extract attributes
      const attributes = extractAttributesFromMdoc(rawStructure) || {};

      setDecodedMdoc({
        rawStructure: makeSerializable(rawStructure),
        attributes,
      });
    } catch (err: any) {
      const message = err?.message || "Failed to decode mDOC/mDL credential. Please check the format.";
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
          mDOC and mDL Credentials Debugger
        </h1>
        <p className="text-muted-foreground mt-2">
          Paste your encoded mDOC/mDL credential (base64url CBOR) to decode and inspect its contents.
        </p>
      </header>
      <main className="w-full max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Encoded mDOC/mDL</CardTitle>
            <CardDescription>
              Paste the base64url-encoded CBOR structure below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste base64url-encoded CBOR here..."
              className="h-40 font-code text-xs"
              value={encodedMdoc}
              onChange={(e) => setEncodedMdoc(e.target.value)}
              disabled={isDecoding}
            />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button onClick={handleDecode} disabled={isDecoding || !encodedMdoc} size="lg">
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

        {decodedMdoc && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Attributes</CardTitle>
                <CardDescription>
                  {Object.keys(decodedMdoc.attributes).length} attribute(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-md font-code break-all overflow-x-auto">
                  {JSON.stringify(decodedMdoc.attributes, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raw CBOR Structure</CardTitle>
                <CardDescription>
                  Complete decoded CBOR structure (Uint8Array values shown as base64)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-muted p-4 rounded-md font-code break-all overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(decodedMdoc.rawStructure, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
