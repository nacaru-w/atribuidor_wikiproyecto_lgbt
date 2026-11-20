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

/** Locates the year's block without borrowing a closing tag from the next year. */
function findYearList(wikitext: string, year: number): { start: number; end: number } | null {
    YEAR_BLOCK_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = YEAR_BLOCK_PATTERN.exec(wikitext)) !== null) {
        if (Number(match[1]) === year) {
            const end = wikitext.indexOf(YEAR_LIST_END, match.index);
            const nextYear = YEAR_BLOCK_PATTERN.exec(wikitext);
            if (end === -1 || (nextYear && nextYear.index < end)) {
                return null;
            }
            return { start: match.index, end };
        }
    }
    return null;
}

/** Entries use both "{{small|(15 de agosto)}}" and "{{small|15 de agosto}}". */
const ENTRY_DATE_PATTERN = /\{\{\s*small\s*\|\s*\(?\s*(\d{1,2})\s+de\s+([a-záéíóúü]+)\s*\)?\s*\}\}/i;
/** Older year blocks put the date before the link, e.g. "#27.X.2014 [[David Armstrong]]". */
const LEGACY_ENTRY_DATE_PATTERN = /^#\s*(\d{1,2})\.([IVX]+)[.:]\d{4}(?=\s|$)/i;
const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

interface DayOfYear {
    month: number;
    day: number;
}

function parseEntryDate(entryLine: string): DayOfYear | null {
    const written = entryLine.match(ENTRY_DATE_PATTERN);
    if (written) {
        const month = SPANISH_MONTHS.findIndex(name => name.toLowerCase() === written[2].toLowerCase());
        return month === -1 ? null : { month, day: Number(written[1]) };
    }
    const legacy = entryLine.match(LEGACY_ENTRY_DATE_PATTERN);
    if (!legacy) {
        return null;
    }
    const month = ROMAN_MONTHS.indexOf(legacy[2].toUpperCase());
    return month === -1 ? null : { month, day: Number(legacy[1]) };
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
        const yearList = findYearList(wikitext, creationYear);
        if (!yearList) {
            throw new Error(`Could not find the ${creationYear} list on "${links.articleList}"`);
        }

        const entry = `# [[${articleTitle}]] {{small|(${formatListDate(creationDate)})}}`;
        const creationDayOfYear: DayOfYear = {
            month: creationDate.getMonth(),
            day: creationDate.getDate(),
        };

        // Only dated entries determine placement. Keep all other lines in place.
        const lines = wikitext.slice(yearList.start, yearList.end).split('\n');
        let entryIndex = lines.length;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (!/^#(?![#:;*])/.test(lines[i])) {
                continue;
            }
            const previousDate = parseEntryDate(lines[i]);
            if (!previousDate) {
                continue;
            }
            if (!isAfter(previousDate, creationDayOfYear)) {
                break;
            }
            entryIndex = i;
        }
        lines.splice(entryIndex, 0, entry);

        let text = wikitext.slice(0, yearList.start) + lines.join('\n') + wikitext.slice(yearList.end);
        text = bumpYearCounter(text, creationYear);
        text = bumpTotalCounter(text);

        return {
            text,
            summary: getMessage('summary-list'),
        };
    });
}
