import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, disclosure_id } = await req.json();
    
    if (!token) {
      return NextResponse.json({ error: "トークンは必須です" }, { status: 400 });
    }
    
    const requestBody: { token: string; disclosure_id?: number } = { token };
    
    // disclosure_idが存在する場合はリクエストに含める
    if (disclosure_id) {
      requestBody.disclosure_id = disclosure_id;
    }
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/verify/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "トークン検証に失敗しました" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { error: "トークン検証中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 