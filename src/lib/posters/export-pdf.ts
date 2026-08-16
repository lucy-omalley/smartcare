import "server-only";

import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import QRCode from "qrcode";
import type { RoutinePosterView } from "@/types/routine-poster";
import { POSTER_LAYOUT_META } from "@/lib/posters/constants";
import { applyColourAccent, getThemeStyle } from "@/lib/posters/themes";
import { getPosterScanUrl } from "@/lib/posters/qr-links";
import { fetchEmojiPngMap } from "@/lib/posters/emoji-images";

const MM_TO_PT = 72 / 25.4;
const PRINT_MARGIN_MM = 10;

/** pdf-lib StandardFonts only support WinAnsi — strip emoji from text labels */
function toPdfText(value: string): string {
  return value
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[^\x00-\xFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

function drawDownArrow(page: PDFPage, centerX: number, y: number, color: RGB) {
  page.drawLine({
    start: { x: centerX, y: y + 8 },
    end: { x: centerX, y: y - 4 },
    thickness: 1.5,
    color,
  });
  page.drawLine({
    start: { x: centerX - 4, y: y - 2 },
    end: { x: centerX, y: y - 6 },
    thickness: 1.5,
    color,
  });
  page.drawLine({
    start: { x: centerX + 4, y: y - 2 },
    end: { x: centerX, y: y - 6 },
    thickness: 1.5,
    color,
  });
}

async function embedEmojiImages(
  pdf: PDFDocument,
  emojiPngs: Map<string, Uint8Array>
): Promise<Map<string, PDFImage>> {
  const embedded = new Map<string, PDFImage>();
  await Promise.all(
    Array.from(emojiPngs.entries()).map(async ([emoji, bytes]) => {
      try {
        embedded.set(emoji, await pdf.embedPng(bytes));
      } catch {
        /* skip bad png */
      }
    })
  );
  return embedded;
}

function drawEmojiImage(
  page: PDFPage,
  images: Map<string, PDFImage>,
  emoji: string,
  x: number,
  y: number,
  size: number
): boolean {
  const img = images.get(emoji.trim());
  if (!img) return false;
  page.drawImage(img, { x, y, width: size, height: size });
  return true;
}

function drawNumberBadge(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  x: number,
  y: number,
  index: number,
  size: number,
  fill: RGB,
  text: RGB
) {
  page.drawCircle({ x: x + size / 2, y: y + size / 2, size: size / 2, color: fill });
  page.drawText(String(index + 1), {
    x: x + size / 2 - (index + 1 > 9 ? 5 : 3),
    y: y + size / 2 - 4,
    size: Math.max(8, size * 0.45),
    font,
    color: text,
  });
}

export async function generatePosterPdf(poster: RoutinePosterView, baseUrl?: string): Promise<Uint8Array> {
  const layout = POSTER_LAYOUT_META[poster.layout];
  const pageWidth = mmToPt(layout.widthMm);
  const pageHeight = mmToPt(layout.heightMm);
  const margin = mmToPt(PRINT_MARGIN_MM);
  const isCompact = layout.widthMm < 150;

  const theme = applyColourAccent(getThemeStyle(poster.theme), poster.favouriteColours[0]);

  const emojisToFetch = [
    theme.emoji,
    theme.rewardEmoji,
    "⭐",
    "🏆",
    ...poster.steps.map((s) => s.iconEmoji),
  ];
  const emojiPngs = await fetchEmojiPngMap(emojisToFetch);

  const pdf = await PDFDocument.create();
  const embeddedEmojis = await embedEmojiImages(pdf, emojiPngs);
  const page = pdf.addPage([pageWidth, pageHeight]);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  const primary = hexToRgb(theme.primary);
  const accent = hexToRgb(theme.accent);
  const textColor = hexToRgb(theme.text);
  const badgeFill = hexToRgb(theme.secondary);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: hexToRgb(theme.background),
  });

  let y = pageHeight - margin;
  const headerIconSize = isCompact ? 22 : 28;
  const titleSize = isCompact ? 14 : 18;
  const titleX = margin + headerIconSize + 8;

  drawEmojiImage(page, embeddedEmojis, theme.emoji, margin, y - headerIconSize, headerIconSize);

  const title = toPdfText(poster.title) || "My Routine";
  page.drawText(title.slice(0, 60), {
    x: titleX,
    y: y - headerIconSize + 6,
    size: titleSize,
    font,
    color: primary,
    maxWidth: pageWidth - titleX - margin,
  });
  y -= headerIconSize + 16;

  if (poster.childName) {
    page.drawText(`For ${toPdfText(poster.childName)}`, {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: textColor,
    });
    y -= 22;
  }

  const stepSize = isCompact ? 10 : 12;
  const iconSize = isCompact ? 26 : 34;

  for (let index = 0; index < poster.steps.length; index++) {
    const step = poster.steps[index];
    if (y < margin + 90) break;

    const hasIcon = drawEmojiImage(page, embeddedEmojis, step.iconEmoji, margin, y, iconSize);
    if (!hasIcon) {
      drawNumberBadge(page, font, margin, y, index, iconSize, badgeFill, primary);
    }

    const stepTitle = toPdfText(step.title) || `Step ${index + 1}`;
    page.drawText(stepTitle.slice(0, 40), {
      x: margin + iconSize + 10,
      y: y + iconSize / 2 - 5,
      size: stepSize,
      font,
      color: textColor,
      maxWidth: pageWidth - margin * 2 - iconSize - 10,
    });

    y -= iconSize + 12;

    if (index < poster.steps.length - 1) {
      drawDownArrow(page, pageWidth / 2, y, accent);
      y -= 14;
    }
  }

  const celebration = toPdfText(poster.celebrationText ?? "");
  if (celebration) {
    const celebY = Math.max(margin + 70, y);
    const rewardIconSize = isCompact ? 16 : 20;
    drawEmojiImage(page, embeddedEmojis, theme.rewardEmoji, margin, celebY - 2, rewardIconSize);
    page.drawText(celebration.slice(0, 80), {
      x: margin + rewardIconSize + 6,
      y: celebY,
      size: stepSize + 2,
      font,
      color: accent,
      maxWidth: pageWidth - margin * 2 - rewardIconSize - 6,
    });
    y = celebY - 20;
  }

  if (poster.rewardEnabled) {
    const rewardY = margin + 44;
    const starSize = 14;
    page.drawText("Daily reward:", {
      x: margin,
      y: rewardY + 4,
      size: 9,
      font: fontRegular,
      color: textColor,
    });
    for (let i = 0; i < 3; i++) {
      drawEmojiImage(page, embeddedEmojis, "⭐", margin + 68 + i * (starSize + 4), rewardY, starSize);
    }
    drawEmojiImage(page, embeddedEmojis, "🏆", margin + 130, rewardY, starSize);
    page.drawText("Weekly badge", {
      x: margin + 148,
      y: rewardY + 3,
      size: 9,
      font: fontRegular,
      color: textColor,
    });
  }

  if (poster.stickerSpaceEnabled) {
    page.drawRectangle({
      x: pageWidth - margin - 60,
      y: margin,
      width: 60,
      height: 60,
      borderColor: accent,
      borderWidth: 1,
    });
    page.drawText("Stickers", {
      x: pageWidth - margin - 52,
      y: margin + 22,
      size: 8,
      font: fontRegular,
      color: textColor,
    });
  }

  const scanUrl = getPosterScanUrl(poster.id, baseUrl);
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 256 });
  const qrBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
  const qrImage = await pdf.embedPng(qrBytes);

  const qrSize = isCompact ? 44 : 56;
  page.drawImage(qrImage, {
    x: margin,
    y: margin,
    width: qrSize,
    height: qrSize,
  });

  page.drawText("Scan for today's plan", {
    x: margin + qrSize + 8,
    y: margin + qrSize / 2 + 4,
    size: 8,
    font: fontRegular,
    color: textColor,
  });

  if (poster.parentSignature) {
    page.drawText(`Signed: ${toPdfText(poster.parentSignature)}`, {
      x: margin + qrSize + 8,
      y: margin + 8,
      size: 8,
      font: fontRegular,
      color: textColor,
    });
  }

  return pdf.save();
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
