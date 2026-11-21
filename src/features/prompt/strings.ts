import type {Lang} from '../../lib/i18n';
import dict from './i18n';
export {fill as fillPromptText} from '../../lib/i18n';
export const promptStrings = dict;
export function promptText(lang:Lang,key:keyof typeof dict.id):string {return dict[lang][key];}
