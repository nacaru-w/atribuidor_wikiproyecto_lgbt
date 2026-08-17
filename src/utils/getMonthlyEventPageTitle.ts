import { links } from '../config/links';

const SPANISH_MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
] as const;

/**
 * Builds the title of the current monthly event page,
 * e.g. "Wikiproyecto:LGBT/Evento del mes/2026/Agosto".
 */
export function getMonthlyEventPageTitle(date: Date = new Date()): string {
    return `${links.monthlyEventBase}/${date.getFullYear()}/${SPANISH_MONTHS[date.getMonth()]}`;
}
