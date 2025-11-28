
import type { LucideIcon } from "lucide-react";
import { CreditCard, FileText, GraduationCap, Users, Fingerprint, ClipboardList, History } from "lucide-react";

export interface Attribute {
  id: string;
  name: string;
  description: string;
  sdJwtPath?: string;
}

export type SupportedFormat = "mso_mdoc" | "dc+sd-jwt";

export interface VerifiableCredential {
  id: string;
  name: string;
  issuer: string;
  icon: LucideIcon;
  attributes: Attribute[];
  supportedFormats: SupportedFormat[];
}

export const credentialTypeAliases: Record<string, string> = {
  "eu.europa.ec.eudi.pid.1": "Person Identification Data (mdoc)",
  "org.iso.18013.5.1.mDL": "Mobile Driver Licence",
  "urn:eudi:pid:1": "Person Identification Data (sdjwt)",
  "urn:eu.europa.ec.eudi:pseudonym_age_over_18:1": "Age Over 18",
  "uy.interfase.student.1": "Student Diploma",
  "eu.europa.ec.eudi.iban.1": "IBAN",
  "urn:org.caricom.csme:skills:1": "CSME Skills Certificate",
};

export function getCredentialTypeAlias(type: string): string {
  return credentialTypeAliases[type] || type;
}


export const credentialsData: VerifiableCredential[] = [
  {
    id: "eu.europa.ec.eudi.pid.1",
    name: "Person Identification Data",
    issuer: "German Government",
    icon: CreditCard,
    attributes: [
      { id: "given_name", name: "Given Name", description: "Your first name.", sdJwtPath: "given_name" },
      { id: "family_name", name: "Family Name", description: "Your last name.", sdJwtPath: "family_name" },
      { id: "birthdate", name: "Date of Birth", description: "Your birth date.", sdJwtPath: "birthdate" },
      { id: "nationality", name: "Nationality", description: "Your country of citizenship.", sdJwtPath: "nationalities" },
      { id: "sex", name: "Sex", description: "Your legal sex.", sdJwtPath: "sex" },
      { id: "issuance_date", name: "Issuance Date", description: "When the ID was issued.", sdJwtPath: "date_of_issuance" },
      { id: "expiry_date", name: "Expiry Date", description: "When the ID expires.", sdJwtPath: "date_of_expiry" },
      { id: "document_number", name: "Document Number", description: "Unique ID of the document.", sdJwtPath: "document_number" },
    ],
    supportedFormats: ["mso_mdoc", "dc+sd-jwt"],
  },
  {
    id: "org.iso.18013.5.1.mDL",
    name: "Mobile Driver's Licence",
    issuer: "French Ministry of Transport",
    icon: FileText,
    attributes: [
      { id: "given_name", name: "Given Name", description: "Your first name." },
      { id: "family_name", name: "Family Name", description: "Your last name." },
      { id: "birth_date", name: "Date of Birth", description: "Your birth date." },
      { id: "issue_date", name: "Issue Date", description: "Date of license issuance." },
      { id: "expiry_date", name: "Expiry Date", description: "Date of license expiry." },
      { id: "driving_privileges", name: "Driving Privileges", description: "Vehicle categories you can drive." },
      { id: "portrait", name: "Portrait", description: "Your official photo." },
    ],
    supportedFormats: ["mso_mdoc"],
  },
  {
    id: "urn:org.caricom.csme:skills:1",
    name: "CSME Skills Certificate",
    issuer: "CARICOM",
    icon: FileText,
    attributes: [
      { id: "fullName", name: "Full Name", description: "The full name of the holder." },
      { id: "picture", name: "Picture", description: "A photo of the holder." },
      { id: "dateOfBirth", name: "Date of Birth", description: "The holder's date of birth." },
      { id: "placeOfBirth", name: "Place of Birth", description: "The holder's place of birth." },
      { id: "nationality", name: "Nationality", description: "The holder's nationality." },
      { id: "passportNumber", name: "Passport Number", description: "The holder's passport number." },
      { id: "maritalStatus", name: "Marital Status", description: "The holder's marital status." },
      { id: "occupation", name: "Occupation", description: "The holder's occupation." },
      { id: "qualification", name: "Qualification", description: "The qualification obtained." },
      { id: "certificateNumber", name: "Certificate Number", description: "The certificate number." },
      { id: "issuanceDate", name: "Issuance Date", description: "Date the certificate was issued." },
      { id: "expiryDate", name: "Expiry Date", description: "Date the certificate expires." },
      { id: "dependants", name: "Dependants", description: "Any dependants of the holder." },
      { id: "credential_type", name: "Credential Type", description: "The type of credential." },
      { id: "issuing_authority", name: "Issuing Authority", description: "The issuing authority." },
    ],
    supportedFormats: ["dc+sd-jwt"],
  }
];

