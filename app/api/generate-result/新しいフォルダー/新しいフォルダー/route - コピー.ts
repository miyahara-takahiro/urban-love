import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { system, user } = await req.json();

    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return NextResponse.json({
      text: res.output_text ?? "",
    });
  } catch (error) {
    console.error("generate-result error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate result";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}