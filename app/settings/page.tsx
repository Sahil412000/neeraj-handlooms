"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Configuration {
  defaultMakingRate: number;
  defaultFittingRate: number;
  defaultTrackRate: number;
  defaultHookRate: number;
  termsAndConditions: string;
  companyName?: string;
  companyAddress?: string;
  companyContact?: string;
  gstNumber?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<Configuration>({
    defaultMakingRate: 180,
    defaultFittingRate: 300,
    defaultTrackRate: 180,
    defaultHookRate: 200,
    termsAndConditions: `1) Order once placed cannot be cancelled
2) Advance paid will not be refunded
3) Delivery will be done after full bill is cleared at the Shop
4) Shop Closed on TUESDAY`,
    companyName: "",
    companyAddress: "",
    companyContact: "",
    gstNumber: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/configuration", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.configuration);
      }
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/configuration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Settings saved successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save settings",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-4"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Settings & Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage default rates and business information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div
              className={`px-4 py-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-600"
                  : "bg-destructive/10 border border-destructive/20 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Default Cost Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Default Cost Rates</CardTitle>
              <CardDescription>
                These rates will be used as defaults when creating new projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultMakingRate">
                    Making Rate (₹/meter)
                  </Label>
                  <Input
                    id="defaultMakingRate"
                    name="defaultMakingRate"
                    type="number"
                    step="0.01"
                    value={config.defaultMakingRate}
                    onChange={handleChange}
                    placeholder="180"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost per meter for making curtains
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultFittingRate">
                    Fitting Rate (₹/unit)
                  </Label>
                  <Input
                    id="defaultFittingRate"
                    name="defaultFittingRate"
                    type="number"
                    step="0.01"
                    value={config.defaultFittingRate}
                    onChange={handleChange}
                    placeholder="300"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost per window/unit for fitting
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTrackRate">Track Rate (₹/ft)</Label>
                  <Input
                    id="defaultTrackRate"
                    name="defaultTrackRate"
                    type="number"
                    step="0.01"
                    value={config.defaultTrackRate}
                    onChange={handleChange}
                    placeholder="180"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost per foot for curtain track
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultHookRate">Hook Rate (₹/unit)</Label>
                  <Input
                    id="defaultHookRate"
                    name="defaultHookRate"
                    type="number"
                    step="0.01"
                    value={config.defaultHookRate}
                    onChange={handleChange}
                    placeholder="200"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Cost per unit for hooks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                This information will appear on quotations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={config.companyName}
                  onChange={handleChange}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea
                  id="companyAddress"
                  name="companyAddress"
                  value={config.companyAddress}
                  onChange={handleChange}
                  placeholder="Your business address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyContact">Contact Number</Label>
                  <Input
                    id="companyContact"
                    name="companyContact"
                    type="tel"
                    value={config.companyContact}
                    onChange={handleChange}
                    placeholder="Business contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    type="text"
                    value={config.gstNumber}
                    onChange={handleChange}
                    placeholder="GST Number (if applicable)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>
                These will appear on all quotations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="termsAndConditions"
                  name="termsAndConditions"
                  value={config.termsAndConditions}
                  onChange={handleChange}
                  placeholder="Enter terms and conditions"
                  rows={6}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
