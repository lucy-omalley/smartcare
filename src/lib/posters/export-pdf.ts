import "server-only";

import { PDFDocument, rgb, StandardFonts, type PDFPage, type RGB } from "pdf-lib";
import QRCode from "qrcode";
import type { RoutinePosterView } from "@/types/routine-poster";
import { POSTER_LAYOUT_META } from "@/lib/posters/constants";
import { applyColourAccent, getThemeStyle } from "@/lib/posters/themes";
import { getPosterScanUrl } from "@/lib/posters/qr-links";

const MM_TO_PT = 72 / 25.4;
const PRINT_MARGIN_MM = 10;

/** pdf-lib StandardFonts only support WinAnsi — strip emoji and non-Latin-1 chars */
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

export async function generatePosterPdf(poster: RoutinePosterView, baseUrl?: string): Promise<Uint8Array> {
  const layout = POSTER_LAYOUT_META[poster.layout];
  const pageWidth = mmToPt(layout.widthMm);
  const pageHeight = mmToPt(layout.heightMm);
  const margin = mmToPt(PRINT_MARGIN_MM);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([pageWidth, pageHeight]);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

  const theme = applyColourAccent(getThemeStyle(poster.theme), poster.favouriteColours[0]);
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

  let y = pageHeight - margin - 20;

  const title = toPdfText(poster.title) || "My Routine";
  page.drawText(title.slice(0, 60), {
    x: margin,
    y,
    size: layout.widthMm < 150 ? 14 : 20,
    font,
    color: primary,
    maxWidth: pageWidth - margin * 2,
  });
  y -= 28;

  if (poster.childName) {
    page.drawText(`For ${toPdfText(poster.childName)}`, {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: textColor,
    });
    y -= 24;
  }

  const stepSize = layout.widthMm < 150 ? 10 : 12;
  const badgeSize = layout.widthMm < 150 ? 18 : 24;

  poster.steps.forEach((step, index) => {
    if (y < margin + 80) return;

    page.drawCircle({
      x: margin + badgeSize / 2,
      y: y + badgeSize / 2,
      size: badgeSize / 2,
      color: badgeFill,
    });
    page.drawText(String(index + 1), {
      x: margin + badgeSize / 2 - (index + 1 > 9 ? 5 : 3),
      y: y + badgeSize / 2 - 4,
      size: Math.max(8, badgeSize * 0.45),
      font,
      color: primary,
    });

    const stepTitle = toPdfText(step.title) || `Step ${index + 1}`;
    page.drawText(stepTitle.slice(0, 40), {
      x: margin + badgeSize + 8,
      y: y + 4,
      size: stepSize,
      font,
      color: textColor,
      maxWidth: pageWidth - margin * 2 - badgeSize - 8,
    });

    y -= badgeSize + 10;

    if (index < poster.steps.length - 1) {
      drawDownArrow(page, pageWidth / 2, y, accent);
      y -= 14;
    }
  });

  const celebration = toPdfText(poster.celebrationText ?? "");
  if (celebration) {
    page.drawText(celebration.slice(0, 80), {
      x: margin,
      y: Math.max(margin + 60, y),
      size: stepSize + 2,
      font,
      color: accent,
      maxWidth: pageWidth - margin * 2,
    });
  }

  if (poster.rewardEnabled) {
    page.drawText("Daily stars: * * *    Weekly badge", {
      x: margin,
      y: margin + 40,
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
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 120 });
  const qrBase64 = qrDataUrl.split(",")[1];
  const qrBytes = Buffer.from(qrBase64, "base64");
  const qrImage = await pdf.embedPng(qrBytes);

  page.drawImage(qrImage, {
    x: margin,
    y: margin,
    width: 50,
    height: 50,
  });

  page.drawText("Scan for today's plan", {
    x: margin + 56,
    y: margin + 20,
    size: 8,
    font: fontRegular,
    color: textColor,
  });

  if (poster.parentSignature) {
    page.drawText(`Signed: ${toPdfText(poster.parentSignature)}`, {
      x: margin + 56,
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
