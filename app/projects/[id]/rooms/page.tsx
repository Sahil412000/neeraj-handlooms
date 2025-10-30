"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Room {
  _id: string;
  roomName: string;
  roomType: string;
  totalMeters: number;
  trackLength: number;
  trackCost: number;
  makingCharges: number;
  fittingCharges: number;
  hookCharges: number;
  roomTotal: number;
  notes?: string;
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

interface Project {
  _id: string;
  quotationNumber: string;
  projectType: string;
  totalAmount: number;
  defaultMakingRate: number;
  defaultFittingRate: number;
  defaultTrackRate: number;
  defaultHookRate: number;
}

export default function RoomManagementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [windows, setWindows] = useState<{ [roomId: string]: Window[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isAddingWindow, setIsAddingWindow] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showWindowDialog, setShowWindowDialog] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomType: "",
    notes: "",
  });

  const [windowForm, setWindowForm] = useState({
    style: "",
    width: "",
    height: "",
    pannaCount: 0,
    meters: 0,
    fabricCostPerMeter: "",
    trackCount: 1,
    hookCount: "",
  });

  // Auto-calculate panna count based on width (1 panna per 20 inches)
  const calculatePannaCount = (width: string) => {
    if (!width || parseFloat(width) <= 0) return 0;
    return Math.ceil(parseFloat(width) / 20);
  };

  // Calculate meters based on formula: (width + height) / 24
  const calculateMeters = (width: string, height: string) => {
    if (!width || !height || parseFloat(width) <= 0 || parseFloat(height) <= 0)
      return 0;
    const meters = (parseFloat(width) + parseFloat(height)) / 24;
    return Math.round(meters * 100) / 100; // Round to 2 decimal places
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProjectAndRooms();
  }, [projectId]);

  const fetchProjectAndRooms = async () => {
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
      }

      // Fetch rooms
      const roomsResponse = await fetch(`/api/rooms?projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms);

        // Fetch windows for each room
        for (const room of roomsData.rooms) {
          fetchWindowsForRoom(room._id);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWindowsForRoom = async (roomId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/windows?roomId=${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Fetched ${data.windows.length} windows for room ${roomId}`
        );
        setWindows((prev) => ({ ...prev, [roomId]: data.windows }));
      } else {
        console.error("Failed to fetch windows:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching windows:", error);
    }
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!roomForm.roomType) newErrors.roomType = "Room type is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsAddingRoom(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          roomName: roomForm.roomType, // Use roomType as roomName
          ...roomForm,
        }),
      });

      if (response.ok) {
        setShowRoomDialog(false);
        setRoomForm({ roomType: "", notes: "" });
        setErrors({});
        fetchProjectAndRooms();
      } else {
        const data = await response.json();
        setErrors({ general: data.error });
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsAddingRoom(false);
    }
  };

  const handleWindowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!windowForm.style.trim()) newErrors.style = "Style is required";
    if (!windowForm.width) newErrors.width = "Width is required";
    if (!windowForm.height) newErrors.height = "Height is required";
    if (!windowForm.fabricCostPerMeter)
      newErrors.fabricCostPerMeter = "Fabric cost per meter is required";
    if (!windowForm.hookCount) newErrors.hookCount = "Hook count is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsAddingWindow(true);
    try {
      const token = localStorage.getItem("token");

      // Calculate values
      const pannaCount = calculatePannaCount(windowForm.width);
      const meters = calculateMeters(windowForm.width, windowForm.height);
      const windowNumber = (windows[selectedRoomId!]?.length || 0) + 1;

      const response = await fetch("/api/windows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoomId,
          projectId,
          windowNumber,
          style: windowForm.style,
          width: parseFloat(windowForm.width),
          height: parseFloat(windowForm.height),
          pannaCount,
          meters,
          fabricCostPerMeter: parseFloat(windowForm.fabricCostPerMeter),
          trackCount: windowForm.trackCount,
          hookCount: parseInt(windowForm.hookCount),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Window added successfully:", data.window);

        // Immediately fetch windows for this specific room
        await fetchWindowsForRoom(selectedRoomId!);

        setShowWindowDialog(false);
        setWindowForm({
          style: "",
          width: "",
          height: "",
          pannaCount: 0,
          meters: 0,
          fabricCostPerMeter: "",
          trackCount: 1,
          hookCount: "",
        });
        setErrors({});

        // Refresh all data to get updated room totals
        fetchProjectAndRooms();
      } else {
        const data = await response.json();
        console.error("Error adding window:", data.error);
        setErrors({ general: data.error });
      }
    } catch (error) {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsAddingWindow(false);
    }
  };

  const openAddWindowDialog = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowWindowDialog(true);
  };

  // Calculate individual window cost
  const calculateWindowCost = (window: Window) => {
    if (!project) return 0;

    const fabricCost = (window.meters || 0) * (window.fabricCostPerMeter || 0);
    const trackCost =
      (window.trackCount || 0) * (project.defaultTrackRate || 0);
    const makingCost =
      (window.pannaCount || 0) * (project.defaultMakingRate || 0);
    const fittingCost =
      (window.pannaCount || 0) * (project.defaultFittingRate || 0);
    const hookCost = (window.hookCount || 0) * (project.defaultHookRate || 0);

    return fabricCost + trackCost + makingCost + fittingCost + hookCost;
  };

  // Calculate project totals
  const calculateProjectTotals = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
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
                Room Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Add rooms and windows for your project
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Rooms</div>
              <div className="text-2xl font-bold">{rooms.length}</div>
            </div>
          </div>
        </div>

        {/* Add Room Button */}
        <div className="mb-6">
          <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
            <DialogTrigger asChild>
              <Button>+ Add New Room</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>
                  Create a new room for this project
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRoomSubmit} className="space-y-4">
                {errors.general && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select
                    value={roomForm.roomType}
                    onValueChange={(value) =>
                      setRoomForm({ ...roomForm, roomType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Living Room">Living Room</SelectItem>
                      <SelectItem value="Bedroom">Bedroom</SelectItem>
                      <SelectItem value="Master Bedroom">
                        Master Bedroom
                      </SelectItem>
                      <SelectItem value="Kitchen">Kitchen</SelectItem>
                      <SelectItem value="Dining">Dining</SelectItem>
                      <SelectItem value="Study">Study</SelectItem>
                      <SelectItem value="Balcony">Balcony</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.roomType && (
                    <p className="text-sm text-destructive">
                      {errors.roomType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomNotes">Notes</Label>
                  <Textarea
                    id="roomNotes"
                    value={roomForm.notes}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, notes: e.target.value })
                    }
                    placeholder="Any special notes"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRoomDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isAddingRoom}
                    className="flex-1"
                  >
                    {isAddingRoom ? "Adding..." : "Add Room"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms List */}
        {rooms.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  No rooms added yet. Add your first room to get started!
                </p>
                <Button onClick={() => setShowRoomDialog(true)}>
                  Add First Room
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {rooms.map((room) => (
              <Card key={room._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {room.roomName}
                        <Badge variant="secondary">{room.roomType}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {windows[room._id]?.length || 0} window(s)
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openAddWindowDialog(room._id)}
                    >
                      + Add Window
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Windows Table */}
                  {windows[room._id] && windows[room._id].length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left p-2">#</th>
                              <th className="text-left p-2">Style</th>
                              <th className="text-left p-2">Width</th>
                              <th className="text-left p-2">Height</th>
                              <th className="text-left p-2">Panna</th>
                              <th className="text-left p-2">Meters</th>
                              <th className="text-left p-2">Fabric/m</th>
                              <th className="text-left p-2">Tracks</th>
                              <th className="text-left p-2">Hooks</th>
                              <th className="text-right p-2 font-semibold">
                                Window Cost
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {windows[room._id].map((window) => {
                              const windowCost = calculateWindowCost(window);
                              const fabricCost =
                                (window.meters || 0) *
                                (window.fabricCostPerMeter || 0);
                              const trackCost =
                                (window.trackCount || 0) *
                                (project?.defaultTrackRate || 0);
                              const makingCost =
                                (window.pannaCount || 0) *
                                (project?.defaultMakingRate || 0);
                              const fittingCost =
                                (window.pannaCount || 0) *
                                (project?.defaultFittingRate || 0);
                              const hookCost =
                                (window.hookCount || 0) *
                                (project?.defaultHookRate || 0);

                              return (
                                <tr
                                  key={window._id}
                                  className="border-b hover:bg-muted/30 transition-colors"
                                >
                                  <td className="p-2">{window.windowNumber}</td>
                                  <td className="p-2">{window.style}</td>
                                  <td className="p-2">{window.width}"</td>
                                  <td className="p-2">{window.height}"</td>
                                  <td className="p-2">{window.pannaCount}</td>
                                  <td className="p-2">{window.meters}</td>
                                  <td className="p-2">
                                    ₹{window.fabricCostPerMeter}
                                  </td>
                                  <td className="p-2">{window.trackCount}</td>
                                  <td className="p-2">{window.hookCount}</td>
                                  <td className="p-2 text-right">
                                    <div className="text-xs text-muted-foreground space-y-0.5">
                                      <div>
                                        Fabric: ₹{fabricCost.toFixed(2)}{" "}
                                        <span className="text-[10px]">
                                          ({window.meters}m × ₹
                                          {window.fabricCostPerMeter}/m)
                                        </span>
                                      </div>
                                      <div>
                                        Track: ₹{trackCost.toFixed(2)}{" "}
                                        <span className="text-[10px]">
                                          ({window.trackCount} × ₹
                                          {project?.defaultTrackRate})
                                        </span>
                                      </div>
                                      <div>
                                        Making: ₹{makingCost.toFixed(2)}{" "}
                                        <span className="text-[10px]">
                                          ({window.pannaCount} × ₹
                                          {project?.defaultMakingRate})
                                        </span>
                                      </div>
                                      <div>
                                        Fitting: ₹{fittingCost.toFixed(2)}{" "}
                                        <span className="text-[10px]">
                                          ({window.pannaCount} × ₹
                                          {project?.defaultFittingRate})
                                        </span>
                                      </div>
                                      <div>
                                        Hook: ₹{hookCost.toFixed(2)}{" "}
                                        <span className="text-[10px]">
                                          ({window.hookCount} × ₹
                                          {project?.defaultHookRate})
                                        </span>
                                      </div>
                                      <div className="border-t pt-1 mt-1 font-bold text-green-600 text-sm">
                                        Total: ₹{windowCost.toFixed(2)}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Room Total Row */}
                            <tr className="border-t-2 bg-blue-50 font-semibold">
                              <td colSpan={9} className="p-2 text-right">
                                Room Total:
                              </td>
                              <td className="p-2 text-right text-blue-600 font-bold">
                                ₹
                                {windows[room._id]
                                  .reduce(
                                    (sum, window) =>
                                      sum + calculateWindowCost(window),
                                    0
                                  )
                                  .toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No windows added yet. Click "Add Window" to start.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Window Dialog */}
        <Dialog open={showWindowDialog} onOpenChange={setShowWindowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Window</DialogTitle>
              <DialogDescription>
                Add window details for this room
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleWindowSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style">Style *</Label>
                  <Input
                    id="style"
                    value={windowForm.style}
                    onChange={(e) =>
                      setWindowForm({ ...windowForm, style: e.target.value })
                    }
                    placeholder="e.g., AP, EP"
                  />
                  {errors.style && (
                    <p className="text-sm text-destructive">{errors.style}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Width (inches) *</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={windowForm.width}
                    onChange={(e) => {
                      const newWidth = e.target.value;
                      const newHeight = windowForm.height;
                      setWindowForm({
                        ...windowForm,
                        width: newWidth,
                        pannaCount: calculatePannaCount(newWidth),
                        meters: calculateMeters(newWidth, newHeight),
                      });
                    }}
                    placeholder="146"
                  />
                  {errors.width && (
                    <p className="text-sm text-destructive">{errors.width}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (inches) *</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={windowForm.height}
                    onChange={(e) => {
                      const newHeight = e.target.value;
                      const newWidth = windowForm.width;
                      setWindowForm({
                        ...windowForm,
                        height: newHeight,
                        meters: calculateMeters(newWidth, newHeight),
                      });
                    }}
                    placeholder="90"
                  />
                  {errors.height && (
                    <p className="text-sm text-destructive">{errors.height}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pannaCount">Panna Count (Auto)</Label>
                  <Input
                    id="pannaCount"
                    type="number"
                    value={windowForm.pannaCount}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto-calculated"
                  />
                  <p className="text-xs text-muted-foreground">
                    1 panna per 20"
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meters">Meters (Auto)</Label>
                  <Input
                    id="meters"
                    type="number"
                    step="0.01"
                    value={windowForm.meters}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto-calculated"
                  />
                  <p className="text-xs text-muted-foreground">(W+H) / 24</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fabricCostPerMeter">
                    Fabric Cost/Meter (₹) *
                  </Label>
                  <Input
                    id="fabricCostPerMeter"
                    type="number"
                    step="0.01"
                    value={windowForm.fabricCostPerMeter}
                    onChange={(e) =>
                      setWindowForm({
                        ...windowForm,
                        fabricCostPerMeter: e.target.value,
                      })
                    }
                    placeholder="500"
                  />
                  {errors.fabricCostPerMeter && (
                    <p className="text-sm text-destructive">
                      {errors.fabricCostPerMeter}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trackCount">Track Count</Label>
                  <Input
                    id="trackCount"
                    type="number"
                    min="1"
                    value={windowForm.trackCount}
                    onChange={(e) =>
                      setWindowForm({
                        ...windowForm,
                        trackCount: parseInt(e.target.value) || 1,
                      })
                    }
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hookCount">Hook Count *</Label>
                  <Input
                    id="hookCount"
                    type="number"
                    min="0"
                    value={windowForm.hookCount}
                    onChange={(e) =>
                      setWindowForm({
                        ...windowForm,
                        hookCount: e.target.value,
                      })
                    }
                    placeholder="20"
                  />
                  {errors.hookCount && (
                    <p className="text-sm text-destructive">
                      {errors.hookCount}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWindowDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingWindow}
                  className="flex-1"
                >
                  {isAddingWindow ? "Adding..." : "Add Window"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Total Calculations */}
        {rooms.length > 0 &&
          Object.keys(windows).some((roomId) => windows[roomId]?.length > 0) &&
          project && (
            <Card className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-2xl">Project Cost Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totals = calculateProjectTotals();
                  if (!totals) return null;

                  return (
                    <div className="space-y-6">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-muted-foreground">
                            Total Meters
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {totals.totalMeters} m
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-muted-foreground">
                            Total Pannas
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {totals.totalPannas}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-muted-foreground">
                            Total Tracks
                          </div>
                          <div className="text-2xl font-bold text-purple-600">
                            {totals.totalTracks}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-sm text-muted-foreground">
                            Total Hooks
                          </div>
                          <div className="text-2xl font-bold text-orange-600">
                            {totals.totalHooks}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Cost Breakdown */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">
                          Cost Breakdown
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="font-medium">
                              Fabric Cost ({totals.totalMeters} m × avg rate)
                            </span>
                            <span className="text-lg font-semibold">
                              ₹{totals.fabricCost}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="font-medium">
                              Track Cost ({totals.totalTracks} × ₹
                              {project.defaultTrackRate})
                            </span>
                            <span className="text-lg font-semibold">
                              ₹{totals.trackCost}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="font-medium">
                              Making Cost ({totals.totalPannas} × ₹
                              {project.defaultMakingRate})
                            </span>
                            <span className="text-lg font-semibold">
                              ₹{totals.makingCost}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="font-medium">
                              Fitting Cost ({totals.totalPannas} × ₹
                              {project.defaultFittingRate})
                            </span>
                            <span className="text-lg font-semibold">
                              ₹{totals.fittingCost}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="font-medium">
                              Hook Cost ({totals.totalHooks} × ₹
                              {project.defaultHookRate})
                            </span>
                            <span className="text-lg font-semibold">
                              ₹{totals.hookCost}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Total Amount */}
                      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg">
                        <span className="text-2xl font-bold">
                          Total Project Amount
                        </span>
                        <span className="text-3xl font-bold">
                          ₹{totals.totalAmount}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

        {/* Action Buttons */}
        {rooms.length > 0 && (
          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="flex-1"
            >
              Save & Exit
            </Button>
            <Button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="flex-1"
            >
              Preview Quotation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
