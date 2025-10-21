"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Customer {
  _id: string;
  name: string;
  contactNumber: string;
  alternateContact?: string;
  address: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    contactNumber: "",
    alternateContact: "",
    address: "",
    email: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(customerForm),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(prev => [...prev, data.customer]);
        setCustomerForm({
          name: "",
          contactNumber: "",
          alternateContact: "",
          address: "",
          email: "",
        });
        setIsCreateModalOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create customer");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.contactNumber.includes(searchQuery) ||
      customer.address.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Customer Management
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage all your customers
              </p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>Add Customer</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Add a new customer to your database
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateCustomer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name *</Label>
                    <Input
                      id="customerName"
                      name="name"
                      value={customerForm.name}
                      onChange={handleFormChange}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerContact">Contact Number *</Label>
                    <Input
                      id="customerContact"
                      name="contactNumber"
                      value={customerForm.contactNumber}
                      onChange={handleFormChange}
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAlternateContact">Alternate Contact</Label>
                    <Input
                      id="customerAlternateContact"
                      name="alternateContact"
                      value={customerForm.alternateContact}
                      onChange={handleFormChange}
                      placeholder="Optional alternate number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Address *</Label>
                    <Textarea
                      id="customerAddress"
                      name="address"
                      value={customerForm.address}
                      onChange={handleFormChange}
                      placeholder="Enter complete address"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      name="email"
                      type="email"
                      value={customerForm.email}
                      onChange={handleFormChange}
                      placeholder="Optional email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating} className="flex-1">
                      {isCreating ? "Adding..." : "Add Customer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="mb-6">
          <div className="flex gap-4 items-center mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search customers by name, contact, address, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredCustomers.length} of {customers.length} customers
            </Badge>
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              {customers.length === 0 
                ? "No customers yet. Add your first customer to get started!"
                : `Showing ${filteredCustomers.length} customers`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No customers yet. Add your first customer to get started!
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Add Your First Customer
                </Button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No customers found matching your search.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Alternate Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{customer.contactNumber}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`tel:${customer.contactNumber}`)}
                            >
                              📞
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://wa.me/91${customer.contactNumber}`)}
                            >
                              💬
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.alternateContact ? (
                            <div className="flex items-center gap-2">
                              <span>{customer.alternateContact}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${customer.alternateContact}`)}
                              >
                                📞
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {customer.address}
                        </TableCell>
                        <TableCell>
                          {customer.email ? (
                            <a 
                              href={`mailto:${customer.email}`}
                              className="text-blue-600 hover:underline"
                            >
                              {customer.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/projects/create?customerId=${customer._id}`)}
                            >
                              New Project
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
