import { links } from '../config/links';
import { getMessage } from '../i18n/translations';
import { getArticleCreationDate } from '../queries/getArticleCreationDate';
import { containsArticleLink } from '../utils/containsArticleLink';
import { formatListDate } from '../utils/formatListDate';
import { SPANISH_MONTHS } from '../utils/spanishMonths';

/** Matches the heading of a year's collapsible block, capturing the year. */
const YEAR_BLOCK_PATTERN = /\{\{Plegable\s*\|\s*título\s*=\s*(\d{4})/g;

/**
 * Closing markup of a year's list: every block ends with "</div>" on its
 * own boundary (followed by "}}" either on the same line or the next one).
 */
const YEAR_LIST_END = '\n</div>';

/**
 * Returns the position right after the last entry of the given year's
 * block, or -1 when the page has no block for that year.
 */
function findYearListEnd(wikitext: string, year: number): number {
    YEAR_BLOCK_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = YEAR_BLOCK_PATTERN.exec(wikitext)) !== null) {
        if (Number(match[1]) === year) {
            return wikitext.indexOf(YEAR_LIST_END, match.index);
        }
    }
    return -1;
}

/** Matches the date of a list entry, e.g. "{{small|(15 de agosto)}}". */
const ENTRY_DATE_PATTERN = /\{\{small\|\((\d{1,2}) de ([a-záéíóúü]+)\)\}\}/i;

interface DayOfYear {
    month: number;
    day: number;
}

function parseEntryDate(entryLine: string): DayOfYear | null {
    const match = entryLine.match(ENTRY_DATE_PATTERN);
    if (!match) {
        return null;
    }
    const month = SPANISH_MONTHS.findIndex((name) => name.toLowerCase() === match[2].toLowerCase());
    if (month === -1) {
        return null;
    }
    return { month, day: Number(match[1]) };
}

function isAfter(a: DayOfYear, b: DayOfYear): boolean {
    return a.month > b.month || (a.month === b.month && a.day > b.day);
}

/**
 * Increments the given year's count in the {{Gráfica de evolución}}
 * template at the top of the page.
 */
function bumpYearCounter(wikitext: string, year: number): string {
    const graphStart = wikitext.indexOf('{{Gráfica de evolución');
    if (graphStart === -1) {
        throw new Error(`Could not find the evolution graph on "${links.articleList}"`);
    }
    const graphEnd = wikitext.indexOf('}}', graphStart);
    const graph = wikitext.slice(graphStart, graphEnd);

    const yearCountPattern = new RegExp(`(\\|\\s*${year}\\s*\\|\\s*)(\\d+)`);
    if (!yearCountPattern.test(graph)) {
        throw new Error(`Could not find the ${year} count in the evolution graph on "${links.articleList}"`);
    }
    const updatedGraph = graph.replace(
        yearCountPattern,
        (_match, prefix: string, count: string) => `${prefix}${Number(count) + 1}`,
    );
    return wikitext.slice(0, graphStart) + updatedGraph + wikitext.slice(graphEnd);
}

/** Increments the total shown in the {{cuadro}} template at the top of the page. */
function bumpTotalCounter(wikitext: string): string {
    const totalPattern = /(contenido=<big>''')(\d+)('''<\/big>)/;
    if (!totalPattern.test(wikitext)) {
        throw new Error(`Could not find the total counter on "${links.articleList}"`);
    }
    return wikitext.replace(
        totalPattern,
        (_match, prefix: string, total: string, suffix: string) => `${prefix}${Number(total) + 1}${suffix}`,
    );
}

/**
 * Adds the article to the wikiproject's created-articles page, dated and
 * placed chronologically according to its creation date: inside the block
 * of the creation year, ordered by month and day among its entries.
 * The same edit also updates the page's counters: the creation year's
 * count in the evolution graph and the total.
 */
export async function addCreatedArticleToList(articleTitle: string): Promise<void> {
    const creationDate = await getArticleCreationDate(articleTitle);
    const api = new mw.Api();
    // api.edit() re-fetches the page and detects edit conflicts through
    // basetimestamp, so the transform always works on fresh wikitext.
    await api.edit(links.articleList, (revision) => {
        const wikitext = revision.content;

        // Someone may have listed the article since the initial check:
        // returning the text unchanged results in a no-op edit.
        if (containsArticleLink(wikitext, articleTitle)) {
            return { text: wikitext, summary: getMessage('summary-list') };
        }

        const creationYear = creationDate.getFullYear();
        const insertionPoint = findYearListEnd(wikitext, creationYear);
        if (insertionPoint === -1) {
            throw new Error(`Could not find the ${creationYear} list on "${links.articleList}"`);
        }

        const entry = `# [[${articleTitle}]] {{small|(${formatListDate(creationDate)})}}`;
        const creationDayOfYear: DayOfYear = {
            month: creationDate.getMonth(),
            day: creationDate.getDate(),
        };

        // Walk back over the entries created after this article, so the new
        // entry lands in chronological order. Anything unexpected (a non-entry
        // line or an unparsable date) stops the walk, falling back to
        // inserting at the end of the list.
        const lines = wikitext.slice(0, insertionPoint).split('\n');
        let entryIndex = lines.length;
        while (entryIndex > 0) {
            const previousLine = lines[entryIndex - 1];
            if (!previousLine.startsWith('# ')) {
                break;
            }
            const previousDate = parseEntryDate(previousLine);
            if (!previousDate || !isAfter(previousDate, creationDayOfYear)) {
                break;
            }
            entryIndex--;
        }
        lines.splice(entryIndex, 0, entry);

        let text = lines.join('\n') + wikitext.slice(insertionPoint);
        text = bumpYearCounter(text, creationYear);
        text = bumpTotalCounter(text);

        return {
            text,
            summary: getMessage('summary-list'),
        };
    });
}
