import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const img = await client.images.generate({
      model: "gpt-image-1-mini",
      prompt,
      size: "1024x1024",
    });

    const b64 = img.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "Image generation returned no image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${b64}`,
    });
  } catch (error) {
    console.error("generate-image error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}