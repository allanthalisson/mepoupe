import * as schema from "./schema";
export declare const pool: import("pg").Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: import("pg").Pool;
};
export * from "./schema";
export { and, desc, eq, sql } from "drizzle-orm";
//# sourceMappingURL=index.d.ts.map