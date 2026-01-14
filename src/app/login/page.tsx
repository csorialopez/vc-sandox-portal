"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (login(username, password)) {
      // Success - redirect will happen automatically via auth context
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <svg
              width="48"
              height="48"
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
          </div>
          <CardTitle className="text-2xl text-center">DC SANDBOX</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">User</Label>
              <Input
                id="username"
                type="text"
                placeholder="User"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
