export interface SharesDb {
	prepare: (sql: string) => {
		bind: (...values: unknown[]) => {
			run: () => Promise<unknown>;
			first: <T = unknown>() => Promise<T | null>;
			all: <T = unknown>() => Promise<{ results: T[] }>;
		};
		all: <T = unknown>() => Promise<{ results: T[] }>;
	};
}

export interface ShareRow {
	id: string;
	expires_at: number;
	created_at: number;
	status: 'uploading' | 'ready' | 'deleted';
	max_downloads: number | null;
	downloads: number;
	reported: number;
	password_hash: string | null;
	takedown_at?: number | null;
}

export interface ShareFileRow {
	share_id: string;
	file_index?: number | null;
	object_key: string;
	name: string;
	size: number;
	mime: string;
	downloads: number;
	purged: number;
	upload_id?: string | null;
}
