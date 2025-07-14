import { NextRequest, NextResponse } from "next/server";

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

    // Validate token with Laravel backend
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
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || "Failed to validate token" },
          { status: response.status }
        );
      } else {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: response.status }
        );
      }
    }

    const tokenData = await response.json();

    if (!tokenData.valid || !tokenData.user) {
      return NextResponse.json(
        { error: tokenData.message || "Invalid token" },
        { status: 401 }
      );
    }

    // Generate the auto-login link
    const baseUrl = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const autoLoginLink = `${baseUrl}/auth/login?token=${encodeURIComponent(token)}`;

    return NextResponse.json({
      success: true,
      link: autoLoginLink,
      user: {
        id: tokenData.user.id,
        name: tokenData.user.name,
        email: tokenData.user.email,
        balance: tokenData.user.balance
      }
    });

  } catch (error) {
    console.error("Error generating auto-login link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 