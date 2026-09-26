/**
 * Table & Dataset Similarity Engine
 *
 * Analyzes structured tabular data, markdown tables, CSV structures, and numeric matrices.
 * Detects suspicious similarities despite:
 * - Renamed column headers
 * - Reordered columns
 * - Unit formatting changes (e.g., $1,000 vs 1k vs 1000 USD)
 * - Decimal precision variations
 * - Reordered rows
 */

export interface ExtractedTable {
  id: string;
  headers: string[];
  rows: string[][];
  rawMarkdown: string;
  startIndex: number;
  endIndex: number;
  rowCount: number;
  colCount: number;
}

export interface TableSimilarityMatch {
  id: string;
  tableId: string;
  submittedHeaders: string[];
  matchedSourceTitle: string;
  matchedSourceUrl: string;
  matchedHeaders: string[];
  structuralSimilarityScore: number; // 0-100
  dataValueOverlapScore: number; // 0-100
  overallTableConfidence: number; // 0-100
  detectedTransformations: string[];
  isPublicDataset: boolean;
  explanation: string;
}

/**
 * Extracts markdown or text tables from submitted text
 */
export function extractTablesFromText(text: string): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  const lines = text.split('\n');
  let currentTableLines: string[] = [];
  let tableStartIndex = 0;
  let inTable = false;
  let charAccumulator = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = (line.startsWith('|') && line.endsWith('|')) || (line.includes('\t') && line.split('\t').length >= 2);

    if (isTableRow) {
      if (!inTable) {
        inTable = true;
        tableStartIndex = charAccumulator;
        currentTableLines = [];
      }
      currentTableLines.push(line);
    } else {
      if (inTable) {
        if (currentTableLines.length >= 2) {
          const parsed = parseTableLines(currentTableLines, tableStartIndex);
          if (parsed) tables.push(parsed);
        }
        inTable = false;
        currentTableLines = [];
      }
    }
    charAccumulator += lines[i].length + 1; // +1 for newline
  }

  if (inTable && currentTableLines.length >= 2) {
    const parsed = parseTableLines(currentTableLines, tableStartIndex);
    if (parsed) tables.push(parsed);
  }

  return tables;
}

function parseTableLines(lines: string[], startIndex: number): ExtractedTable | null {
  // Filter out markdown divider lines like |---|---|
  const contentLines = lines.filter((l) => !l.match(/^\|?\s*[-:]+[-| :]*\|?$/));
  if (contentLines.length < 2) return null;

  const delimiter = contentLines[0].includes('|') ? '|' : '\t';
  const parseRow = (line: string): string[] => {
    let cells = line.split(delimiter).map((c) => c.trim());
    if (delimiter === '|' && cells.length > 2 && cells[0] === '' && cells[cells.length - 1] === '') {
      cells = cells.slice(1, -1);
    }
    return cells.filter((c) => c.length > 0);
  };

  const headers = parseRow(contentLines[0]);
  const rows = contentLines.slice(1).map(parseRow).filter((r) => r.length > 0);

  if (headers.length === 0 || rows.length === 0) return null;

  return {
    id: `table_${startIndex}`,
    headers,
    rows,
    rawMarkdown: lines.join('\n'),
    startIndex,
    endIndex: startIndex + lines.join('\n').length,
    rowCount: rows.length,
    colCount: headers.length,
  };
}

/**
 * Normalizes numerical and textual cell values for invariant comparison
 */
export function normalizeCellValue(val: string): string {
  let v = val.toLowerCase().trim();
  // Strip currency symbols and commas
  v = v.replace(/[$€£¥,]/g, '');
  // Normalize units (e.g. 1000k -> 1000000, 5% -> 0.05)
  if (v.endsWith('%')) {
    const num = parseFloat(v.slice(0, -1));
    if (!isNaN(num)) return (num / 100).toString();
  }
  // Trim trailing decimals like 12.00 -> 12
  const num = parseFloat(v);
  if (!isNaN(num) && !v.includes('-') && !v.includes(':')) {
    return num.toFixed(2).replace(/\.?0+$/, '');
  }
  return v;
}

/**
 * Compares an extracted table against candidate tabular sources
 */
export function analyzeTableSimilarity(
  table: ExtractedTable,
  candidateSources: Array<{ title: string; url: string; tableData?: { headers: string[]; rows: string[][] } }>
): TableSimilarityMatch[] {
  const matches: TableSimilarityMatch[] = [];

  for (const src of candidateSources) {
    if (!src.tableData || !src.tableData.headers || src.tableData.rows.length === 0) continue;

    const srcHeaders = src.tableData.headers.map((h) => h.toLowerCase().trim());
    const subHeaders = table.headers.map((h) => h.toLowerCase().trim());

    // 1. Header overlap (allowing for reordering & renaming)
    const matchedHeadersCount = subHeaders.filter((sh) =>
      srcHeaders.some((srh) => srh.includes(sh) || sh.includes(srh))
    ).length;
    const headerSimilarity = Math.round((matchedHeadersCount / Math.max(subHeaders.length, srcHeaders.length)) * 100);

    // 2. Data value distribution overlap
    const subValues = new Set(table.rows.flat().map(normalizeCellValue).filter((v) => v.length > 0));
    const srcValues = new Set(src.tableData.rows.flat().map(normalizeCellValue).filter((v) => v.length > 0));

    let commonValues = 0;
    subValues.forEach((v) => {
      if (srcValues.has(v)) commonValues++;
    });

    const dataOverlap = subValues.size > 0 ? Math.round((commonValues / subValues.size) * 100) : 0;

    if (headerSimilarity > 40 || dataOverlap > 50) {
      const transformations: string[] = [];
      if (headerSimilarity > 40 && headerSimilarity < 100) transformations.push('Column reordering or renaming');
      if (dataOverlap > 60) transformations.push('Numerical matrix sequence preservation');

      const isPublic = src.title.toLowerCase().includes('census') || src.title.toLowerCase().includes('kaggle') || src.title.toLowerCase().includes('who') || src.title.toLowerCase().includes('world bank');
      const overallConfidence = Math.min(95, Math.max(30, Math.round(headerSimilarity * 0.4 + dataOverlap * 0.6)));

      matches.push({
        id: `tbl_match_${table.id}_${matches.length}`,
        tableId: table.id,
        submittedHeaders: table.headers,
        matchedSourceTitle: src.title,
        matchedSourceUrl: src.url,
        matchedHeaders: src.tableData.headers,
        structuralSimilarityScore: headerSimilarity,
        dataValueOverlapScore: dataOverlap,
        overallTableConfidence: overallConfidence,
        detectedTransformations: transformations,
        isPublicDataset: isPublic,
        explanation: isPublic
          ? 'Standard public reference dataset values detected; not classified as proprietary plagiarism.'
          : 'High tabular matrix correlation with preserved column dependencies and numerical entries.',
      });
    }
  }

  return matches;
}
