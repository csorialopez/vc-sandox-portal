
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Settings,
  FileBadge,
  Users,
  History,
  QrCode,
  ClipboardList,
  ListChecks,
  Code,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddCredentialTemplateDialog } from "./add-credential-template-dialog";
import { ReceiveCredentialDialog } from "./receive-credential-dialog";
import { AddVerificationTemplateDialog } from "./add-verification-template-dialog";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/credentials", label: "Credentials Issued", icon: CreditCard },
  { href: "/credentials-verification", label: "Verification", icon: ShieldCheck },
  { href: "/credential-issuance", label: "Issuance", icon: CreditCard },
  { href: "/credential-templates", label: "Policy Templates", icon: ClipboardList },
  { href: "/status-list", label: "Status List", icon: ListChecks },
  { href: "/trust-policies", label: "Trust Policies", icon: FileBadge },
  { href: "/activity", label: "Activity", icon: History },
  { href: "/users", label: "Users", icon: Users },
];

const secondaryMenuItems = [
    { href: "/developers", label: "Developers", icon: Code },
    { href: "/settings", label: "Settings", icon: Settings },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAddTemplateOpen, setIsAddTemplateOpen] = React.useState(false);
  const [isReceiveCredentialOpen, setIsReceiveCredentialOpen] = React.useState(false);
  const [isAddVerificationTemplateOpen, setIsAddVerificationTemplateOpen] = React.useState(false);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 150 150"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <style>
                  {".cls-1{fill:none;}.cls-2{fill:#762b8a;}.cls-3{fill:url(#linear-gradient);}"}
                </style>
                <linearGradient
                  id="linear-gradient"
                  x1="-211.24"
                  y1="482.2"
                  x2="-211.24"
                  y2="478.63"
                  gradientTransform="matrix(23.21, 0, 0, -26.8, 4978.74, 12949.98)"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.2" stopColor="#c6168d" />
                  <stop offset="0.8" stopColor="#762b8a" />
                </linearGradient>
              </defs>
              <g id="Layer_2" data-name="Layer 2">
                <path
                  className="cls-1"
                  d="M0,0H150V150H0Z"
                  transform="translate(0 0)"
                />
              </g>
              <g id="Group">
                <path
                  id="Shape"
                  className="cls-2"
                  d="M75.79,145.6l-61-35.24V39.88l61-35.25,61,35.25v70.48ZM127,104.69V45.54L75.78,16,24.56,45.54v59.15l51.22,29.57Z"
                  transform="translate(0 0)"
                />
                <polygon
                  id="Path"
                  className="cls-3"
                  points="85.45 107.69 85.45 97.8 117.16 79.36 117.16 69.55 85.45 87.81 85.45 77.99 117.2 59.74 117.19 51.22 75.79 27.3 34.38 51.22 34.38 99.02 75.79 122.93 117.2 99.01 117.2 89.19 85.45 107.69"
                />
              </g>
            </svg>
            <h1 className="text-xl font-semibold">VC SANDBOX</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            <SidebarSeparator className="my-2" />
            {secondaryMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                        <SidebarMenuButton
                            isActive={pathname === item.href}
                            tooltip={item.label}
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <SidebarTrigger />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => setIsReceiveCredentialOpen(true)}>
              <QrCode className="mr-2 h-4 w-4" />
              Receive Credential
            </Button>
            <Button size="sm" asChild>
              <a href="https://drive.google.com/file/d/1L-sY3Acmvjatq2N4EtvtrGZxrTE58Wdh/view?usp=sharing" target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Get your App
              </a>
            </Button>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
        <footer className="mt-auto p-6 text-center text-sm text-muted-foreground">
             &copy; {new Date().getFullYear()} Interfase. All Rights Reserved.
             <span className="mx-2">|</span>
             <Link href="/about" className="hover:underline">About VC Sandbox</Link>
        </footer>
      </SidebarInset>
      <AddCredentialTemplateDialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen} />
      <ReceiveCredentialDialog open={isReceiveCredentialOpen} onOpenChange={setIsReceiveCredentialOpen} />
      <AddVerificationTemplateDialog open={isAddVerificationTemplateOpen} onOpenChange={setIsAddVerificationTemplateOpen} />
    </SidebarProvider>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="overflow-hidden rounded-full"
        >
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
