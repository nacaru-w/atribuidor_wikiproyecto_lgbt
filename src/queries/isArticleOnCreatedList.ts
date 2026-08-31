import { links } from '../config/links';
import { containsArticleLink } from '../utils/containsArticleLink';
import { getPageWikitext } from './getPageWikitext';

/**
 * Checks whether the given article already appears as a [[link]] on the
 * wikiproject's created-articles list page.
 */
export async function isArticleOnCreatedList(articleTitle: string): Promise<boolean> {
    const wikitext = await getPageWikitext(links.articleList);
    if (wikitext === null) {
        throw new Error(`"${links.articleList}" does not exist`);
    }
    return containsArticleLink(wikitext, articleTitle);
}
