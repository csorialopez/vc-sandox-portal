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
  institution: z.string().min(1, "Institution is required"),
  program: z.string().min(1, "Program is required"),
  issuance_date: z.string().min(1, "Issuance date is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  portrait: z.string().min(1, "Portrait is required"),
});

const testData = {
  given_name: "example g",
  family_name: "example f",
  student_id_number: "example id",
  institution: "example iname",
  program: "examplei icode",
  issuance_date: "1990-01-15",
  expiry_date: "1990-01-15",
  portrait: "data:image/jpeg;base64,_9j_4AAQSkZJRgABAQIAJQAlAAD_4QBiRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAMAAAITAAMAAAABAAEAAAAAAAAAAAAlAAAAAQAAACUAAAAB_9sAQwADAgICAgIDAgICAwMDAwQGBAQEBAQIBgYFBgkICgoJCAkJCgwPDAoLDgsJCQ0RDQ4PEBAREAoMEhMSEBMPEBAQ_8AACwgBsQFoAQERAP_EAB4AAQABBAMBAQAAAAAAAAAAAAABAgcICQMEBgoF_8QASRAAAQMDAwMCBQAHBAYGCwAAAQACAwQFEQYHEgghMQlBEyJRYXEUIzJCUoGRFWJyshgzOHWCwhZDobHR8CQlJjQ1REaGs8PU_9oACAEBAAA_ANqL_ZSPClERERERERERERERERERERERERERERUv9vypHhSiIiIiIiIi4Q93_k5I_Psvy7_qiw6Vtk961LfaG1W-mbzmqq2pZTwsbj9oveQGjse5IH3Vir16hnRpYq6S31u_thfNE7DjSRVNXFn7SQxPa4fgrqD1J-iR_wCxvxbj_wDa7gP_ANC_E1f6pPRhpaifUUu51VqCpa3Io7RZqt8z_wAOljZEP-J4Vuz60HS04fq9GbnfztND_wD2LyJ9bDa4ainp27M6pdYW5-BXfp8H6U_s0_NT44M7kj_Wu8L8mq9bvTUdZPHQ9Pd1nphK4QSS6jjje6MeJ7OXYqfW30T-kUYpNi72ad7miqfLeImvYD5MYbE4Px93NVwZ_WQ6WYqlsAse4UzBHHI-aC1Uvw2lzWuMeX1IcXMyWO-XBcxxa4tw53vtLeqP0YanjgbNunPY6mVveC6WesiLHfwue2N0Y_Iesk9F670luLYabVWhtTW--WirGYauhnbLE7_ibnv9shejRERERERERERUv9vypHhSiIiIiIijIX5V6vtu07bKq9Xy501voKCB9TU1NRK2KGGJgy973uOGtaO5JIA8Ela5t5vWY0pp7UE9j2W0B_0opaaV0ZutxqX00VRxdjMUQHMtJ_ZLi0keWrEDfD1N-pzeCpMNs1M3RVocXj-gWF5j5fd8zsyH-RasbNS7n7k6ypP7P1buHqS90jZPitguN1nqYw_-INkcRnv5XmCSexPhEySMEnAQEjwSnJx8uP8AVTyd_Ef6pyd3-Y9_Pfyge8Yw89vHfwo5O-pVydpuoPenZKsM-1m4d3sTXSfEkpoJS6CQ_V0Tg5hP5C2JdNnrERzPp9MdS1mFO48YxqK0U5c0Euxymp25-UDuXMz_AIXLZbpTWGntb2Ci1TpC_Ul5s9yiZNSV1FM2aCVjs9w9p748HuDkY_aBC_fyFKIiIiIiIiIiKl_t-VI8KURERERRkfVdK43KitlHLcLhcKekpIGfFlmnlDGMZ_E5xIDR9z2WIPUJ6oPTxs02W1aSvTNf6gAcBTWWpa-lheOwEtSAYwM-zC4_XitPu8PUzvPvdqC63vWuvr1LT3Ob4ptcddIyiiZz5RxthDuBDfqRlWlyfGShJPknsiIiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIi",
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
      institution: "",
      program: "",
      issuance_date: "",
      expiry_date: "",
      portrait: "",
    },
  });

  const fillWithTestData = () => {
    const firstNames = ["Carlos", "Maria", "Juan", "Sofia", "Luis", "Ana", "Jose", "Laura"];
    const lastNames = ["Perez", "Garcia", "Rodriguez", "Lopez", "Martinez", "Sanchez", "Gomez", "Fernandez"];
    const institutions = ["Universidad Nacional", "Instituto Técnico", "Colegio Mayor"];
    const programs = ["Computer Science", "Engineering", "Business Administration"];
    const portraitBase64 = "_9j_4AAQSkZJRgABAQIAJQAlAAD_4QBiRXhpZgAATU0AKgAAAAgABQESAAMAAAABAAEAAAEaAAUAAAABAAAASgEbAAUAAAABAAAAUgEoAAMAAAABAAMAAAITAAMAAAABAAEAAAAAAAAAAAAlAAAAAQAAACUAAAAB_9sAQwADAgICAgIDAgICAwMDAwQGBAQEBAQIBgYFBgkICgoJCAkJCgwPDAoLDgsJCQ0RDQ4PEBAREAoMEhMSEBMPEBAQ_8AACwgBsQFoAQERAP_EAB4AAQABBAMBAQAAAAAAAAAAAAABAgcICQMEBgoF_8QASRAAAQMDAwMCBQAHBAYGCwAAAQACAwQFEQYHEgghMQlBEyJRYXEUIzJCUoGRFWJyshgzOHWCwhZDobHR8CQlJjQ1REaGs8PU_9oACAEBAAA_ANqL_ZSPClERERERERERERERERERERERERERERUv9vypHhSiIiIiIiIi4Q93_k5I_Psvy7_qiw6Vtk961LfaG1W-mbzmqq2pZTwsbj9oveQGjse5IH3Vir16hnRpYq6S31u_thfNE7DjSRVNXFn7SQxPa4fgrqD1J-iR_wCxvxbj_wDa7gP_ANC_E1f6pPRhpaifUUu51VqCpa3Io7RZqt8z_wAOljZEP-J4Vuz60HS04fq9GbnfztND_wD2LyJ9bDa4ainp27M6pdYW5-BXfp8H6U_s0_NT44M7kj_Wu8L8mq9bvTUdZPHQ9Pd1nphK4QSS6jjje6MeJ7OXYqfW30T-kUYpNi72ad7miqfLeImvYD5MYbE4Px93NVwZ_WQ6WYqlsAse4UzBHHI-aC1Uvw2lzWuMeX1IcXMyWO-XBcxxa4tw53vtLeqP0YanjgbNunPY6mVveC6WesiLHfwue2N0Y_Iesk9F670luLYabVWhtTW--WirGYauhnbLE7_ibnv9shejRERERERERERUv9vypHhSiIiIiIijIX5V6vtu07bKq9Xy501voKCB9TU1NRK2KGGJgy973uOGtaO5JIA8Ela5t5vWY0pp7UE9j2W0B_0opaaV0ZutxqX00VRxdjMUQHMtJ_ZLi0keWrEDfD1N-pzeCpMNs1M3RVocXj-gWF5j5fd8zsyH-RasbNS7n7k6ypP7P1buHqS90jZPitguN1nqYw_-INkcRnv5XmCSexPhEySMEnAQEjwSnJx8uP8AVTyd_Ef6pyd3-Y9_Pfyge8Yw89vHfwo5O-pVydpuoPenZKsM-1m4d3sTXSfEkpoJS6CQ_V0Tg5hP5C2JdNnrERzPp9MdS1mFO48YxqK0U5c0Euxymp25-UDuXMz_AIXLZbpTWGntb2Ci1TpC_Ul5s9yiZNSV1FM2aCVjs9w9p748HuDkY_aBC_fyFKIiIiIiIiIiKl_t-VI8KURERERRkfVdK43KitlHLcLhcKekpIGfFlmnlDGMZ_E5xIDR9z2WIPUJ6oPTxs02W1aSvTNf6gAcBTWWpa-lheOwEtSAYwM-zC4_XitPu8PUzvPvdqC63vWuvr1LT3Ob4ptcddIyiiZz5RxthDuBDfqRlWlyfGShJPknsiIiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIiZP1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIi5P1VTXuJ7uJ8nz9fKvv0zdXe7_AEwaghuGjL1UVFikmDq6xVUhdSVLB-3huPkecftNwR75W7jpv6v9nOp2xCs0BqNkd7hjY64WKsIiraJ3FvLLCf1rORAD4-QPIAlrsht9GOLhnPnwqh4UoiIiIiIi";
    
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomInstitution = institutions[Math.floor(Math.random() * institutions.length)];
    const randomProgram = programs[Math.floor(Math.random() * programs.length)];
    const randomStudentId = `STU${Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0")}`;
    const today = new Date();
    const expiryDate = new Date(today.getFullYear() + 4, today.getMonth(), today.getDate());

    form.reset({
      given_name: randomFirstName,
      family_name: randomLastName,
      student_id_number: randomStudentId,
      institution: randomInstitution,
      program: randomProgram,
      issuance_date: today.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      portrait: portraitBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''),
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
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter institution"
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
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter program"
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
                    name="issuance_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuance Date</FormLabel>
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
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
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
                    name="portrait"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portrait</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            disabled={isPending}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const result = reader.result as string;
                                  const base64Content = result
                                    .replace(/^data:.*;base64,/, '')
                                    .replace(/\+/g, '-')
                                    .replace(/\//g, '_')
                                    .replace(/=/g, '');
                                  field.onChange(base64Content);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
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
