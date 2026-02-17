"use client";

import { Mail, Shield, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminAccountProps {
  userEmail: string;
  userId: string;
}

export function AdminAccount({ userEmail, userId }: AdminAccountProps) {
  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Clerk User ID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {userId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Authentication</p>
              <p className="text-sm text-muted-foreground">
                Google OAuth via Clerk
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Type</CardTitle>
          <CardDescription>
            Your account permissions and access level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-primary/10 p-4">
            <p className="font-medium">Administrator</p>
            <p className="text-sm text-muted-foreground mt-1">
              Full access to all admin features, knowledge base management, and
              settings. Account is managed through Clerk.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
