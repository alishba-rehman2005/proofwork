import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { registerUser } from "@/features/auth/server/register-user";
import { registerSchema } from "@/features/auth/validation/register.schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const validatedData = registerSchema.parse(body);

    const result = await registerUser(validatedData);

    if (!result.success) {
      if (result.code === "EMAIL_EXISTS") {
        return NextResponse.json(
          { success: false, message: "An account with this email already exists." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { success: false, message: "Registration is temporarily unavailable." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        requiresApproval: result.requiresApproval,
        message: result.requiresApproval
          ? "Your company account has been submitted for review. We will email you once it is approved."
          : "Account created successfully.",
        user: result.user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the highlighted fields.",
          errors: z.flattenError(error).fieldErrors,
        },
        { status: 400 },
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create your account. Please try again." },
      { status: 500 },
    );
  }
}
