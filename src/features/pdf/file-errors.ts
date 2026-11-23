export type PdfErrorCode = 'password' | 'corrupt' | 'processing';

export function classifyPdfError(error: unknown): PdfErrorCode {
	const name = error instanceof Error ? error.name : '';
	const message = error instanceof Error ? error.message : String(error);
	if (name === 'PasswordException' || name === 'EncryptedPDFError' || /password|encrypted/i.test(message)) return 'password';
	if (name === 'InvalidPDFException' || /invalid pdf|pdf header|pdf structure|parse|corrupt/i.test(message)) return 'corrupt';
	return 'processing';
}

export function supportedFile(file: Pick<File, 'name' | 'type'>, kind: 'pdf' | 'image') {
	if (kind === 'pdf') return /\.pdf$/i.test(file.name) && (!file.type || file.type === 'application/pdf' || file.type === 'application/octet-stream');
	return imageFileType(file) !== undefined;
}

export function imageFileType(file: Pick<File, 'name' | 'type'>) {
	if (file.type === 'image/png') return 'png';
	if (file.type === 'image/jpeg') return 'jpg';
	if (file.type && file.type !== 'application/octet-stream') return undefined;
	if (/\.png$/i.test(file.name)) return 'png';
	if (/\.(jpe?g|jpe|jfif)$/i.test(file.name)) return 'jpg';
	return undefined;
}
