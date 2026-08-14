import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    roles?: string[];
    primaryRoleId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      roles: string[];
      primaryRoleId: string | null;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    roles?: string[];
    primaryRoleId?: string | null;
  }
}
