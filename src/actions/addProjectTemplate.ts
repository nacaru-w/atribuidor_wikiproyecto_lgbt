import { getMessage } from '../i18n/translations';
import { getPageWikitext } from '../queries/getPageWikitext';
import { getTalkPageTitle } from '../utils/getTalkPageTitle';

/** The attribution template placed at the top of the talk page. */
const PROJECT_TEMPLATE = '{{PR|LGBT}}';

/**
 * Matches any invocation of {{PR}} or of its redirect {{Pr}} (template
 * names are case-insensitive on the first letter, so this covers every
 * casing), capturing its parameters.
 */
const PROJECT_TEMPLATE_PATTERN = /\{\{\s*[Pp][Rr]\s*\|([^{}]*)\}\}/g;

/**
 * Checks whether the wikitext already attributes the page to the LGBT+
 * wikiproject through {{PR}}, in any of its forms: positional or "1="
 * parameter, any casing, or listed among other wikiprojects.
 */
function hasProjectTemplate(wikitext: string): boolean {
    PROJECT_TEMPLATE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROJECT_TEMPLATE_PATTERN.exec(wikitext)) !== null) {
        const isAttributed = match[1].split('|').some((parameter) => {
            const value = parameter.replace(/^\s*1\s*=/, '').trim();
            return value.toLowerCase() === 'lgbt';
        });
        if (isAttributed) {
            return true;
        }
    }
    return false;
}

/**
 * Places the wikiproject attribution template at the top of the article's
 * talk page, creating the page when it does not exist. Skipped when the
 * talk page already carries the attribution.
 */
export async function addProjectTemplate(articleTitle: string): Promise<void> {
    const talkPageTitle = getTalkPageTitle(articleTitle);

    const wikitext = await getPageWikitext(talkPageTitle);
    if (wikitext !== null && hasProjectTemplate(wikitext)) {
        return;
    }

    const api = new mw.Api();
    // prependtext places the template at the very top of the page,
    // and the edit also creates the talk page when it is missing.
    await api.postWithEditToken({
        action: 'edit',
        title: talkPageTitle,
        prependtext: `${PROJECT_TEMPLATE}\n`,
        summary: getMessage('summary-template'),
    });
}
