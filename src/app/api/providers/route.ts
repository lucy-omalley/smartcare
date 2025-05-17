import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

const providerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  type: z.enum(["creche", "childminder"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  location: z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  experience: z.string().min(1, "Please select your experience level"),
  hourlyRate: z.string().min(1, "Please enter your hourly rate"),
  availability: z.record(z.string(), z.array(z.object({
    startTime: z.string(),
    endTime: z.string()
  }))),
  crecheCapacity: z.array(z.object({
    minAge: z.number(),
    maxAge: z.number(),
    capacity: z.number()
  })).optional()
});

const updateProviderSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

export async function GET() {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ providers }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch providers" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = providerSchema.parse(body);

    // Check if provider with email already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { email: validatedData.email }
    });

    if (existingProvider) {
      return NextResponse.json(
        { message: "A provider with this email already exists" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Create provider data object
    const providerData: Prisma.ProviderCreateInput = {
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      type: validatedData.type,
      address: validatedData.address,
      latitude: validatedData.location.lat,
      longitude: validatedData.location.lng,
      description: validatedData.description,
      experience: validatedData.experience,
      hourlyRate: Number(validatedData.hourlyRate),
      availability: validatedData.availability as any,
      crecheCapacity: validatedData.crecheCapacity ? (validatedData.crecheCapacity as any) : undefined,
      status: "pending"
    };

    // Create new provider
    const provider = await prisma.provider.create({
      data: providerData
    });

    return NextResponse.json(
      { message: "Provider registered successfully", provider },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.error("Error registering provider:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 