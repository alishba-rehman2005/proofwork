import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

/*
  The pool has to comfortably exceed the number of queries a single page fires
  concurrently. Admin renders roughly a dozen at once, and postgres.js defaults
  to 10 - once exhausted, requests queue behind connections that are themselves
  waiting, and the page hangs rather than merely slowing down.
*/
const client = postgres(env.databaseUrl, {
  prepare: false,
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);
