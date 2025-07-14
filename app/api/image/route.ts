import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { HistoryItem, HistoryPart } from "@/lib/types";

// Initialize the Google Gen AI client with your API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "https://api.chatall.ru";
const BOT_TOKEN = process.env.BOT_TOKEN || "";
const GEMINI_EDITOR_COST = parseFloat(process.env.GEMINI_EDITOR_COST || "10");

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Define the model ID for Gemini 2.0 Flash experimental
const MODEL_ID = "gemini-2.0-flash-exp-image-generation";

// Define interface for the formatted history item
interface FormattedHistoryItem {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inlineData?: { data: string; mimeType: string };
  }>;
}

export async function POST(req: NextRequest) {
  try {
    // Make sure we have an API key configured
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!BOT_TOKEN) {
      console.error("BOT_TOKEN is not configured");
      return NextResponse.json(
        { success: false, error: "Bot token not configured" },
        { status: 500 }
      );
    }

    // Parse JSON request
    const requestData = await req.json().catch((err) => {
      console.error("Failed to parse JSON body:", err);
      return null;
    });
    
    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { prompt, image: inputImage, history, token } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 }
      );
    }

    // Validate user token directly with Laravel backend
    const tokenValidationResponse = await fetch(`${LARAVEL_API_URL}/api/v1/bot/validate-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BOT_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ token })
    });

    console.log(`Token validation request to: ${LARAVEL_API_URL}/api/v1/bot/validate-token`);
    console.log(`Token validation response status: ${tokenValidationResponse.status}`);

    if (!tokenValidationResponse.ok) {
      const contentType = tokenValidationResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await tokenValidationResponse.json();
        return NextResponse.json(
          { success: false, error: errorData.message || "Invalid token" },
          { status: 401 }
        );
      } else {
        const errorText = await tokenValidationResponse.text();
        console.error("Non-JSON response from token validation:", errorText.substring(0, 200));
        return NextResponse.json(
          { success: false, error: "Token validation failed" },
          { status: 401 }
        );
      }
    }

    const tokenData = await tokenValidationResponse.json();

    if (!tokenData.valid || !tokenData.user) {
      return NextResponse.json(
        { success: false, error: tokenData.message || "Invalid token" },
        { status: 401 }
      );
    }

    const user = tokenData.user;

    // Check if user has sufficient balance
    if (user.balance < GEMINI_EDITOR_COST) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance for image processing" },
        { status: 402 }
      );
    }

    // Deduct balance before processing
    const balanceResponse = await fetch(`${LARAVEL_API_URL}/api/v1/bot/user/${user.id}/balance`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BOT_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: GEMINI_EDITOR_COST,
        type: "debit",
        description: `Gemini Image Editor: ${prompt.substring(0, 50)}...`
      })
    });

    console.log(`Balance deduction request to: ${LARAVEL_API_URL}/api/v1/bot/user/${user.id}/balance`);
    console.log(`Balance deduction response status: ${balanceResponse.status}`);

    if (!balanceResponse.ok) {
      const contentType = balanceResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await balanceResponse.json();
        return NextResponse.json(
          { success: false, error: errorData.message || "Failed to deduct balance" },
          { status: 500 }
        );
      } else {
        const errorText = await balanceResponse.text();
        console.error("Non-JSON response from balance deduction:", errorText.substring(0, 200));
        return NextResponse.json(
          { success: false, error: "Balance deduction failed" },
          { status: 500 }
        );
      }
    }

    const balanceData = await balanceResponse.json();

    let response;

    // Validate the image if provided
    if (inputImage) {
      if (typeof inputImage !== "string" || !inputImage.startsWith("data:")) {
        console.error("Invalid image data URL format", { inputImage });
        return NextResponse.json(
          { success: false, error: "Invalid image data URL format" },
          { status: 400 }
        );
      }
      const imageParts = inputImage.split(",");
      if (imageParts.length < 2) {
        console.error("Malformed image data URL", { inputImage });
        return NextResponse.json(
          { success: false, error: "Malformed image data URL" },
          { status: 400 }
        );
      }
      const base64Image = imageParts[1];
      // Check for non-empty and valid base64 (basic check)
      if (!base64Image || !/^([A-Za-z0-9+/=]+)$/.test(base64Image.replace(/\s/g, ""))) {
        console.error("Image data is empty or not valid base64", { base64Image });
        return NextResponse.json(
          { success: false, error: "Image data is empty or not valid base64" },
          { status: 400 }
        );
      }
    }

    try {
      // Convert history to the format expected by Gemini API
      const formattedHistory =
        history && history.length > 0
          ? history
              .map((item: HistoryItem) => {
                return {
                  role: item.role,
                  parts: item.parts
                    .map((part: HistoryPart) => {
                      if (part.text) {
                        return { text: part.text };
                      }
                      if (part.image && item.role === "user") {
                        const imgParts = part.image.split(",");
                        if (imgParts.length > 1) {
                          return {
                            inlineData: {
                              data: imgParts[1],
                              mimeType: part.image.includes("image/png")
                                ? "image/png"
                                : "image/jpeg",
                            },
                          };
                        }
                      }
                      return { text: "" };
                    })
                    .filter((part) => Object.keys(part).length > 0), // Remove empty parts
                };
              })
              .filter((item: FormattedHistoryItem) => item.parts.length > 0) // Remove items with no parts
          : [];

      // Prepare the current message parts
      const messageParts = [];

      // Add the text prompt
      messageParts.push({ text: prompt });

      // Add the image if provided
      if (inputImage) {
        // For image editing
        console.log("Processing image edit request");

        // Check if the image is a valid data URL
        if (!inputImage.startsWith("data:")) {
          throw new Error("Invalid image data URL format");
        }

        const imageParts = inputImage.split(",");
        if (imageParts.length < 2) {
          throw new Error("Invalid image data URL format");
        }

        const base64Image = imageParts[1];
        const mimeType = inputImage.includes("image/png")
          ? "image/png"
          : "image/jpeg";
        console.log(
          "Base64 image length:",
          base64Image.length,
          "MIME type:",
          mimeType
        );

        // Add the image to message parts
        messageParts.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        });
      }
      // Add the message parts to the history
      formattedHistory.push(messageParts);

      // Generate the content
      response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: formattedHistory,
        config: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          responseModalities: ["Text", "Image"],
        },
      });
    } catch (error) {
      console.error("Error in chat.sendMessage:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error in AI processing";
      return NextResponse.json(
        { success: false, error: "Gemini API error", details: errorMessage },
        { status: 500 }
      );
    }

    let textResponse = null;
    let imageData = null;
    let mimeType = "image/png";

    // Process the response
    console.log("Full Gemini API response:", JSON.stringify(response, null, 2));
    
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log("Candidate structure:", JSON.stringify(candidate, null, 2));
      
      if (candidate && candidate.content && candidate.content.parts) {
        const parts = candidate.content.parts;
        console.log("Number of parts in response:", parts.length);

        for (const part of parts) {
          if ("inlineData" in part && part.inlineData) {
            // Get the image data
            imageData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "image/png";
            console.log(
              "Image data received, length:",
              imageData?.length || 0,
              "MIME type:",
              mimeType
            );
          } else if ("text" in part && part.text) {
            // Store the text
            textResponse = part.text;
            console.log(
              "Text response received:",
              textResponse.substring(0, 50) + "..."
            );
          }
        }
      } else {
        console.error("Invalid candidate structure:", candidate);
        return NextResponse.json(
          { success: false, error: "Invalid response structure from Gemini API" },
          { status: 500 }
        );
      }
    } else {
      console.error("No candidates in Gemini API response", { response });
      return NextResponse.json(
        { success: false, error: "No candidates in Gemini API response" },
        { status: 500 }
      );
    }

    if (!imageData) {
      console.error("No image data in Gemini response", { response });
      return NextResponse.json(
        { success: false, error: "No image data in Gemini response" },
        { status: 500 }
      );
    }

    // Return the base64 image and description as JSON, along with updated balance
    return NextResponse.json({
      success: true,
      image: `data:${mimeType};base64,${imageData}`,
      description: textResponse || null,
      balance: balanceData.balance,
      user: {
        id: user.id,
        name: user.name,
        balance: balanceData.balance
      }
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
