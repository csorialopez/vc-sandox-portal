"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TestTube2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import { PreAuthorizedIssuanceDialog } from "./pre-authorized-issuance-dialog";

const formSchema = z.object({
  account_holder_owner: z.boolean().default(false),
  bank_account_status: z.string().min(1, "Bank account status is required"),
  business_identifier_code: z.string().min(1, "Business identifier code is required"),
  coowner: z.boolean().default(false),
  currency: z.string().min(1, "Currency is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  iban: z.string().min(1, "IBAN is required"),
  issuing_organization: z.string().min(1, "Issuing organization is required"),
  payment_possibility: z.boolean().default(false),
  registered_family_name: z.string().min(1, "Family name is required"),
  registered_given_name: z.string().min(1, "Given name is required"),
});

const testData = {
  account_holder_owner: true,
  bank_account_status: "active",
  business_identifier_code: "BDEXESMM",
  coowner: false,
  currency: "EUR",
  date_of_birth: "2000-12-12",
  iban: "ES7921000813610123456789",
  issuing_organization: "Banco de Prueba S.A.",
  payment_possibility: true,
  registered_family_name: "García",
  registered_given_name: "Lucía",
};

type FormValues = z.infer<typeof formSchema>;

export function EbankingPreAuthorizedForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [txCode, setTxCode] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_holder_owner: false,
      bank_account_status: "",
      business_identifier_code: "",
      coowner: false,
      currency: "",
      date_of_birth: "",
      iban: "",
      issuing_organization: "",
      payment_possibility: false,
      registered_family_name: "",
      registered_given_name: "",
    },
  });

  const fillWithTestData = () => {
    const firstNames = ["Carlos", "Maria", "Juan", "Sofia", "Luis", "Ana", "Jose", "Laura"];
    const lastNames = ["Perez", "Garcia", "Rodriguez", "Lopez", "Martinez", "Sanchez", "Gomez", "Fernandez"];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomIBAN = `ES${Math.floor(Math.random() * 99)
      .toString()
      .padStart(2, "0")}${Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0")}0813610${Math.floor(Math.random() * 123456789)
      .toString()
      .padStart(9, "0")}`;

    form.reset({
      account_holder_owner: true,
      bank_account_status: "active",
      business_identifier_code: "BDEXESMM",
      coowner: false,
      currency: "EUR",
      date_of_birth: "2000-12-12",
      iban: randomIBAN,
      issuing_organization: "Banco de Prueba S.A.",
      payment_possibility: true,
      registered_family_name: randomLastName,
      registered_given_name: randomFirstName,
    });
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/v1/pre-auth/eu.europa.ec.eudi.iban_mdoc",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to issue credential: ${errorText}`);
        }

        const result = await response.json();
        setQrCodeValue(result.url_data);
        setTxCode(result.tx_code);
        setIsQrDialogOpen(true);

        toast({
          title: "Issuance Offer Created",
          description: "Scan the QR code to receive your credential.",
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Issuance Failed",
          description: error.message || "An error occurred.",
        });
      }
    });
  };

  const handleDialogClose = () => {
    setIsQrDialogOpen(false);
    setQrCodeValue(null);
    setTxCode(null);
    router.push("/credential-issuance");
  };

  const loadTestData = () => {
    form.reset(testData);
  };

  return (
    <>
      <div className="w-full container mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
        <header className="flex items-center gap-3 mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            EBanking - Pre-Authorized Issuance
          </h1>
        </header>
        <main className="w-full max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="overflow-hidden shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>EBanking Credential</CardTitle>
                    <CardDescription>
                      Fill in the required banking information to issue the credential.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={fillWithTestData} disabled={isPending}>
                    <TestTube2 className="mr-2 h-4 w-4" />
                    Fill with Test Data
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="registered_given_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Given Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter given name"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registered_family_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter family name"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter IBAN"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., EUR"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bank_account_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Status</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., active"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_identifier_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Identifier Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter BIC"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuing_organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Organization</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter organization name"
                            disabled={isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-4 p-6">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Issue Credential
                </Button>
              </CardFooter>
            </Card>
            </form>
          </Form>
        </main>
      </div>

      {qrCodeValue && txCode && (
        <PreAuthorizedIssuanceDialog
          open={isQrDialogOpen}
          onOpenChange={handleDialogClose}
          qrCodeValue={qrCodeValue}
          txCode={txCode}
          onTimeout={handleDialogClose}
        />
      )}
    </>
  );
}
