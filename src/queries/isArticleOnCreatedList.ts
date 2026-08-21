import { links } from '../config/links';

/**
 * Checks whether the given article already appears as a [[link]] on the
 * wikiproject's created-articles list page.
 */
export async function isArticleOnCreatedList(articleTitle: string): Promise<boolean> {
    const api = new mw.Api();
    const response = await api.get({
        action: 'query',
        titles: links.articleList,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        formatversion: 2,
    });

    const wikitext: string = response.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content;
    if (typeof wikitext !== 'string') {
        throw new Error(`Could not fetch the contents of "${links.articleList}"`);
    }

    return wikitext.includes(`[[${articleTitle}]]`) || wikitext.includes(`[[${articleTitle}|`);
}
