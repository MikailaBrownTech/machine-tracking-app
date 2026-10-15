import nextEnv from "@next/env";
import { Pool, type PoolClient } from "@neondatabase/serverless";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set");

const pool = new Pool({ connectionString: url });
let client: PoolClient;

type SqlFailure = { code: string; constraint?: string };

// Runs a statement inside a savepoint that is always rolled back to, so the
// surrounding transaction survives the expected failure.
async function failure(
  text: string,
  params: unknown[] = [],
): Promise<SqlFailure> {
  await client.query("SAVEPOINT attempt");
  try {
    await client.query(text, params);
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT attempt");
    const e = error as { code?: string; constraint?: string };
    if (!e.code) throw error;
    return { code: e.code, constraint: e.constraint };
  }
  throw new Error("Statement unexpectedly succeeded");
}

async function one(text: string, params: unknown[] = []): Promise<string> {
  const res = await client.query<{ id: string }>(text, params);
  return res.rows[0].id;
}

const CHECK_VIOLATION = "23514";
const RESTRICT_VIOLATION = "23001";
const UNIQUE_VIOLATION = "23505";
const RAISE_EXCEPTION = "P0001";

let userId: string;
let assetId: string;
let workOrderId: string;
let eventId: string;

beforeAll(async () => {
  client = await pool.connect();
});

afterAll(async () => {
  client.release();
  await pool.end();
});

beforeEach(async () => {
  await client.query("BEGIN");
  userId = await one(
    `INSERT INTO users (id, name, email) VALUES ('e2e-db-user', 'DB Test', 'db-test@example.invalid') RETURNING id`,
  );
  assetId = await one(
    `INSERT INTO assets (name, type, location, serial) VALUES ('e2e-db-asset', 'Pump', 'Bay', 'e2e-db-serial') RETURNING id`,
  );
  workOrderId = await one(
    `INSERT INTO work_orders (asset_id, title, created_by) VALUES ($1, 'e2e-db-wo', $2) RETURNING id`,
    [assetId, userId],
  );
  eventId = await one(
    `INSERT INTO work_order_events (work_order_id, from_status, to_status, actor_id)
     VALUES ($1, NULL, 'open', $2) RETURNING id`,
    [workOrderId, userId],
  );
});

afterEach(async () => {
  await client.query("ROLLBACK");
});

describe("work_orders constraints", () => {
  it("rejects status done without completed_at", async () => {
    const f = await failure(
      `INSERT INTO work_orders (asset_id, title, status, created_by)
       VALUES ($1, 'x', 'done', $2)`,
      [assetId, userId],
    );
    expect(f).toEqual({
      code: CHECK_VIOLATION,
      constraint: "work_orders_done_iff_completed",
    });
  });

  it("rejects completed_at on a non-done work order", async () => {
    const f = await failure(
      `INSERT INTO work_orders (asset_id, title, status, completed_at, created_by)
       VALUES ($1, 'x', 'open', now(), $2)`,
      [assetId, userId],
    );
    expect(f).toEqual({
      code: CHECK_VIOLATION,
      constraint: "work_orders_done_iff_completed",
    });
  });

  it("rejects a blank title", async () => {
    const f = await failure(
      `INSERT INTO work_orders (asset_id, title, created_by) VALUES ($1, '   ', $2)`,
      [assetId, userId],
    );
    expect(f).toEqual({
      code: CHECK_VIOLATION,
      constraint: "work_orders_title_not_blank",
    });
  });

  it("rejects completed_at before created_at", async () => {
    const f = await failure(
      `INSERT INTO work_orders (asset_id, title, status, created_at, completed_at, created_by)
       VALUES ($1, 'x', 'done', now(), now() - interval '1 hour', $2)`,
      [assetId, userId],
    );
    expect(f).toEqual({
      code: CHECK_VIOLATION,
      constraint: "work_orders_completed_after_created",
    });
  });
});

describe("work_order_events", () => {
  it("rejects from_status equal to to_status", async () => {
    const f = await failure(
      `INSERT INTO work_order_events (work_order_id, from_status, to_status, actor_id)
       VALUES ($1, 'open', 'open', $2)`,
      [workOrderId, userId],
    );
    expect(f).toEqual({
      code: CHECK_VIOLATION,
      constraint: "work_order_events_status_changed",
    });
  });

  it("rejects UPDATE (append-only trigger)", async () => {
    const f = await failure(
      `UPDATE work_order_events SET note = 'edited' WHERE id = $1`,
      [eventId],
    );
    expect(f.code).toBe(RAISE_EXCEPTION);
  });

  it("rejects DELETE (append-only trigger)", async () => {
    const f = await failure(`DELETE FROM work_order_events WHERE id = $1`, [
      eventId,
    ]);
    expect(f.code).toBe(RAISE_EXCEPTION);
  });
});

describe("assets", () => {
  it("restricts deleting an asset that has work orders", async () => {
    const f = await failure(`DELETE FROM assets WHERE id = $1`, [assetId]);
    expect(f).toEqual({
      code: RESTRICT_VIOLATION,
      constraint: "work_orders_asset_id_assets_id_fk",
    });
  });

  it("rejects a duplicate serial", async () => {
    const f = await failure(
      `INSERT INTO assets (name, type, location, serial) VALUES ('dup', 'Pump', '', 'e2e-db-serial')`,
    );
    expect(f).toEqual({
      code: UNIQUE_VIOLATION,
      constraint: "assets_serial_uidx",
    });
  });

  it("allows many assets without a serial", async () => {
    await client.query(
      `INSERT INTO assets (name, type, location) VALUES ('a', 'T', ''), ('b', 'T', '')`,
    );
  });
});
