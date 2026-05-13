import { NextResponse } from "next/server";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const runtime = "nodejs";

type SessionRequestBody = {
  idToken?: string;
  role?: "user" | "partner";
};

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured() || !adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin is not configured." },
      { status: 503 },
    );
  }

  let body: SessionRequestBody;
  try {
    body = (await request.json()) as SessionRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const idToken = body.idToken?.trim();
  const role = body.role;

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required." }, { status: 400 });
  }

  if (role !== "user" && role !== "partner") {
    return NextResponse.json({ error: "role must be 'user' or 'partner'." }, { status: 400 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    const creationTime = userRecord.metadata.creationTime;
    const lastSignInTime = userRecord.metadata.lastSignInTime;

    const isNewUser = Boolean(
      creationTime &&
        lastSignInTime &&
        new Date(lastSignInTime).getTime() - new Date(creationTime).getTime() < 2 * 60 * 1000,
    );

    return NextResponse.json({
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number ?? userRecord.phoneNumber ?? null,
      role,
      isNewUser,
    });
  } catch {
    return NextResponse.json({ error: "Unable to verify token." }, { status: 401 });
  }
}
