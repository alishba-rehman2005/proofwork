import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { registerUser } from "@/features/auth/server/register-user";
import { registerSchema } from "@/features/auth/validation/register.schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const validatedData = registerSchema.parse(body);

    const result = await registerUser({
      fullName: validatedData.fullName,
      email: validatedData.email,
      password: validatedData.password,
    });

    if (!result.success) {
      if (result.code === "EMAIL_EXISTS") {
        return NextResponse.json(
          {
            success: false,
            message: "An account with this email already exists.",
          },
          {
            status: 409,
          },
        );
      }

      if (result.code === "CANDIDATE_ROLE_MISSING") {
        console.error("Registration failed because the CANDIDATE role is missing.");

        return NextResponse.json(
          {
            success: false,
            message: "Registration is temporarily unavailable.",
          },
          {
            status: 500,
          },
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Registration is temporarily unavailable.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: result.user,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the highlighted fields.",
          errors: error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create your account. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}
