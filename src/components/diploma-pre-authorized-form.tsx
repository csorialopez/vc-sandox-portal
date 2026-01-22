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
  given_name: z.string().min(1, "Given name is required"),
  family_name: z.string().min(1, "Family name is required"),
  diploma_title: z.string().min(1, "Diploma title is required"),
  program_course: z.string().min(1, "Program/course is required"),
  graduation_date: z.string().min(1, "Graduation date is required"),
  academic_result: z.boolean().default(false),
  completion_state: z.string().min(1, "Completion state is required"),
  honors: z.boolean().default(false),
});

const testData = {
  given_name: "example name",
  family_name: "example last",
  diploma_title: "example title",
  program_course: "example course",
  graduation_date: "2025-12-12",
  academic_result: true,
  completion_state: "example",
  honors: true,
};

type FormValues = z.infer<typeof formSchema>;

export function DiplomaPreAuthorizedForm() {
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
      diploma_title: "",
      program_course: "",
      graduation_date: "",
      academic_result: false,
      completion_state: "",
      honors: false,
    },
  });

  const fillWithTestData = () => {
    const firstNames = ["Carlos", "Maria", "Juan", "Sofia", "Luis", "Ana", "Jose", "Laura"];
    const lastNames = ["Perez", "Garcia", "Rodriguez", "Lopez", "Martinez", "Sanchez", "Gomez", "Fernandez"];
    const titles = ["Bachelor of Science", "Master of Engineering", "Diploma in Computer Science"];
    const courses = ["Software Development", "Data Science", "Information Technology"];
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomCourse = courses[Math.floor(Math.random() * courses.length)];
    const randomYear = 2024 - Math.floor(Math.random() * 5);
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomDay = Math.floor(Math.random() * 28) + 1;

    form.reset({
      given_name: randomFirstName,
      family_name: randomLastName,
      diploma_title: randomTitle,
      program_course: randomCourse,
      graduation_date: `${randomYear}-${String(randomMonth).padStart(2, "0")}-${String(randomDay).padStart(2, "0")}`,
      academic_result: true,
      completion_state: "Completed",
      honors: Math.random() > 0.5,
    });
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const response = await fetch(
          "/api/v1/pre-auth/uy.interfase.diploma_sd_jwt_vc",
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
            Diploma - Pre-Authorized Issuance
          </h1>
        </header>
        <main className="w-full max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="overflow-hidden shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Diploma Credential</CardTitle>
                    <CardDescription>
                      Fill in the required diploma information to issue the credential.
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
                    name="diploma_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diploma Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter diploma title"
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
                    name="program_course"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program/Course</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter program or course"
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
                    name="graduation_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Graduation Date</FormLabel>
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
                    name="completion_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion State</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter completion state"
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
                    name="academic_result"
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
                          <FormLabel>Academic Result</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="honors"
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
                          <FormLabel>Honors</FormLabel>
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
