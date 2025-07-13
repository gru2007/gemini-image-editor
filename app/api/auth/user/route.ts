import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get("authorization");
    
    if (!authToken) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Forward the request to Laravel backend
    const response = await fetch(`${LARAVEL_API_URL}/api/v1/user`, {
      method: "GET",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to authenticate user" },
        { status: response.status }
      );
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 