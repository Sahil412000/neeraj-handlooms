import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Tailor from "@/models/Tailor";
import { verifyToken } from "@/lib/jwt";

// GET all tailors for logged-in user
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query: any = { userId: decoded.userId };

    if (activeOnly) {
      query.isActive = true;
    }

    const tailors = await Tailor.find(query)
      .sort({ name: 1 })
      .lean();

    // Filter by search if provided
    let filteredTailors = tailors;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTailors = tailors.filter((tailor: any) => {
        return (
          tailor.name.toLowerCase().includes(searchLower) ||
          tailor.contactNumber.includes(search) ||
          tailor.specialization?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({ tailors: filteredTailors }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch tailors" },
      { status: 500 }
    );
  }
}

// POST - Create new tailor
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
    const { name, contactNumber, alternateContact, specialization, address } = body;

    // Validate required fields
    if (!name || !contactNumber) {
      return NextResponse.json(
        { error: "Name and contact number are required" },
        { status: 400 }
      );
    }

    // Check if tailor with same name already exists for this user
    const existingTailor = await Tailor.findOne({
      userId: decoded.userId,
      name: name.trim(),
    });

    if (existingTailor) {
      return NextResponse.json(
        { error: "Tailor with this name already exists" },
        { status: 400 }
      );
    }

    const tailor = await Tailor.create({
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      alternateContact: alternateContact?.trim(),
      specialization: specialization?.trim(),
      address: address?.trim(),
      userId: decoded.userId,
    });

    return NextResponse.json(
      {
        message: "Tailor created successfully",
        tailor,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create tailor" },
      { status: 500 }
    );
  }
}
