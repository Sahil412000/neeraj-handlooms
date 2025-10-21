import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Configuration from "@/models/Configuration";
import { verifyToken } from "@/lib/jwt";

// GET - Get user configuration
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    let config = await Configuration.findOne({ userId: decoded.userId });

    // If configuration doesn't exist, create default one
    if (!config) {
      config = await Configuration.create({
        userId: decoded.userId,
        defaultMakingRate: 180,
        defaultFittingRate: 300,
        defaultTrackRate: 180,
        defaultHookRate: 200,
        termsAndConditions: `1) Order once placed cannot be cancelled
2) Advance paid will not be refunded
3) Delivery will be done after full bill is cleared at the Shop
4) Shop Closed on TUESDAY`,
      });
    }

    return NextResponse.json({ configuration: config }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}

// POST/PUT - Create or update configuration
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    const config = await Configuration.findOneAndUpdate(
      { userId: decoded.userId },
      { ...body, userId: decoded.userId },
      { new: true, upsert: true }
    );

    return NextResponse.json(
      {
        message: "Configuration updated successfully",
        configuration: config,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update configuration" },
      { status: 500 }
    );
  }
}
