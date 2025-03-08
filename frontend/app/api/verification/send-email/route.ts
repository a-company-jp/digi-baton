import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "メールアドレスは必須です" }, { status: 400 });
    }
    
    const authData = await auth();
    
    if (!authData.userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    
    const token = await authData.getToken();
    
    const response = await fetch(`${process.env.BACKEND_URL}/api/verify/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "メール送信に失敗しました" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: "メール送信中にエラーが発生しました" },
      { status: 500 }
    );
  }
} 