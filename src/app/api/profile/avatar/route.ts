import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { candidateProfiles } from "@/db/schema";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  // Deliberately outside the try block: requireRole signals failure by throwing
  // a redirect, which must propagate rather than be reported as a 500.
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  if (!isSupabaseConfigured()) {
    console.error("Avatar upload attempted while Supabase storage is not configured.");

    return NextResponse.json(
      { message: "Image uploads are not available right now." },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Please select a profile image." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, and WebP images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Profile image must be smaller than 2MB." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const storagePath = `${user.id}/avatar`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, bytes, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Avatar upload failed:", uploadError);

      return NextResponse.json({ message: "Unable to upload profile image." }, { status: 500 });
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);

    // The storage path is stable across uploads, so the public URL stays cached
    // by the CDN. A version token forces clients to fetch the new image.
    const imageUrl = `${data.publicUrl}?v=${Date.now()}`;

    await db
      .update(candidateProfiles)
      .set({
        profileImageUrl: imageUrl,
        profileImageStoragePath: storagePath,
        updatedAt: new Date(),
      })
      .where(eq(candidateProfiles.userId, user.id));

    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Avatar route error:", error);

    return NextResponse.json({ message: "Unable to update avatar." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  try {
    const [profile] = await db
      .select({
        id: candidateProfiles.id,
        storagePath: candidateProfiles.profileImageStoragePath,
      })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ message: "Candidate profile not found." }, { status: 404 });
    }

    // Clear the columns first: a stored object we failed to delete is only
    // wasted space, whereas a dangling URL is a broken image for the user.
    await db
      .update(candidateProfiles)
      .set({
        profileImageUrl: null,
        profileImageStoragePath: null,
        updatedAt: new Date(),
      })
      .where(eq(candidateProfiles.id, profile.id));

    if (profile.storagePath && isSupabaseConfigured()) {
      const { error: removeError } = await getSupabaseAdmin()
        .storage.from(AVATAR_BUCKET)
        .remove([profile.storagePath]);

      if (removeError) {
        console.error("Avatar object removal failed:", removeError);
      }
    }

    revalidatePath("/profile");
    revalidatePath("/profile/edit");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);

    return NextResponse.json({ message: "Unable to remove profile image." }, { status: 500 });
  }
}
