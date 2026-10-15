CREATE FUNCTION reject_work_order_events_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'work_order_events is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER work_order_events_append_only
BEFORE UPDATE OR DELETE ON work_order_events
FOR EACH ROW EXECUTE FUNCTION reject_work_order_events_mutation();
