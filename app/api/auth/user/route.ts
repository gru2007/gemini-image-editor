import { NextRequest, NextResponse } from "next/server";
import type { TokenValidationResponse } from "@/lib/types";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "https://api.chatall.ru";
const BOT_TOKEN = process.env.BOT_TOKEN || "";

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

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "Bot token not configured" },
        { status: 500 }
      );
    }

    // Validate token directly with Laravel backend
    const response = await fetch(`${LARAVEL_API_URL}/api/v1/bot/validate-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BOT_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        token: token
      })
    });

    console.log(`Making request to: ${LARAVEL_API_URL}/api/v1/bot/validate-token`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || "Failed to validate token" },
          { status: response.status }
        );
      } else {
        const errorText = await response.text();
        console.error("Non-JSON response:", errorText.substring(0, 200));
        return NextResponse.json(
          { error: "Server returned non-JSON response" },
          { status: response.status }
        );
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error("Non-JSON response:", responseText.substring(0, 200));
      return NextResponse.json(
        { error: "Server returned non-JSON response" },
        { status: 500 }
      );
    }

    const tokenData: TokenValidationResponse = await response.json();

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