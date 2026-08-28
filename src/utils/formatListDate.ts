import { SPANISH_MONTHS } from './spanishMonths';

/**
 * Formats a date the way the created-articles list entries do,
 * e.g. "27 de agosto".
 */
export function formatListDate(date: Date): string {
    return `${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()].toLowerCase()}`;
}
