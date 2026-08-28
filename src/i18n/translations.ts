const DEFAULT_LANGUAGE = 'es';

const translations = {
    es: {
        'title': 'Atribuidor Wikiproyecto LGBT+',
        'loaded': 'Atribuidor cargado 🏳️‍🌈',
        'double-load': 'El Atribuidor LGBT se ha intentado cargar más de una vez. Por favor, soluciona la doble importación o contacta con el usuario @Nacaru para informar de esto.',
        'status-template': 'Añadiendo la plantilla {{pr|LGBT}} a la página de discusión…',
        'status-list': 'Añadiendo el artículo a la lista del Wikiproyecto LGBT+…',
        'status-counter': 'Actualizando el contador de artículos creados…',
        'success': 'Atribución completada con éxito 🏳️‍🌈',
        'error': 'El Atribuidor LGBT ha encontrado un error. Por favor, inténtalo de nuevo o contacta con el usuario @Nacaru.',
        'summary-template': 'Añadiendo plantilla del Wikiproyecto LGBT+ ([[WP:AtribuidorLGBT|Atribuidor]])',
        'summary-list': 'Añadiendo artículo a la lista de artículos creados ([[WP:AtribuidorLGBT|Atribuidor]])',
        'summary-counter': 'Actualizando el contador de artículos creados ([[WP:AtribuidorLGBT|Atribuidor]])',
        'button-tooltip': 'Atribuir este artículo al Wikiproyecto LGBT+',
        'button-tooltip-done': 'Este artículo ya está en la lista de artículos creados del Wikiproyecto LGBT+',
        'attribution-confirm': '¿Quieres atribuir el artículo al Wikiproyecto LGBT+?',
        'monthly-event-confirm': '¿Quieres añadir también este artículo a la tabla del evento del mes?',
        'monthly-event-dialog-title': 'Añadir al evento del mes',
        'monthly-event-origin-label': 'Tipo de artículo',
        'monthly-event-origin-created': 'Artículo de nueva creación',
        'monthly-event-origin-translated': 'Traducción',
        'monthly-event-wikidata-label': 'Elemento de Wikidata (p. ej. Q91725538)',
        'monthly-event-accept': 'Añadir',
        'monthly-event-cancel': 'Cancelar',
        'status-monthly-event': 'Añadiendo el artículo a la tabla del evento del mes…',
        'summary-monthly-event': 'Añadiendo artículo a la tabla del evento del mes ([[WP:AtribuidorLGBT|Atribuidor]])',
    },
} as const;

export type MessageKey = keyof typeof translations[typeof DEFAULT_LANGUAGE];

export function getMessage(key: MessageKey): string {
    const language = mw.config.get('wgUserLanguage') as keyof typeof translations;
    const table = translations[language] ?? translations[DEFAULT_LANGUAGE];
    return table[key] ?? translations[DEFAULT_LANGUAGE][key];
}
