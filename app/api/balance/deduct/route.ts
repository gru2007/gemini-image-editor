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
      console.error(`Laravel API returned ${response.status}: ${response.statusText}`);
      
      // Try to parse response as JSON, but handle HTML responses gracefully
      let errorMessage = "Failed to deduct balance";
      let errorData = null;
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse JSON error response:", parseError);
        }
      } else {
        // Handle HTML error responses
        const textResponse = await response.text();
        console.error("Received HTML error response:", textResponse.substring(0, 200));
        
        // Provide specific error messages based on status
        if (response.status === 401) {
          errorMessage = "Invalid or expired bot token";
        } else if (response.status === 404) {
          errorMessage = "Balance endpoint not found. Please check Laravel API configuration.";
        } else if (response.status === 500) {
          errorMessage = "Laravel backend server error. Please try again later.";
        } else if (response.status === 503) {
          errorMessage = "Laravel backend service unavailable. Please try again later.";
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
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
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Unable to connect to Laravel backend. Please check if the server is running." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 