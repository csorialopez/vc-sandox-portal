
"use client";

import { useSettings } from "@/context/settings-context";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  const { userDataVisible, setUserDataVisible } = useSettings();

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Settings
      </h1>
      
      <div className="space-y-8">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Display Preferences</CardTitle>
            <CardDescription>
              Manage how data is displayed across the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
              <Label htmlFor="user-data-visualization" className="flex flex-col space-y-1">
                <span className="font-medium">User Data Visualization</span>
                <span className="text-sm text-muted-foreground">
                  Control the visibility of user identifying information in lists.
                </span>
              </Label>
              <div className="flex items-center gap-2">
                  <Switch
                      id="user-data-visualization"
                      checked={userDataVisible}
                      onCheckedChange={setUserDataVisible}
                  />
                  <span className="text-sm text-muted-foreground font-medium">
                      {userDataVisible ? 'Visible' : 'Hidden'}
                  </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                    Customize the look and feel of the application.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Content to be defined.</p>
            </CardContent>
        </Card>

        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>License</CardTitle>
                <CardDescription>
                    View and manage your license information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Content to be defined.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
