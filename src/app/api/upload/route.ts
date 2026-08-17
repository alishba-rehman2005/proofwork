import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Where an upload is allowed to land, so a caller cannot pick arbitrary paths. */
const PURPOSES = {
  "project-image": "projects",
  "submission-screenshot": "submissions",
} as const;

type Purpose = keyof typeof PURPOSES;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Generic image upload for project covers and submission screenshots.
 *
 * The storage path is derived from the signed-in user and a fresh id rather
 * than the client-supplied filename, so one user cannot overwrite another's
 * file or escape the bucket with a crafted name.
 */
export async function POST(request: Request) {
  // Outside the try: requireUser signals failure by throwing a redirect, which
  // must propagate rather than be reported as a 500.
  const user = await requireUser();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        message:
          "File uploads are not enabled on this deployment. Paste a link instead, or ask an administrator to configure storage.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = String(formData.get("purpose") ?? "") as Purpose;

    if (!(purpose in PURPOSES)) {
      return NextResponse.json({ message: "Unknown upload type." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, WebP or GIF images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "Images must be smaller than 5MB." }, { status: 400 });
    }

    const extension = EXTENSIONS[file.type] ?? "bin";
    const path = `${PURPOSES[purpose]}/${user.id}/${randomUUID()}.${extension}`;

    const supabase = getSupabaseAdmin();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, new Uint8Array(await file.arrayBuffer()), {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      console.error("Upload failed:", error);

      return NextResponse.json({ message: "Unable to store that image." }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (error) {
    console.error("Upload route error:", error);

    return NextResponse.json({ message: "Unable to upload the image." }, { status: 500 });
  }
}
