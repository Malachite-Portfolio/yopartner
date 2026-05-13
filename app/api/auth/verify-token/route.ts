import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type VerifyRequestBody = {
  idToken?: string;
};

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured() || !adminAuth) {
    return NextResponse.json({ error: "Firebase Admin is not configured." }, { status: 503 });
  }

  let body: VerifyRequestBody;
  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
    return NextResponse.json({ error: "idToken is required." }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return NextResponse.json({
      uid: decoded.uid,
      phoneNumber: decoded.phone_number ?? null,
      claims: decoded,
    });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
}
