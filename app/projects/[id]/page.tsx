"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Customer {
  _id: string;
  name: string;
  contactNumber: string;
  address: string;
}

interface SalesPerson {
  _id: string;
  name: string;
  territory?: string;
}

interface Tailor {
  _id: string;
  name: string;
  specialization?: string;
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
  meters: number;
  fabricCostPerMeter: number;
  trackCount: number;
  hookCount: number;
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
    return Object.values(windows).reduce(
      (total, roomWindows) => total + roomWindows.length,
      0
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate project cost breakdown
  const calculateProjectCosts = () => {
    if (!project) return null;

    let totalMeters = 0;
    let totalPannas = 0;
    let totalTracks = 0;
    let totalHooks = 0;
    let fabricCost = 0;

    // Sum up all windows data
    Object.values(windows).forEach((roomWindows) => {
      roomWindows.forEach((window) => {
        totalMeters += window.meters || 0;
        totalPannas += window.pannaCount || 0;
        totalTracks += window.trackCount || 0;
        totalHooks += window.hookCount || 0;
        fabricCost += (window.meters || 0) * (window.fabricCostPerMeter || 0);
      });
    });

    const trackCost = totalTracks * (project.defaultTrackRate || 0);
    const makingCost = totalPannas * (project.defaultMakingRate || 0);
    const fittingCost = totalPannas * (project.defaultFittingRate || 0);
    const hookCost = totalHooks * (project.defaultHookRate || 0);
    const totalAmount =
      fabricCost + trackCost + makingCost + fittingCost + hookCost;

    return {
      totalMeters: totalMeters.toFixed(2),
      totalPannas,
      totalTracks,
      totalHooks,
      fabricCost: fabricCost.toFixed(2),
      trackCost: trackCost.toFixed(2),
      makingCost: makingCost.toFixed(2),
      fittingCost: fittingCost.toFixed(2),
      hookCost: hookCost.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    };
  };

  const generateWhatsAppMessage = () => {
    if (!project) return "";

    const costs = calculateProjectCosts();
    const totalAmount = costs ? parseFloat(costs.totalAmount) : 0;

    let message = `🏠 *Quotation Details - ${project.quotationNumber}*\n\n`;

    // Customer Information
    message += `👤 *Customer Information:*\n`;
    message += `• Name: ${project.customerId?.name || "N/A"}\n`;
    message += `• Contact: ${project.customerId?.contactNumber || "N/A"}\n`;
    message += `• Address: ${project.customerId?.address || "N/A"}\n\n`;

    // Project Details
    message += `📋 *Project Details:*\n`;
    message += `• Type: ${project.projectType}\n`;
    message += `• Sales Person: ${project.salesPersonId?.name || "N/A"}\n`;
    message += `• Tailor: ${project.tailorId?.name || "Not assigned"}\n`;
    message += `• Status: ${getStatusLabel(project.status)}\n\n`;

    // Rooms & Windows Summary
    message += `🏠 *Rooms & Windows:*\n`;
    message += `• Total Rooms: ${rooms.length}\n`;
    message += `• Total Windows: ${getTotalWindows()}\n\n`;

    if (rooms.length > 0) {
      message += `📝 *Room Details:*\n`;
      rooms.forEach((room, index) => {
        const roomWindows = windows[room._id] || [];
        message += `${index + 1}. ${room.roomType}\n`;
        message += `   Windows: ${roomWindows.length}\n`;
        if (room.notes) {
          message += `   Notes: ${room.notes}\n`;
        }
        message += `\n`;
      });
    }

    // Cost Breakdown
    if (costs && totalAmount > 0) {
      message += `💰 *Cost Breakdown:*\n`;
      message += `• Fabric Cost: ${formatCurrency(
        parseFloat(costs.fabricCost)
      )}\n`;
      message += `• Track Cost: ${formatCurrency(
        parseFloat(costs.trackCost)
      )}\n`;
      message += `• Making Cost: ${formatCurrency(
        parseFloat(costs.makingCost)
      )}\n`;
      message += `• Fitting Cost: ${formatCurrency(
        parseFloat(costs.fittingCost)
      )}\n`;
      message += `• Hook Cost: ${formatCurrency(parseFloat(costs.hookCost))}\n`;
      message += `\n*Total Amount: ${formatCurrency(totalAmount)}*\n\n`;
    }

    // Delivery Information
    if (project.probableDeliveryDate) {
      message += `📅 *Probable Delivery:* ${formatDate(
        project.probableDeliveryDate
      )}\n\n`;
    }

    message += `📞 *Contact Us:*\n`;
    message += `For any queries or modifications, please contact us.\n\n`;
    message += `Thank you for choosing our services! 🙏`;

    return message;
  };

  const handleWhatsAppShare = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${project?.customerId?.contactNumber?.replace(
      /^\+/,
      ""
    )}?text=${encodedMessage}`;

    // Open WhatsApp in a new tab
    window.open(whatsappUrl, "_blank");
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
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Project Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The project you're looking for doesn't exist.
            </p>
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
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Customer Name
                    </h4>
                    <p className="text-lg">
                      {project.customerId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Contact Number
                    </h4>
                    <p className="text-lg">
                      {project.customerId?.contactNumber || "N/A"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Address
                    </h4>
                    <p className="text-lg">
                      {project.customerId?.address || "N/A"}
                    </p>
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
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Sales Person
                    </h4>
                    <p className="text-lg">
                      {project.salesPersonId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Tailor
                    </h4>
                    <p className="text-lg">
                      {project.tailorId?.name || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Probable Delivery
                    </h4>
                    <p className="text-lg">
                      {project.probableDeliveryDate
                        ? formatDate(project.probableDeliveryDate)
                        : "Not set"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">
                      Last Updated
                    </h4>
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
                    <p className="text-muted-foreground mb-4">
                      No rooms added yet
                    </p>
                    <Button
                      onClick={() =>
                        router.push(`/projects/${projectId}/rooms`)
                      }
                    >
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
                            <p className="text-sm text-muted-foreground">
                              {room.roomType}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {windows[room._id]?.length || 0} windows
                          </Badge>
                        </div>
                        {room.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {room.notes}
                          </p>
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
            {/* Cost Breakdown */}
            {(() => {
              const costs = calculateProjectCosts();
              if (!costs || getTotalWindows() === 0) return null;

              return (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Project Cost Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary Stats - 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          Meters
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {costs.totalMeters}m
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          Pannas
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {costs.totalPannas}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          Tracks
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {costs.totalTracks}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          Hooks
                        </div>
                        <div className="text-2xl font-bold text-orange-600">
                          {costs.totalHooks}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Cost Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="font-medium">Fabric Cost:</span>
                        <span className="font-bold">₹{costs.fabricCost}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="font-medium">Track Cost:</span>
                        <span className="font-bold">₹{costs.trackCost}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="font-medium">Making Cost:</span>
                        <span className="font-bold">₹{costs.makingCost}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="font-medium">Fitting Cost:</span>
                        <span className="font-bold">₹{costs.fittingCost}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-white/50 rounded">
                        <span className="font-medium">Hook Cost:</span>
                        <span className="font-bold">₹{costs.hookCost}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Total */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total Amount</span>
                        <span className="text-3xl font-bold">
                          ₹{costs.totalAmount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {rooms.length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Rooms
                    </div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-3xl font-bold text-indigo-600">
                      {getTotalWindows()}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Windows
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Project Actions</CardTitle>
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
                  onClick={handleWhatsAppShare}
                  disabled={!project?.customerId?.contactNumber}
                >
                  Share WhatsApp
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  Generate PDF (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
