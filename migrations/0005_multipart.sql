ALTER TABLE share_files ADD COLUMN file_index INTEGER;
ALTER TABLE share_files ADD COLUMN upload_id TEXT;

CREATE TABLE IF NOT EXISTS upload_parts (
	share_id TEXT NOT NULL,
	file_index INTEGER NOT NULL,
	part_number INTEGER NOT NULL,
	etag TEXT NOT NULL,
	size INTEGER NOT NULL,
	PRIMARY KEY (share_id, file_index, part_number)
);

CREATE INDEX IF NOT EXISTS idx_upload_parts_share ON upload_parts (share_id, file_index);
