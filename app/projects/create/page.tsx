"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Customer {
  _id: string;
  name: string;
  contactNumber: string;
  alternateContact?: string;
  address: string;
  email?: string;
}

interface Tailor {
  _id: string;
  name: string;
  contactNumber: string;
  specialization?: string;
  isActive: boolean;
}

interface SalesPerson {
  _id: string;
  name: string;
  contactNumber: string;
  territory?: string;
  isActive: boolean;
}

interface Configuration {
  defaultMakingRate: number;
  defaultFittingRate: number;
  defaultTrackRate: number;
  defaultHookRate: number;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<Configuration | null>(null);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [customerType, setCustomerType] = useState<"new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const [formData, setFormData] = useState({
    // Customer fields
    customerName: "",
    contactNumber: "",
    alternateContact: "",
    address: "",
    email: "",

    // Project fields
    projectType: "",
    salesPersonId: "",
    projectNotes: "",
    tailorId: "",
    probableDeliveryDate: "",

    // Cost fields
    defaultMakingRate: "",
    defaultFittingRate: "",
    defaultTrackRate: "",
    defaultHookRate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch configuration, tailors, and sales persons on mount
  useEffect(() => {
    fetchConfiguration();
    fetchTailors();
    fetchSalesPersons();
    
    // Check for customerId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('customerId');
    if (customerId) {
      fetchCustomerById(customerId);
    }
  }, []);

  const fetchCustomerById = async (customerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/customers/${customerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const customer = data.customer;
        setSelectedCustomer(customer);
        setCustomerType("existing");
        setFormData((prev) => ({
          ...prev,
          customerName: customer.name,
          contactNumber: customer.contactNumber,
          alternateContact: customer.alternateContact || "",
          address: customer.address,
          email: customer.email || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error);
    }
  };

  const fetchConfiguration = async () => {
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
        setFormData((prev) => ({
          ...prev,
          defaultMakingRate: data.configuration.defaultMakingRate.toString(),
          defaultFittingRate: data.configuration.defaultFittingRate.toString(),
          defaultTrackRate: data.configuration.defaultTrackRate.toString(),
          defaultHookRate: data.configuration.defaultHookRate.toString(),
        }));
      }
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
    }
  };

