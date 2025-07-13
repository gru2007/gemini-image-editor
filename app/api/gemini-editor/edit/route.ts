import { NextRequest, NextResponse } from "next/server";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000";
const GEMINI_EDITOR_COST = parseFloat(process.env.GEMINI_EDITOR_COST || "10"); // Cost per edit in tokens

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, image_url, style, strength, width, height } = body;
    
    if (!prompt || !image_url) {
      return NextResponse.json(
        { error: "prompt and image_url are required" },
        { status: 400 }
      );
    }

    const authToken = req.headers.get("authorization");
    if (!authToken) {
      return NextResponse.json(
        { error: "Authorization token is required" },
        { status: 401 }
      );
    }

    // First, get user information
    const userResponse = await fetch(`${LARAVEL_API_URL}/api/v1/user`, {
      method: "GET",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: "Failed to authenticate user" },
        { status: 401 }
      );
    }

    const userData = await userResponse.json();
    
    // Check if user has enough balance
    if (userData.balance < GEMINI_EDITOR_COST) {
      return NextResponse.json(
        { error: "Insufficient balance for image editing" },
        { status: 402 }
      );
    }

    // Deduct balance first
    const balanceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/balance/deduct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userData.id,
        amount: GEMINI_EDITOR_COST,
        description: `Gemini Image Editor: ${prompt.substring(0, 50)}...`
      })
    });

    if (!balanceResponse.ok) {
      return NextResponse.json(
        { error: "Failed to deduct balance" },
        { status: 402 }
      );
    }

    // Now process the image with Gemini Editor
    const editResponse = await fetch(`${LARAVEL_API_URL}/api/v1/gemini-image-editor/edit`, {
      method: "POST",
      headers: {
        "Authorization": authToken,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_url,
        style: style || "natural",
        strength: strength || "moderate",
        width: width || 1024,
        height: height || 1024
      })
    });

    if (!editResponse.ok) {
      // If image editing fails, we should refund the balance
      // For now, we'll just return the error
      const errorData = await editResponse.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to process image" },
        { status: editResponse.status }
      );
    }

    const editData = await editResponse.json();
    
    // Include updated balance in response
    const balanceData = await balanceResponse.json();
    
    return NextResponse.json({
      success: true,
      url: editData.url,
      balance: balanceData.balance,
      cost: GEMINI_EDITOR_COST
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 