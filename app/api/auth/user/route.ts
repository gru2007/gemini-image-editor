import { NextRequest, NextResponse } from "next/server";
import type { TokenValidationResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Validate token using our internal API
    const validationResponse = await fetch(`${req.nextUrl.origin}/api/auth/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!validationResponse.ok) {
      const errorData = await validationResponse.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to validate token" },
        { status: validationResponse.status }
      );
    }

    const tokenData: TokenValidationResponse = await validationResponse.json();

    if (!tokenData.valid) {
      return NextResponse.json(
        { error: tokenData.message || "Invalid token" },
        { status: 401 }
      );
    }

    // Return user data if token is valid
    return NextResponse.json({
      success: true,
      user: tokenData.user,
      token_info: tokenData.token_info,
      message: "Authentication successful"
    });

  } catch (error) {
    console.error("Error authenticating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 