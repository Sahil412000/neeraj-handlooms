"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Customer {
  _id: string;
  name: string;
  contactNumber: string;
  address: string;
}

interface Project {
  _id: string;
  quotationNumber: string;
  customerId: Customer;
  projectType: string;
  salesPerson: string;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  tailorName?: string;
  probableDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  _id: string;
  roomName: string;
  roomType: string;
  notes?: string;
  createdAt: string;
}

interface Window {
  _id: string;
  windowNumber: number;
  style: string;
  width: number;
  height: number;
  pannaCount: number;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [windows, setWindows] = useState<{ [roomId: string]: Window[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
        setRooms(projectData.rooms || []);
        
        // Set windows data
        const windowsData: { [roomId: string]: Window[] } = {};
        if (projectData.rooms) {
          for (const room of projectData.rooms) {
            if (room.windows) {
              windowsData[room._id] = room.windows;
            }
          }
        }
        setWindows(windowsData);
      }
    } catch (error) {
      console.error("Error fetching project details:", error);
    } finally {
      setIsLoading(false);
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

  const getTotalWindows = () => {
    return Object.values(windows).reduce((total, roomWindows) => total + roomWindows.length, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
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
                {project.quotationNumber}
              </h1>
              <p className="text-muted-foreground mt-1">
                {project.projectType} • Created {formatDate(project.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={getStatusColor(project.status)}
              >
                {getStatusLabel(project.status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Customer Name</h4>
                    <p className="text-lg">{project.customerId?.name || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Contact Number</h4>
                    <p className="text-lg">{project.customerId?.contactNumber || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">Address</h4>
                    <p className="text-lg">{project.customerId?.address || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Sales Person</h4>
                    <p className="text-lg">{project.salesPerson}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Tailor</h4>
                    <p className="text-lg">{project.tailorName || "Not assigned"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Probable Delivery</h4>
                    <p className="text-lg">
                      {project.probableDeliveryDate 
                        ? formatDate(project.probableDeliveryDate)
                        : "Not set"
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Last Updated</h4>
                    <p className="text-lg">{formatDate(project.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rooms & Windows */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Rooms & Windows</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/projects/${projectId}/rooms`)}
                  >
                    Manage Rooms
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No rooms added yet</p>
                    <Button onClick={() => router.push(`/projects/${projectId}/rooms`)}>
                      Add First Room
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div key={room._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{room.roomName}</h4>
                            <p className="text-sm text-muted-foreground">{room.roomType}</p>
                          </div>
                          <Badge variant="secondary">
                            {windows[room._id]?.length || 0} windows
                          </Badge>
                        </div>
                        {room.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{room.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{rooms.length}</div>
                  <div className="text-sm text-muted-foreground">Total Rooms</div>
                </div>
                <Separator />
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{getTotalWindows()}</div>
                  <div className="text-sm text-muted-foreground">Total Windows</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => router.push(`/projects/${projectId}/rooms`)}
                >
                  Manage Rooms
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/projects")}
                >
                  View All Projects
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/customers")}
                >
                  View Customers
                </Button>
              </CardContent>
            </Card>

            {/* Project Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Project Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled
                >
                  Generate PDF (Coming Soon)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled
                >
                  Share WhatsApp (Coming Soon)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled
                >
                  Update Status (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

