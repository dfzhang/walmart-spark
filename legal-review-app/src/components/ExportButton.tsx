import { useCallback, useState } from "react";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";
import { blockToPlainText } from "../lib/diff-engine";
import type { BlockDiff } from "../lib/types";

interface ExportButtonProps {
  title: string;
  diffs: BlockDiff[];
}

/**
 * Generates a .docx file with visual change marks.
 * - Green underline text = insertions
 * - Red strikethrough text = deletions
 * - New blocks marked with "[NEW]" prefix
 * - Deleted blocks marked with "[REMOVED]" prefix
 */
export function ExportButton({ title, diffs }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const doc = generateWordDocument(title, diffs);
      const blob = await Packer.toBlob(doc);
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-review.docx`;
      saveAs(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [title, diffs]);

  return (
    <button
      className="btn btn--export"
      onClick={handleExport}
      disabled={exporting}
      type="button"
    >
      {exporting ? "Exporting…" : "📄 Export to Word"}
    </button>
  );
}

function getHeadingLevel(
  style?: string
): (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined {
  switch (style) {
    case "h2":
      return HeadingLevel.HEADING_2;
    case "h3":
      return HeadingLevel.HEADING_3;
    case "h4":
      return HeadingLevel.HEADING_4;
    default:
      return undefined;
  }
}

function generateWordDocument(
  title: string,
  diffs: BlockDiff[]
): Document {
  const children: Paragraph[] = [
    // Title
    new Paragraph({
      children: [
        new TextRun({ text: title, bold: true, size: 32 }),
      ],
      heading: HeadingLevel.HEADING_1,
    }),
    // Subtitle
    new Paragraph({
      children: [
        new TextRun({
          text: `Legal Review — Generated ${new Date().toLocaleDateString()}`,
          italics: true,
          color: "666666",
          size: 20,
        }),
      ],
    }),
    new Paragraph({ children: [] }), // spacer
  ];

  for (const diff of diffs) {
    const block = diff.type === "modified" ? diff.newBlock : diff.block;
    const style = block.style;
    const heading = getHeadingLevel(style);

    if (diff.type === "unchanged") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: blockToPlainText(diff.block),
              size: 22,
            }),
          ],
          heading,
        })
      );
    } else if (diff.type === "added") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "[NEW] ",
              bold: true,
              color: "28a745",
              size: 22,
            }),
            new TextRun({
              text: blockToPlainText(diff.block),
              color: "28a745",
              underline: { type: "single" },
              size: 22,
            }),
          ],
          heading,
        })
      );
    } else if (diff.type === "deleted") {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "[REMOVED] ",
              bold: true,
              color: "dc3545",
              size: 22,
            }),
            new TextRun({
              text: blockToPlainText(diff.block),
              color: "dc3545",
              strike: true,
              size: 22,
            }),
          ],
          heading,
        })
      );
    } else if (diff.type === "modified") {
      children.push(
        new Paragraph({
          children: diff.wordDiffs.map(
            (part) =>
              new TextRun({
                text: part.value,
                ...(part.added
                  ? {
                      color: "28a745",
                      underline: { type: "single" as const },
                    }
                  : {}),
                ...(part.removed
                  ? { color: "dc3545", strike: true }
                  : {}),
                size: 22,
              })
          ),
          heading,
        })
      );
    }
  }

  return new Document({
    sections: [{ children }],
  });
}
