import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000";
const BOT_TOKEN = process.env.BOT_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, amount, description } = body;

    if (!user_id || !amount) {
      return NextResponse.json(
        { error: "user_id and amount are required" },
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
    const response = await fetch(`${LARAVEL_API_URL}/api/v1/bot/users/${user_id}/balance`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BOT_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        type: "debit",
        description: description || "Gemini Image Editor usage"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to deduct balance" },
        { status: response.status }
      );
    }

    const balanceData = await response.json();
    return NextResponse.json({
      success: true,
      balance: balanceData.balance
    });
  } catch (error) {
    console.error("Error deducting balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 