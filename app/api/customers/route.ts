import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { verifyToken } from "@/lib/jwt";

// GET - Search customers
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

    let customers;
    if (search) {
      const searchRegex = new RegExp(search, "i");
      customers = await Customer.find({
        $or: [
          { name: searchRegex },
          { contactNumber: searchRegex },
          { address: searchRegex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
    } else {
      customers = await Customer.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    return NextResponse.json({ customers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST - Create new customer
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
    const { name, contactNumber, alternateContact, address, email } = body;

    // Validate required fields
    if (!name || !contactNumber || !address) {
      return NextResponse.json(
        { error: "Name, contact number, and address are required" },
        { status: 400 }
      );
    }

    // Check if customer with same contact already exists
    const existingCustomer = await Customer.findOne({ contactNumber });
    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this contact number already exists" },
        { status: 400 }
      );
    }

    const customer = await Customer.create({
      name,
      contactNumber,
      alternateContact,
      address,
      email,
    });

    return NextResponse.json(
      {
        message: "Customer created successfully",
        customer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create customer" },
      { status: 500 }
    );
  }
}
