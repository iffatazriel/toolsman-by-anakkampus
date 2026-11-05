export function downloadText(
	filename: string,
	text: string,
	mime = 'text/markdown;charset=utf-8',
): void {
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
