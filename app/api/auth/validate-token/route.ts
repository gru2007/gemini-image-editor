import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000";
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

    // Forward the request to Laravel backend using bot token
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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to validate token" },
        { status: response.status }
      );
    }

    const tokenData = await response.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 