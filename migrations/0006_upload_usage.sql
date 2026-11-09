CREATE TABLE IF NOT EXISTS upload_usage (
	day TEXT NOT NULL,
	scope TEXT NOT NULL,
	bytes INTEGER NOT NULL DEFAULT 0,
	PRIMARY KEY (day, scope)
);

CREATE INDEX IF NOT EXISTS idx_upload_usage_day ON upload_usage (day);
