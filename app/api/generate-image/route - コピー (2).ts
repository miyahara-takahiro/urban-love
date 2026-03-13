import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 環境変数を設定してください" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1-mini",
        prompt,
        size: "1024x1024",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "画像生成に失敗しました。" },
        { status: response.status }
      );
    }

    const imageUrl = data?.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "画像URLの取得に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json(
      { error: "image generation failed" },
      { status: 500 }
    );
  }
}