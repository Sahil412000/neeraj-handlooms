import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Window from "@/models/Window";
import Room from "@/models/Room";
import { verifyToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      roomId,
      projectId,
      windowNumber,
      style,
      height,
      width,
      pannaCount,
      meters,
      fabricCostPerMeter,
      trackCount,
      hookCount,
    } = body;

    // Validate room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Create window with provided values
    const window = await Window.create({
      roomId,
      projectId,
      windowNumber,
      style,
      height: parseFloat(height.toString()),
      width: parseFloat(width.toString()),
      pannaCount,
      meters: parseFloat(meters.toString()),
      fabricCostPerMeter: parseFloat(fabricCostPerMeter.toString()),
      trackCount: parseInt(trackCount.toString()),
      hookCount: parseInt(hookCount.toString()),
    });

    return NextResponse.json({ window }, { status: 201 });
  } catch (error) {
    console.error("Error creating window:", error);
    return NextResponse.json(
      { error: "Failed to create window" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    const windows = await Window.find({ roomId }).sort({ windowNumber: 1 });

    return NextResponse.json({ windows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching windows:", error);
    return NextResponse.json(
      { error: "Failed to fetch windows" },
      { status: 500 }
    );
  }
}
