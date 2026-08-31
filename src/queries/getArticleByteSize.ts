/** Returns the current size of the article in bytes. */
export async function getArticleByteSize(articleTitle: string): Promise<number> {
    const api = new mw.Api();
    const response = await api.get({
        action: 'query',
        titles: articleTitle,
        prop: 'info',
        formatversion: 2,
    });

    const length = response.query?.pages?.[0]?.length;
    if (typeof length !== 'number') {
        throw new Error(`Could not fetch the size of "${articleTitle}"`);
    }
    return length;
}
