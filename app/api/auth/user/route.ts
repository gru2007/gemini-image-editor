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

    // Check if Laravel API URL is configured
    if (!LARAVEL_API_URL || LARAVEL_API_URL === "http://localhost:8000") {
      console.warn("LARAVEL_API_URL not configured or using default localhost URL");
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
      // Try to parse error response as JSON, fallback to text if it's HTML
      let errorMessage = "Failed to authenticate user";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, it might be HTML (like a 404 page)
        const errorText = await response.text();
        console.error("Non-JSON error response:", errorText.substring(0, 200));
        
        if (response.status === 404) {
          errorMessage = "Laravel API endpoint not found. Please check if the backend is running and LARAVEL_API_URL is correct.";
        } else if (response.status === 0 || response.status >= 500) {
          errorMessage = "Cannot connect to Laravel backend. Please check if the server is running and LARAVEL_API_URL is correct.";
        } else {
          errorMessage = `Authentication failed (${response.status}): ${response.statusText}`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error authenticating user:", error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: "Cannot connect to Laravel backend. Please check if the server is running and LARAVEL_API_URL is configured correctly." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 