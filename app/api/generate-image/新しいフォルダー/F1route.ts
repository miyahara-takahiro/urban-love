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

    const safePrompt = `
Japanese urban legend character portrait,
dark fantasy illustration,
cinematic lighting,
mysterious atmosphere,
anime style character design,
moody, elegant, supernatural,
non-graphic, non-violent, no gore, no injury, no blood.
${prompt}
`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1-mini",
        prompt: safePrompt,
        size: "1024x1024",
        output_format: "png",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "画像生成に失敗しました。" },
        { status: response.status }
      );
    }

    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "画像データの取得に失敗しました。" },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/png;base64,${b64}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "image generation failed" },
      { status: 500 }
    );
  }
}