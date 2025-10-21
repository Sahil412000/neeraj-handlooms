import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Project from "@/models/Project";
import Customer from "@/models/Customer";
import Configuration from "@/models/Configuration";
import { verifyToken } from "@/lib/jwt";

// GET all projects for logged-in user
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
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query: any = { userId: decoded.userId };

    if (status && status !== "all") {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate("customerId")
      .populate("salesPersonId")
      .populate("tailorId")
      .sort({ createdAt: -1 })
      .lean();

    // Filter by search if provided
    let filteredProjects = projects;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = projects.filter((project: any) => {
        return (
          project.customerId?.name.toLowerCase().includes(searchLower) ||
          project.customerId?.contactNumber.includes(search) ||
          project.salesPersonId?.name.toLowerCase().includes(searchLower) ||
          project.tailorId?.name.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({ projects: filteredProjects }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST - Create new project
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
    const {
      customer,
      projectType,
      salesPersonId,
      projectNotes,
      tailorId,
      probableDeliveryDate,
      defaultMakingRate,
      defaultFittingRate,
      defaultTrackRate,
      defaultHookRate,
    } = body;

    // Validate required fields
    if (!customer || !projectType || !salesPersonId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if customer exists or create new one
    let customerId;
    if (customer.id) {
      customerId = customer.id;
    } else {
      // Create new customer
      const newCustomer = await Customer.create({
        name: customer.name,
        contactNumber: customer.contactNumber,
        alternateContact: customer.alternateContact,
        address: customer.address,
        email: customer.email,
      });
      customerId = newCustomer._id;
    }

    // Get user configuration for default values
    let config = await Configuration.findOne({ userId: decoded.userId });
    if (!config) {
      // Create default configuration if not exists
      config = await Configuration.create({
        userId: decoded.userId,
        defaultMakingRate: 180,
        defaultFittingRate: 300,
        defaultTrackRate: 180,
        defaultHookRate: 200,
      });
    }

    // Generate quotation number
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const count = await Project.countDocuments({
      userId: decoded.userId,
    });
    const quotationNumber = `Q${year}${month}${String(count + 1).padStart(
      4,
      "0"
    )}`;

    // Create project
    const project = await Project.create({
      quotationNumber,
      customerId,
      projectType,
      salesPersonId,
      projectNotes,
      tailorId: tailorId || undefined,
      probableDeliveryDate: probableDeliveryDate ? new Date(probableDeliveryDate) : undefined,
      defaultMakingRate: defaultMakingRate || config.defaultMakingRate,
      defaultFittingRate: defaultFittingRate || config.defaultFittingRate,
      defaultTrackRate: defaultTrackRate || config.defaultTrackRate,
      defaultHookRate: defaultHookRate || config.defaultHookRate,
      termsAndConditions: config.termsAndConditions,
      userId: decoded.userId,
      status: "draft",
      totalAmount: 0,
      advanceAmount: 0,
      balanceAmount: 0,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("customerId")
      .populate("salesPersonId")
      .populate("tailorId");

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: populatedProject,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}
