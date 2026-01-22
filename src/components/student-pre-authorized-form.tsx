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
  given_name: z.string().min(1, "Given name is required"),
  family_name: z.string().min(1, "Family name is required"),
  student_id_number: z.string().min(1, "Student ID number is required"),
  institution_name: z.string().min(1, "Institution name is required"),
  institution_code: z.string().min(1, "Institution code is required"),
  academic_year: z.coerce.number().min(1900, "Valid academic year required"),
});

const testData = {
  given_name: "example g",
  family_name: "example f",
  student_id_number: "example id",
  institution_name: "example iname",
  institution_code: "examplei icode",
  academic_year: 2025,
};

type FormValues = z.infer<typeof formSchema>;

export function StudentPreAuthorizedForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [txCode, setTxCode] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      given_name: "",
      family_name: "",
      student_id_number: "",
      institution_name: "",
      institution_code: "",
      academic_year: new Date().getFullYear(),
    },
  });

  const fillWithTestData = () => {
    const firstNames = ["Carlos", "Maria", "Juan", "Sofia", "Luis", "Ana", "Jose", "Laura"];
    const lastNames = ["Perez", "Garcia", "Rodriguez", "Lopez", "Martinez", "Sanchez", "Gomez", "Fernandez"];
    const institutions = ["Universidad Nacional", "Instituto Técnico", "Colegio Mayor"];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomInstitution = institutions[Math.floor(Math.random() * institutions.length)];
    const randomStudentId = `STU${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;

    form.reset({
      given_name: randomFirstName,
      family_name: randomLastName,
      student_id_number: randomStudentId,
      institution_name: randomInstitution,
      institution_code: `INST${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      academic_year: 2025,
    });
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/v1/pre-auth/uy.interfase.student_mdoc",
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
            Student - Pre-Authorized Issuance
          </h1>
        </header>
        <main className="w-full max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="overflow-hidden shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Student Credential</CardTitle>
                    <CardDescription>
                      Fill in the required student information to issue the credential.
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
                    name="given_name"
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
                    name="family_name"
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
                    name="student_id_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter student ID"
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
                    name="institution_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter institution name"
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
                    name="institution_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter institution code"
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
                    name="academic_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2025"
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
