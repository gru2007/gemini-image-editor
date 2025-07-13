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
      console.error(`Laravel API returned ${response.status}: ${response.statusText}`);
      
      // Try to parse response as JSON, but handle HTML responses gracefully
      let errorMessage = "Failed to authenticate user";
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
          errorMessage = "Invalid or expired authentication token";
        } else if (response.status === 404) {
          errorMessage = "Authentication endpoint not found. Please check Laravel API configuration.";
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

    const userData = await response.json();
    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error authenticating user:", error);
    
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