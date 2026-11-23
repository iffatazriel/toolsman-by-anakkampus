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
	return /\.(png|jpe?g)$/i.test(file.name) && (!file.type || ['image/png', 'image/jpeg', 'application/octet-stream'].includes(file.type));
}
