import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "tech", "viewer"]);
export const assetStatus = pgEnum("asset_status", [
  "active",
  "inactive",
  "retired",
]);
export const workOrderPriority = pgEnum("work_order_priority", [
  "low",
  "medium",
  "high",
]);
export const workOrderStatus = pgEnum("work_order_status", [
  "open",
  "in_progress",
  "done",
]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRole("role").notNull().default("viewer"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("users_email_lower_uidx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    location: text("location").notNull(),
    serial: text("serial"),
    status: assetStatus("status").notNull().default("active"),
    createdAt: createdAt(),
  },
  (t) => [
    check("assets_name_not_blank", sql`trim(${t.name}) <> ''`),
    uniqueIndex("assets_serial_uidx")
      .on(t.serial)
      .where(sql`${t.serial} is not null`),
  ],
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    priority: workOrderPriority("priority").notNull().default("medium"),
    status: workOrderStatus("status").notNull().default("open"),
    createdAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedTo: text("assigned_to").references(() => users.id, {
      onDelete: "restrict",
    }),
  },
  (t) => [
    check("work_orders_title_not_blank", sql`trim(${t.title}) <> ''`),
    check(
      "work_orders_done_iff_completed",
      sql`(${t.status} = 'done') = (${t.completedAt} is not null)`,
    ),
    check(
      "work_orders_completed_after_created",
      sql`${t.completedAt} >= ${t.createdAt}`,
    ),
    index("work_orders_asset_created_idx").on(t.assetId, t.createdAt.desc()),
    index("work_orders_assigned_to_idx")
      .on(t.assignedTo)
      .where(sql`${t.assignedTo} is not null`),
  ],
);

export const workOrderEvents = pgTable(
  "work_order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workOrderId: uuid("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "restrict" }),
    fromStatus: workOrderStatus("from_status"),
    toStatus: workOrderStatus("to_status").notNull(),
    note: text("note").notNull().default(""),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "work_order_events_status_changed",
      sql`${t.fromStatus} is distinct from ${t.toStatus}`,
    ),
    index("work_order_events_wo_created_idx").on(t.workOrderId, t.createdAt),
  ],
);
