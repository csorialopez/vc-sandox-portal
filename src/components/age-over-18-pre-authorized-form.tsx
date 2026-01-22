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
import { Checkbox } from "./ui/checkbox";

const formSchema = z.object({
  user_pseudonym: z.string().min(1, "User pseudonym is required"),
  age_over_18: z.boolean().default(false),
});

const testData = {
  user_pseudonym: "example_user",
  age_over_18: true,
};

type FormValues = z.infer<typeof formSchema>;

export function AgeOver18PreAuthorizedForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [txCode, setTxCode] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_pseudonym: "",
      age_over_18: false,
    },
  });

  const fillWithTestData = () => {
    const firstNames = ["Carlos", "Maria", "Juan", "Sofia", "Luis", "Ana", "Jose", "Laura"];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomPseudonym = `user_${randomFirstName.toLowerCase()}_${Math.floor(Math.random() * 1000)}`;

    form.reset({
      user_pseudonym: randomPseudonym,
      age_over_18: true,
    });
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/v1/pre-auth/eu.europa.ec.eudi.pseudonym_over18_mdoc",
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
            Age Over 18 - Pre-Authorized Issuance
          </h1>
        </header>
        <main className="w-full max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="overflow-hidden shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Age Over 18 Credential</CardTitle>
                    <CardDescription>
                      Fill in the required information to issue the credential.
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
                    name="user_pseudonym"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Pseudonym</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter user pseudonym"
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
                    name="age_over_18"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Age Over 18</FormLabel>
                        </div>
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