  const fetchTailors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/tailors?activeOnly=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTailors(data.tailors);
      }
    } catch (error) {
      console.error("Failed to fetch tailors:", error);
    }
  };

  const fetchSalesPersons = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sales-persons?activeOnly=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSalesPersons(data.salesPersons);
      }
    } catch (error) {
      console.error("Failed to fetch sales persons:", error);
    }
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers);
      }
    } catch (error) {
      console.error("Failed to search customers:", error);
    }
  };

  const handleCustomerSearch = (value: string) => {
    setSearchQuery(value);
    searchCustomers(value);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setSearchQuery("");
    setFormData((prev) => ({
      ...prev,
      customerName: customer.name,
      contactNumber: customer.contactNumber,
      alternateContact: customer.alternateContact || "",
      address: customer.address,
      email: customer.email || "",
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Customer validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid 10-digit contact number";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    // Project validation
    if (!formData.projectType) {
      newErrors.projectType = "Project type is required";
    }
    if (!formData.salesPersonId) {
      newErrors.salesPersonId = "Sales person is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      const projectData = {
        customer: selectedCustomer
          ? { id: selectedCustomer._id }
          : {
              name: formData.customerName,
              contactNumber: formData.contactNumber,
              alternateContact: formData.alternateContact,
              address: formData.address,
              email: formData.email,
            },
        projectType: formData.projectType,
        salesPersonId: formData.salesPersonId,
        projectNotes: formData.projectNotes,
        tailorId: formData.tailorId || undefined,
        probableDeliveryDate: formData.probableDeliveryDate || undefined,
        defaultMakingRate: parseFloat(formData.defaultMakingRate),
        defaultFittingRate: parseFloat(formData.defaultFittingRate),
        defaultTrackRate: parseFloat(formData.defaultTrackRate),
        defaultHookRate: parseFloat(formData.defaultHookRate),
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to room management page for this project
        router.push(`/projects/${data.project._id}/rooms`);
      } else {
        setErrors({ general: data.error || "Failed to create project" });
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

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
            Create New Project
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill in the project details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {errors.general}
            </div>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Search for existing customer or add a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Type Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={customerType === "new" ? "default" : "outline"}
                  onClick={() => {
                    setCustomerType("new");
                    setSelectedCustomer(null);
                    setFormData((prev) => ({
                      ...prev,
                      customerName: "",
                      contactNumber: "",
                      alternateContact: "",
                      address: "",
                      email: "",
                    }));
                  }}
                >
                  New Customer
                </Button>
                <Button
                  type="button"
                  variant={customerType === "existing" ? "default" : "outline"}
                  onClick={() => setCustomerType("existing")}
                >
                  Existing Customer
                </Button>
              </div>

              {/* Search Existing Customer */}
              {customerType === "existing" && (
                <div className="relative space-y-2">
                  <Label>Search Customer</Label>
                  <Input
                    type="text"
                    placeholder="Search by name or contact number"
                    value={searchQuery}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <div
                          key={customer._id}
                          className="p-3 hover:bg-accent cursor-pointer"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.contactNumber} • {customer.address}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="bg-accent/50 p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Selected Customer
                      </Badge>
                      <div className="font-medium text-lg">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCustomer.contactNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCustomer.address}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setFormData((prev) => ({
                          ...prev,
                          customerName: "",
                          contactNumber: "",
                          alternateContact: "",
                          address: "",
                          email: "",
                        }));
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}

              {/* Customer Form Fields */}
              {(customerType === "new" || !selectedCustomer) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={handleChange}
                      className={
                        errors.customerName ? "border-destructive" : ""
                      }
                      placeholder="Enter customer name"
                    />
                    {errors.customerName && (
                      <p className="text-sm text-destructive">
                        {errors.customerName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number *</Label>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        type="tel"
                        required
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className={
                          errors.contactNumber ? "border-destructive" : ""
                        }
                        placeholder="10-digit number"
                      />
                      {errors.contactNumber && (
                        <p className="text-sm text-destructive">
                          {errors.contactNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alternateContact">
                        Alternate Contact
                      </Label>
                      <Input
                        id="alternateContact"
                        name="alternateContact"
                        type="tel"
                        value={formData.alternateContact}
                        onChange={handleChange}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className={errors.address ? "border-destructive" : ""}
                      placeholder="Enter complete address"
                      rows={3}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic project details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectType">Project Type *</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) =>
                      handleSelectChange("projectType", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.projectType ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1BHK">1 BHK</SelectItem>
                      <SelectItem value="2BHK">2 BHK</SelectItem>
                      <SelectItem value="3BHK">3 BHK</SelectItem>
                      <SelectItem value="4BHK">4 BHK</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.projectType && (
                    <p className="text-sm text-destructive">
                      {errors.projectType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesPersonId">Sales Person *</Label>
                  <Select
                    value={formData.salesPersonId}
                    onValueChange={(value) =>
                      handleSelectChange("salesPersonId", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.salesPersonId ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesPersons.map((salesPerson) => (
                        <SelectItem key={salesPerson._id} value={salesPerson._id}>
                          {salesPerson.name}
                          {salesPerson.territory && ` (${salesPerson.territory})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.salesPersonId && (
                    <p className="text-sm text-destructive">
                      {errors.salesPersonId}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tailorId">Tailor</Label>
                  <Select
                    value={formData.tailorId}
                    onValueChange={(value) =>
                      handleSelectChange("tailorId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tailor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tailors?.map((tailor) => (
                        <SelectItem key={tailor._id} value={tailor._id}>
                          {tailor.name}
                          {tailor.specialization && ` (${tailor.specialization})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probableDeliveryDate">Delivery Date</Label>
                  <Input
                    id="probableDeliveryDate"
                    name="probableDeliveryDate"
                    type="date"
                    value={formData.probableDeliveryDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectNotes">Project Notes</Label>
                <Textarea
                  id="projectNotes"
                  name="projectNotes"
                  value={formData.projectNotes}
                  onChange={handleChange}
                  placeholder="Any special instructions or notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Cost Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Default Cost Settings</CardTitle>
              <CardDescription>
                You can override these values per room/window later
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
                    value={formData.defaultMakingRate}
                    onChange={handleChange}
                    placeholder="180"
                  />
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
                    value={formData.defaultFittingRate}
                    onChange={handleChange}
                    placeholder="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTrackRate">Track Rate (₹/ft)</Label>
                  <Input
                    id="defaultTrackRate"
                    name="defaultTrackRate"
                    type="number"
                    step="0.01"
                    value={formData.defaultTrackRate}
                    onChange={handleChange}
                    placeholder="180"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultHookRate">Hook Rate (₹/unit)</Label>
                  <Input
                    id="defaultHookRate"
                    name="defaultHookRate"
                    type="number"
                    step="0.01"
                    value={formData.defaultHookRate}
                    onChange={handleChange}
                    placeholder="200"
                  />
                </div>
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
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Save & Add Rooms"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
