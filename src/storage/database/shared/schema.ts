import { pgTable, serial, varchar, text, timestamp, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const echoRecords = pgTable(
	"echo_records",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_input_url: text("user_input_url").notNull(),
		generated_image_url: text("generated_image_url"),
		interaction_style: varchar("interaction_style", { length: 50 }).notNull(),
		detected_emotion: varchar("detected_emotion", { length: 50 }),
		search_metadata: text("search_metadata"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("echo_records_created_at_idx").on(table.created_at),
		index("echo_records_interaction_style_idx").on(table.interaction_style),
		index("echo_records_detected_emotion_idx").on(table.detected_emotion),
	]
);