export interface CredentialListItem {
  id: string;
  name: string;
  email: string;
  avatar: {
    initials: string;
    bgColor: string;
  };
  type: string;
  format: string;
  issuingAuthority: string;
  issuanceDate: string;
}

export const credentialsListData: CredentialListItem[] = [
    {
      id: "user-1",
      name: "John Doe",
      email: "john.doe@example.com",
      avatar: { initials: "JD", bgColor: "bg-blue-200" },
      type: "Person Identification Data",
      format: "sd-jwt",
      issuingAuthority: "Healthnet",
      issuanceDate: "2025-01-15"
    },
    {
      id: "user-2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      avatar: { initials: "JS", bgColor: "bg-pink-200" },
      type: "Mobile Driver's Licence",
      format: "mdoc",
      issuingAuthority: "Global Bank",
      issuanceDate: "2025-02-20"
    },
    {
      id: "user-3",
      name: "Sam Wilson",
      email: "sam.wilson@example.com",
      avatar: { initials: "SW", bgColor: "bg-gray-700 text-white" },
      type: "University Diploma",
      format: "sd-jwt",
      issuingAuthority: "University of NextJS",
      issuanceDate: "2025-03-10"
    },
    {
      id: "user-4",
      name: "Alice Johnson",
      email: "alice.j@example.com",
      avatar: { initials: "AJ", bgColor: "bg-purple-200" },
      type: "CSME Skills Certificate",
      format: "mdoc",
      issuingAuthority: "State DMV",
      issuanceDate: "2025-04-05"
    },
    {
      id: "user-5",
      name: "Michael Brown",
      email: "mbrown@example.com",
      avatar: { initials: "MB", bgColor: "bg-green-200" },
      type: "Person Identification Data",
      format: "sd-jwt",
      issuingAuthority: "National Certifiers",
      issuanceDate: "2025-05-25"
    },
    {
      id: "user-6",
      name: "Emily Davis",
      email: "emily.d@example.com",
      avatar: { initials: "ED", bgColor: "bg-red-200" },
      type: "Mobile Driver's Licence",
      format: "mdoc",
      issuingAuthority: "City Council",
      issuanceDate: "2025-06-11"
    },
    {
      id: "user-7",
      name: "Chris Green",
      email: "chris.g@example.com",
      avatar: { initials: "CG", bgColor: "bg-yellow-200" },
      type: "University Diploma",
      format: "sd-jwt",
      issuingAuthority: "Tech Corp",
      issuanceDate: "2025-07-22"
    },
    {
      id: "user-8",
      name: "Olivia White",
      email: "olivia.w@example.com",
      avatar: { initials: "OW", bgColor: "bg-indigo-200" },
      type: "CSME Skills Certificate",
      format: "mdoc",
      issuingAuthority: "Art Academy",
      issuanceDate: "2025-08-30"
    },
    {
      id: "user-9",
      name: "Daniel Black",
      email: "daniel.b@example.com",
      avatar: { initials: "DB", bgColor: "bg-gray-400" },
      type: "Person Identification Data",
      format: "sd-jwt",
      issuingAuthority: "Sports Federation",
      issuanceDate: "2025-09-18"
    },
    {
      id: "user-10",
      name: "Sophia Rodriguez",
      email: "sophia.r@example.com",
      avatar: { initials: "SR", bgColor: "bg-teal-200" },
      type: "Mobile Driver's Licence",
      format: "mdoc",
      issuingAuthority: "Music Conservatory",
      issuanceDate: "2025-10-01"
    },
    {
      id: "user-11",
      name: "Liam Martinez",
      email: "liam.m@example.com",
      avatar: { initials: "LM", bgColor: "bg-orange-200" },
      type: "University Diploma",
      format: "sd-jwt",
      issuingAuthority: "Driving School",
      issuanceDate: "2025-11-12"
    },
    {
      id: "user-12",
      name: "Ava Garcia",
      email: "ava.g@example.com",
      avatar: { initials: "AG", bgColor: "bg-cyan-200" },
      type: "CSME Skills Certificate",
      format: "mdoc",
      issuingAuthority: "Public Library",
      issuanceDate: "2025-12-05"
    },
    {
      id: "user-13",
      name: "Noah Hernandez",
      email: "noah.h@example.com",
      avatar: { initials: "NH", bgColor: "bg-lime-200" },
      type: "Person Identification Data",
      format: "sd-jwt",
      issuingAuthority: "Community College",
      issuanceDate: "2026-01-20"
    },
    {
      id: "user-14",
      name: "Isabella Lopez",
      email: "isabella.l@example.com",
      avatar: { initials: "IL", bgColor: "bg-fuchsia-200" },
      type: "Mobile Driver's Licence",
      format: "mdoc",
      issuingAuthority: "National Museum",
      issuanceDate: "2026-02-14"
    },
    {
      id: "user-15",
      name: "James Gonzalez",
      email: "james.g@example.com",
      avatar: { initials: "JG", bgColor: "bg-rose-200" },
      type: "University Diploma",
      format: "sd-jwt",
      issuingAuthority: "Science Institute",
      issuanceDate: "2026-03-28"
    }
  ];
  
  export const dashboardStats = [
    {
      title: "Total Users",
      value: "15",
      description: "Managed users in the system",
      icon: Users,
    },
    {
      title: "Total Credentials Issued",
      value: "15",
      description: "Credentials issued to users",
      icon: Fingerprint,
    },
    {
      title: "Total Credential Templates",
      value: "5",
      description: "Available credential templates",
      icon: ClipboardList,
    },
  ];

  export interface User {
    id: string;
    family_name: string;
    given_name: string;
    email: string;
    nationality: string;
    document_number: string;
    role: "Administrator" | "Credential Manager" | "Verifier Manager";
    avatar: {
      initials: string;
      bgColor: string;
    };
  }
  
  export const usersList: User[] = [
    {
      id: "user-1",
      family_name: "Doe",
      given_name: "John",
      email: "john.doe@example.com",
      nationality: "USA",
      document_number: "L899F234",
      role: "Administrator",
      avatar: { initials: "JD", bgColor: "bg-blue-200" },
    },
    {
      id: "user-2",
      family_name: "Smith",
      given_name: "Jane",
      email: "jane.smith@example.com",
      nationality: "CAN",
      document_number: "X345T123",
      role: "Credential Manager",
      avatar: { initials: "JS", bgColor: "bg-pink-200" },
    },
    {
      id: "user-3",
      family_name: "Wilson",
      given_name: "Sam",
      email: "sam.wilson@example.com",
      nationality: "GBR",
      document_number: "A908B456",
      role: "Verifier Manager",
      avatar: { initials: "SW", bgColor: "bg-gray-700 text-white" },
    },
    {
      id: "user-4",
      family_name: "Johnson",
      given_name: "Alice",
      email: "alice.j@example.com",
      nationality: "AUS",
      document_number: "Z789C789",
      role: "Credential Manager",
      avatar: { initials: "AJ", bgColor: "bg-purple-200" },
    },
    {
      id: "user-5",
      family_name: "Brown",
      given_name: "Michael",
      email: "mbrown@example.com",
      nationality: "DEU",
      document_number: "Y456D012",
      role: "Administrator",
      avatar: { initials: "MB", bgColor: "bg-green-200" },
    }
  ];

  export interface ActivityEvent {
    id: string;
    event: "Credential Issued" | "Verification Success" | "Verification Failed";
    date: string;
    credential: string;
  }

  export const activityLogData: ActivityEvent[] = [
    { id: "evt-1", event: "Credential Issued", date: "2025-11-20 10:00 AM", credential: "Person Identification Data" },
    { id: "evt-2", event: "Verification Success", date: "2025-11-20 09:45 AM", credential: "Mobile Driver's Licence" },
    { id: "evt-3", event: "Verification Failed", date: "2025-11-19 03:22 PM", credential: "CSME Skills Certificate" },
    { id: "evt-4", event: "Credential Issued", date: "2025-11-19 11:10 AM", credential: "University Diploma" },
    { id: "evt-5", event: "Verification Success", date: "2025-11-18 08:05 AM", credential: "Person Identification Data" },
    { id: "evt-6", event: "Credential Issued", date: "2025-11-17 02:00 PM", credential: "Mobile Driver's Licence" },
    { id: "evt-7", event: "Verification Failed", date: "2025-11-17 01:30 PM", credential: "Person Identification Data" },
    { id: "evt-8", event: "Credential Issued", date: "2025-11-16 04:50 PM", credential: "CSME Skills Certificate" },
    { id: "evt-9", event: "Verification Success", date: "2025-11-16 10:20 AM", credential: "University Diploma" },
    { id: "evt-10", event: "Credential Issued", date: "2025-11-15 09:00 AM", credential: "Person Identification Data" },
    { id: "evt-11", event: "Verification Failed", date: "2025-11-14 05:00 PM", credential: "Mobile Driver's Licence" },
    { id: "evt-12", event: "Credential Issued", date: "2025-11-14 11:00 AM", credential: "CSME Skills Certificate" },
    { id: "evt-13", event: "Verification Success", date: "2025-11-13 03:30 PM", credential: "Person Identification Data" },
    { id: "evt-14", event: "Credential Issued", date: "2025-11-13 10:00 AM", credential: "University Diploma" },
    { id: "evt-15", event: "Verification Failed", date: "2025-11-12 09:00 AM", credential: "Mobile Driver's Licence" },
    { id: "evt-16", event: "Credential Issued", date: "2025-11-11 01:15 PM", credential: "Person Identification Data" },
    { id: "evt-17", event: "Verification Success", date: "2025-11-10 04:00 PM", credential: "CSME Skills Certificate" },
    { id: "evt-18", event: "Credential Issued", date: "2025-11-09 08:30 AM", credential: "University Diploma" },
  ];

  export interface CredentialTemplate {
    id: string;
    name: string;
    type: "Issuance" | "Verification";
    createdAt: string;
    format: SupportedFormat;
  }

  export const credentialTemplatesData: CredentialTemplate[] = [
    { id: "tmpl-1", name: "PID Issuance", type: "Issuance", createdAt: "2025-10-28", format: "mso_mdoc" },
    { id: "tmpl-2", name: "mDL Verification", type: "Verification", createdAt: "2025-10-27", format: "mso_mdoc" },
    { id: "tmpl-3", name: "Skills Certificate Issuance", type: "Issuance", createdAt: "2025-11-15", format: "dc+sd-jwt" },
    { id: "tmpl-4", name: "Diploma Verification", type: "Verification", createdAt: "2025-09-05", format: "mso_mdoc" },
    { id: "tmpl-5", name: "PID SD-JWT Issuance", type: "Issuance", createdAt: "2025-09-01", format: "dc+sd-jwt" },
  ];

  export interface CredentialStatus {
    id: string;
    policy: SupportedFormat;
    dateIssued: string;
    status: "active" | "revoked";
  }

  export const credentialStatusData: CredentialStatus[] = [
    { id: "18fd67a5-5a63-4580-a6a1-49ffa92926c6", policy: "dc+sd-jwt", dateIssued: "2025-07-31", status: "active" },
    { id: "0d3a24b3-a7c8-4b24-8c88-512c836817e0", policy: "mso_mdoc", dateIssued: "2025-07-30", status: "active" },
    { id: "e1f1a5de-32c3-42e5-89f4-839556a31c5c", policy: "dc+sd-jwt", dateIssued: "2025-07-29", status: "revoked" },
    { id: "fab5e3a8-4cde-43c2-a4f6-8d00aa829f7b", policy: "mso_mdoc", dateIssued: "2025-07-28", status: "active" },
    { id: "6c1a82e7-91a6-4c91-9e7c-54a4a15951d3", policy: "dc+sd-jwt", dateIssued: "2025-07-27", status: "active" },
    { id: "a5c4f284-5e58-4b72-9113-d44458f33c37", policy: "mso_mdoc", dateIssued: "2025-07-26", status: "revoked" },
    { id: "b3f3b4b5-6a53-4a15-998b-1e582a8eb33c", policy: "dc+sd-jwt", dateIssued: "2025-07-25", status: "active" },
    { id: "c4b4c5d6-7b64-4b26-a09c-2f693b9fc44d", policy: "mso_mdoc", dateIssued: "2025-07-24", status: "active" },
    { id: "d5c5d6e7-8c75-4c37-b1ad-3g704ca0d55e", policy: "dc+sd-jwt", dateIssued: "2025-07-23", status: "active" },
    { id: "e6d6e7f8-9d86-4d48-c2be-4h815db1e66f", policy: "mso_mdoc", dateIssued: "2025-07-22", status: "revoked" },
    { id: "f7e7f8g9-0e97-4e59-d3cf-5i926ec2f77g", policy: "dc+sd-jwt", dateIssued: "2025-07-21", status: "active" },
    { id: "g8f8g9h0-1f08-4f6a-e4df-6j037fd3g88h", policy: "mso_mdoc", dateIssued: "2025-07-20", status: "active" },
    { id: "h9g9h0i1-2g19-4g7b-f5eg-7k148ge4h99i", policy: "dc+sd-jwt", dateIssued: "2025-07-19", status: "active" },
    { id: "i0h0i1j2-3h20-4h8c-g6fh-8l259hf5i00j", policy: "mso_mdoc", dateIssued: "2025-07-18", status: "revoked" },
    { id: "j1i1j2k3-4i31-4i9d-h7gi-9m360ig6j11k", policy: "dc+sd-jwt", dateIssued: "2025-07-17", status: "active" },
  ];

export const monthlyVerifications = [
    { month: 'Jan', verifications: 186, failed: 28 },
    { month: 'Feb', verifications: 305, failed: 45 },
    { month: 'Mar', verifications: 237, failed: 35 },
    { month: 'Apr', verifications: 273, failed: 40 },
    { month: 'May', verifications: 209, failed: 31 },
    { month: 'Jun', verifications: 214, failed: 32 },
    { month: 'Jul', verifications: 321, failed: 48 },
    { month: 'Aug', verifications: 298, failed: 44 },
    { month: 'Sep', verifications: 251, failed: 37 },
    { month: 'Oct', verifications: 288, failed: 43 },
    { month: 'Nov', verifications: 312, failed: 46 },
];






    
