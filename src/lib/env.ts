import "dotenv/config";

/**
 * Centralised access to environment variables.
 *
 * Every value is exposed through a getter so that a missing variable fails at
 * the point of use rather than at module load. That keeps an unconfigured
 * optional integration (for example Supabase storage) from crashing the whole
 * server or breaking `next build`.
 */

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env file (see .env.example).`,
    );
  }

  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },

  get authSecret() {
    return required("AUTH_SECRET");
  },

  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },

  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
};

/** True when Supabase storage is configured, without throwing if it is not. */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
