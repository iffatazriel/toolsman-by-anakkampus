import { expect, it } from 'vitest';
import { taskActionState } from './task-action';

it('mirrors labels, validation/loading status and disabled state', () => {
	expect(taskActionState(' Format ', false, '  Done ', 'Formatter')).toEqual({ label: 'Format', disabled: false, status: 'Done' });
	expect(taskActionState('Download', true, '', 'Choose a file')).toEqual({ label: 'Download', disabled: true, status: 'Choose a file' });
	expect(taskActionState('Convert', false, 'Invalid input', '')).toEqual({ label: 'Convert', disabled: false, status: 'Invalid input' });
});
