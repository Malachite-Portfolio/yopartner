import type { User } from "@prisma/client";
import { adminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getPrismaClient } from "@/lib/server/prisma";

type AuthResult =
  | { user: User; decoded: { uid: string; phoneNumber?: string | null } }
  | { error: string; status: number };

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export async function requireFirebaseUser(request: Request): Promise<AuthResult> {
  if (!isFirebaseAdminConfigured() || !adminAuth) {
    return { error: "Firebase Admin is not configured.", status: 503 };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { error: "Missing bearer token.", status: 401 };
  }

  let decodedToken: Awaited<ReturnType<typeof adminAuth.verifyIdToken>>;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch {
    return { error: "Invalid authentication token.", status: 401 };
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return { error: "Backend service is not connected yet.", status: 501 };
  }

  const user = await prisma.user.upsert({
    where: { firebaseUid: decodedToken.uid },
    update: {
      phone: decodedToken.phone_number ?? undefined,
      lastLoginAt: new Date(),
    },
    create: {
      firebaseUid: decodedToken.uid,
      phone: decodedToken.phone_number ?? null,
      lastLoginAt: new Date(),
    },
  });

  return {
    user,
    decoded: {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number ?? null,
    },
  };
}

export async function requireAdminUser(request: Request) {
  const auth = await requireFirebaseUser(request);
  if ("error" in auth) return auth;

  if (auth.user.role === "ADMIN") {
    return auth;
  }

  const adminUidAllowlist = (process.env.ADMIN_UID_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const adminPhoneAllowlist = (process.env.ADMIN_PHONE_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const canPromote =
    adminUidAllowlist.includes(auth.decoded.uid) ||
    (auth.decoded.phoneNumber ? adminPhoneAllowlist.includes(auth.decoded.phoneNumber) : false);

  if (!canPromote) {
    return { error: "Admin role required.", status: 403 } as const;
  }

  const prisma = getPrismaClient();
  if (!prisma) {
    return { error: "Backend service is not connected yet.", status: 501 } as const;
  }

  const promotedUser = await prisma.user.update({
    where: { id: auth.user.id },
    data: { role: "ADMIN" },
  });

  return { ...auth, user: promotedUser };
}
