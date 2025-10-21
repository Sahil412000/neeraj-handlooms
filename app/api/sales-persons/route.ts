import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SalesPerson from "@/models/SalesPerson";
import { verifyToken } from "@/lib/jwt";

// GET all sales persons for logged-in user
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

    const salesPersons = await SalesPerson.find(query)
      .sort({ name: 1 })
      .lean();

    // Filter by search if provided
    let filteredSalesPersons = salesPersons;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSalesPersons = salesPersons.filter((salesPerson: any) => {
        return (
          salesPerson.name.toLowerCase().includes(searchLower) ||
          salesPerson.contactNumber.includes(search) ||
          salesPerson.territory?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({ salesPersons: filteredSalesPersons }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch sales persons" },
      { status: 500 }
    );
  }
}

// POST - Create new sales person
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
    const { name, contactNumber, alternateContact, territory, email } = body;

    // Validate required fields
    if (!name || !contactNumber) {
      return NextResponse.json(
        { error: "Name and contact number are required" },
        { status: 400 }
      );
    }

    // Check if sales person with same name already exists for this user
    const existingSalesPerson = await SalesPerson.findOne({
      userId: decoded.userId,
      name: name.trim(),
    });

    if (existingSalesPerson) {
      return NextResponse.json(
        { error: "Sales person with this name already exists" },
        { status: 400 }
      );
    }

    const salesPerson = await SalesPerson.create({
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      alternateContact: alternateContact?.trim(),
      territory: territory?.trim(),
      email: email?.trim(),
      userId: decoded.userId,
    });

    return NextResponse.json(
      {
        message: "Sales person created successfully",
        salesPerson,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create sales person" },
      { status: 500 }
    );
  }
}
