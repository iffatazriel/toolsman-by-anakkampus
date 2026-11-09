export interface AbuseReport {
	shareId: string;
	fileCount: number;
	reason: string;
	reportedAt: number;
}

// Webhook opsional. Isinya sengaja hanya metadata: id link, jumlah berkas,
// waktu, dan alasan. Jangan pernah menambah kata sandi, nama berkas, atau isi
// berkas, karena webhook tujuan adalah sistem di luar kendali kita.
export async function notifyAbuse(url: string | undefined, report: AbuseReport): Promise<boolean> {
	if (!url) return false;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				shareId: report.shareId,
				fileCount: report.fileCount,
				reason: report.reason,
				reportedAt: report.reportedAt,
			}),
		});
		return response.ok;
	} catch (error) {
		console.error('Gagal mengirim laporan penyalahgunaan:', error);
		return false;
	}
}
