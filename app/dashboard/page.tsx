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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  role: string;
}

interface Customer {
  _id: string;
  name: string;
  contactNumber: string;
  address: string;
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

interface Project {
  _id: string;
  quotationNumber: string;
  customerId: Customer;
  projectType: string;
  salesPersonId: SalesPerson;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  tailorId?: Tailor;
  probableDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  defaultMakingRate?: number;
  defaultFittingRate?: number;
  defaultTrackRate?: number;
  defaultHookRate?: number;
}

interface Window {
  _id: string;
  windowNumber: number;
  style: string;
  width: number;
  height: number;
  pannaCount: number;
  meters: number;
  fabricCostPerMeter: number;
  trackCount: number;
  hookCount: number;
}

interface Room {
  _id: string;
  projectId: string;
  roomType: string;
  windows?: Window[];
}

interface ProjectStats {
  total: number;
  draft: number;
  quotationSent: number;
  confirmed: number;
  completed: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectRooms, setProjectRooms] = useState<{
    [projectId: string]: Room[];
  }>({});
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    draft: 0,
    quotationSent: 0,
    confirmed: 0,
    completed: 0,
  });

  // Modal states
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);
  const [isSalesPersonModalOpen, setIsSalesPersonModalOpen] = useState(false);
  const [isCreatingTailor, setIsCreatingTailor] = useState(false);
  const [isCreatingSalesPerson, setIsCreatingSalesPerson] = useState(false);

  // Form states
  const [tailorForm, setTailorForm] = useState({
    name: "",
    contactNumber: "",
    alternateContact: "",
    specialization: "",
    address: "",
  });

  const [salesPersonForm, setSalesPersonForm] = useState({
    name: "",
    contactNumber: "",
    alternateContact: "",
    territory: "",
    email: "",
  });

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    // Fetch projects, tailors, and sales persons
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectsResponse, tailorsResponse, salesPersonsResponse] =
          await Promise.all([
            fetch("/api/projects", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/tailors", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/sales-persons", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        if (projectsResponse.ok) {
          const data = await projectsResponse.json();
          setProjects(data.projects);

          // Calculate stats
          const projectStats = data.projects.reduce(
            (acc: ProjectStats, project: Project) => {
              acc.total++;
              if (project.status === "draft") acc.draft++;
              else if (project.status === "quotation_sent") acc.quotationSent++;
              else if (project.status === "confirmed") acc.confirmed++;
              else if (project.status === "completed") acc.completed++;
              return acc;
            },
            { total: 0, draft: 0, quotationSent: 0, confirmed: 0, completed: 0 }
          );
          setStats(projectStats);

          // Fetch rooms and windows for each project
          const roomsData: { [projectId: string]: Room[] } = {};
          for (const project of data.projects.slice(0, 5)) {
            try {
              const projectDetailResponse = await fetch(
                `/api/projects/${project._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (projectDetailResponse.ok) {
                const projectDetail = await projectDetailResponse.json();
                if (projectDetail.rooms) {
                  roomsData[project._id] = projectDetail.rooms;
                }
              }
            } catch (error) {
              console.error(
                `Failed to fetch rooms for project ${project._id}:`,
                error
              );
            }
          }
          setProjectRooms(roomsData);
        }

        if (tailorsResponse.ok) {
          const data = await tailorsResponse.json();
          setTailors(data.tailors);
        }

        if (salesPersonsResponse.ok) {
          const data = await salesPersonsResponse.json();
          setSalesPersons(data.salesPersons);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleTailorFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTailorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalesPersonFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSalesPersonForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTailor(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/tailors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tailorForm),
      });

      if (response.ok) {
        const data = await response.json();
        setTailors((prev) => [...prev, data.tailor]);
        setTailorForm({
          name: "",
          contactNumber: "",
          alternateContact: "",
          specialization: "",
          address: "",
        });
        setIsTailorModalOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create tailor");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsCreatingTailor(false);
    }
  };

  const handleCreateSalesPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSalesPerson(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/sales-persons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(salesPersonForm),
      });

      if (response.ok) {
        const data = await response.json();
        setSalesPersons((prev) => [...prev, data.salesPerson]);
        setSalesPersonForm({
          name: "",
          contactNumber: "",
          alternateContact: "",
          territory: "",
          email: "",
        });
        setIsSalesPersonModalOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create sales person");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsCreatingSalesPerson(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "quotation_sent":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "quotation_sent":
        return "Quotation Sent";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate project total from windows
  const calculateProjectTotal = (project: Project): number => {
    const rooms = projectRooms[project._id];
    if (!rooms || rooms.length === 0) return 0;

    let totalCost = 0;

    rooms.forEach((room) => {
      if (room.windows) {
        room.windows.forEach((window) => {
          const fabricCost =
            (window.meters || 0) * (window.fabricCostPerMeter || 0);
          const trackCost =
            (window.trackCount || 0) * (project.defaultTrackRate || 0);
          const makingCost =
            (window.pannaCount || 0) * (project.defaultMakingRate || 0);
          const fittingCost =
            (window.pannaCount || 0) * (project.defaultFittingRate || 0);
          const hookCost =
            (window.hookCount || 0) * (project.defaultHookRate || 0);

          totalCost +=
            fabricCost + trackCost + makingCost + fittingCost + hookCost;
        });
      }
    });

    return totalCost;
  };

  // Calculate total windows in a project
  const getTotalWindows = (projectId: string): number => {
    const rooms = projectRooms[projectId];
    if (!rooms) return 0;
    return rooms.reduce(
      (total, room) => total + (room.windows?.length || 0),
      0
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user?.businessName || "Furnish Dashboard"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user?.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {user?.role}
              </Badge>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Projects
                </CardTitle>
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.draft + stats.confirmed}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.draft + stats.confirmed === 0
                    ? "No active projects yet"
                    : `${stats.draft} draft, ${stats.confirmed} confirmed`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Quotations
                </CardTitle>
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.draft + stats.quotationSent}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.draft + stats.quotationSent === 0
                    ? "Ready to create your first quote"
                    : `${stats.quotationSent} sent, ${stats.draft} pending`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Projects
                </CardTitle>
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">✓</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completed === 0
                    ? "Complete your first project"
                    : `${stats.total} total projects`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your furnishing business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  className="h-auto py-4"
                  variant="default"
                  onClick={() => router.push("/projects/create")}
                >
                  Create New Project
                </Button>
                <Button
                  className="h-auto py-4"
                  variant="secondary"
                  onClick={() => router.push("/projects")}
                >
                  View All Projects
                </Button>
                <Button
                  className="h-auto py-4"
                  variant="outline"
                  onClick={() => router.push("/customers")}
                >
                  View Customers
                </Button>
              </div>

              {/* Team Management */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Team Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Dialog
                    open={isTailorModalOpen}
                    onOpenChange={setIsTailorModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="h-auto py-4" variant="outline">
                        <div className="text-center">
                          <div className="font-semibold">Add Tailor</div>
                          <div className="text-sm text-muted-foreground">
                            {tailors.length} tailors registered
                          </div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Tailor</DialogTitle>
                        <DialogDescription>
                          Add a new tailor to your team
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateTailor} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="tailorName">Name *</Label>
                          <Input
                            id="tailorName"
                            name="name"
                            value={tailorForm.name}
                            onChange={handleTailorFormChange}
                            placeholder="Enter tailor name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tailorContact">
                            Contact Number *
                          </Label>
                          <Input
                            id="tailorContact"
                            name="contactNumber"
                            value={tailorForm.contactNumber}
                            onChange={handleTailorFormChange}
                            placeholder="10-digit number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tailorSpecialization">
                            Specialization
                          </Label>
                          <Input
                            id="tailorSpecialization"
                            name="specialization"
                            value={tailorForm.specialization}
                            onChange={handleTailorFormChange}
                            placeholder="e.g., Curtains, Blinds"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tailorAddress">Address</Label>
                          <Textarea
                            id="tailorAddress"
                            name="address"
                            value={tailorForm.address}
                            onChange={handleTailorFormChange}
                            placeholder="Optional address"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTailorModalOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isCreatingTailor}
                            className="flex-1"
                          >
                            {isCreatingTailor ? "Adding..." : "Add Tailor"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isSalesPersonModalOpen}
                    onOpenChange={setIsSalesPersonModalOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="h-auto py-4" variant="outline">
                        <div className="text-center">
                          <div className="font-semibold">Add Sales Person</div>
                          <div className="text-sm text-muted-foreground">
                            {salesPersons.length} sales persons registered
                          </div>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Sales Person</DialogTitle>
                        <DialogDescription>
                          Add a new sales person to your team
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handleCreateSalesPerson}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="salesPersonName">Name *</Label>
                          <Input
                            id="salesPersonName"
                            name="name"
                            value={salesPersonForm.name}
                            onChange={handleSalesPersonFormChange}
                            placeholder="Enter sales person name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salesPersonContact">
                            Contact Number *
                          </Label>
                          <Input
                            id="salesPersonContact"
                            name="contactNumber"
                            value={salesPersonForm.contactNumber}
                            onChange={handleSalesPersonFormChange}
                            placeholder="10-digit number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salesPersonTerritory">
                            Territory
                          </Label>
                          <Input
                            id="salesPersonTerritory"
                            name="territory"
                            value={salesPersonForm.territory}
                            onChange={handleSalesPersonFormChange}
                            placeholder="e.g., North Delhi, South Mumbai"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salesPersonEmail">Email</Label>
                          <Input
                            id="salesPersonEmail"
                            name="email"
                            type="email"
                            value={salesPersonForm.email}
                            onChange={handleSalesPersonFormChange}
                            placeholder="Optional email"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsSalesPersonModalOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isCreatingSalesPerson}
                            className="flex-1"
                          >
                            {isCreatingSalesPerson
                              ? "Adding..."
                              : "Add Sales Person"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    Your most recent furnishing projects
                  </CardDescription>
                </div>
                {projects.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/projects")}
                  >
                    View All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No projects yet. Create your first project to get started!
                  </p>
                  <Button
                    className="mt-4"
                    variant="default"
                    onClick={() => router.push("/projects/create")}
                  >
                    Create Your First Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => {
                    const calculatedTotal = calculateProjectTotal(project);
                    const totalWindows = getTotalWindows(project._id);
                    const totalRooms = projectRooms[project._id]?.length || 0;

                    return (
                      <div
                        key={project._id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/projects/${project._id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {project.quotationNumber}
                              </h3>
                              <Badge
                                variant="outline"
                                className={getStatusColor(project.status)}
                              >
                                {getStatusLabel(project.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Customer:</span>{" "}
                                {project.customerId?.name || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">Contact:</span>{" "}
                                {project.customerId?.contactNumber || "N/A"}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Project Type:
                                </span>{" "}
                                {project.projectType}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Sales Person:
                                </span>{" "}
                                {project.salesPersonId?.name || "N/A"}
                              </div>
                              {project.tailorId && (
                                <div>
                                  <span className="font-medium">Tailor:</span>{" "}
                                  {project.tailorId.name}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Created:</span>{" "}
                                {formatDate(project.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-bold text-lg text-green-600">
                              {formatCurrency(calculatedTotal)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>
                                {totalRooms} Room{totalRooms !== 1 ? "s" : ""}
                              </div>
                              <div>
                                {totalWindows} Window
                                {totalWindows !== 1 ? "s" : ""}
                              </div>
                            </div>
                            {calculatedTotal === 0 && totalRooms === 0 && (
                              <div className="text-xs text-orange-600 mt-2">
                                No rooms added yet
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {projects.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/projects")}
                    >
                      View All {projects.length} Projects
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
