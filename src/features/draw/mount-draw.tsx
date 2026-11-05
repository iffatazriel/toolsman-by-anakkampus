import { createRoot } from 'react-dom/client';
import ExcalidrawCanvas from './ExcalidrawCanvas';

export function mountDraw(container: Element | null): void {
	if (!container) return;
	createRoot(container).render(<ExcalidrawCanvas />);
}
