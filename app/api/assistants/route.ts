import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get("clinicId")

    if (!clinicId) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      )
    }

    const assistants = await prisma.assistant.findMany({
      where: { clinicId },
      select: { id: true, name: true }
    })
    return NextResponse.json(assistants)
  } catch (error) {
    console.error("Error fetching assistants:", error)
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    )
  }
} 