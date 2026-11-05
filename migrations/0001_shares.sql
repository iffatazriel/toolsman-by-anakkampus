CREATE TABLE IF NOT EXISTS shares (
	id TEXT PRIMARY KEY,
	created_at INTEGER NOT NULL,
	expires_at INTEGER NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('uploading', 'ready', 'deleted')),
	max_downloads INTEGER,
	downloads INTEGER NOT NULL DEFAULT 0,
	reported INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS shares_expires_idx ON shares (expires_at);

CREATE TABLE IF NOT EXISTS share_files (
	share_id TEXT NOT NULL REFERENCES shares (id),
	object_key TEXT NOT NULL,
	name TEXT NOT NULL,
	size INTEGER NOT NULL,
	mime TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS share_files_share_idx ON share_files (share_id);

CREATE TABLE IF NOT EXISTS reports (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	share_id TEXT NOT NULL,
	reason TEXT NOT NULL,
	created_at INTEGER NOT NULL
);
