const ANEXO_PREFIX = 'Anexo:';

/**
 * Returns the talk page title of an article: "Discusión:" for the
 * main namespace, "Anexo discusión:" for anexos.
 */
export function getTalkPageTitle(articleTitle: string): string {
    if (articleTitle.startsWith(ANEXO_PREFIX)) {
        return `Anexo discusión:${articleTitle.slice(ANEXO_PREFIX.length)}`;
    }
    return `Discusión:${articleTitle}`;
}
