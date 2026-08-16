import "server-only";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { RoutinePosterView } from "@/types/routine-poster";
import { POSTER_LAYOUT_META } from "@/lib/posters/constants";
import { applyColourAccent, getThemeStyle } from "@/lib/posters/themes";
import { getPosterScanUrl } from "@/lib/posters/qr-links";

const MM_TO_PT = 72 / 25.4;
const PRINT_MARGIN_MM = 10;

function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
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

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: hexToRgb(theme.background),
  });

  let y = pageHeight - margin - 20;

  page.drawText(poster.title.slice(0, 60), {
    x: margin,
    y,
    size: layout.widthMm < 150 ? 14 : 20,
    font,
    color: primary,
    maxWidth: pageWidth - margin * 2,
  });
  y -= 28;

  if (poster.childName) {
    page.drawText(`For ${poster.childName}`, {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: textColor,
    });
    y -= 24;
  }

  const stepSize = layout.widthMm < 150 ? 10 : 12;
  const iconSize = layout.widthMm < 150 ? 16 : 22;

  for (const step of poster.steps) {
    if (y < margin + 80) break;

    page.drawText(step.iconEmoji, {
      x: margin,
      y,
      size: iconSize,
      font,
      color: primary,
    });

    page.drawText(step.title.slice(0, 40), {
      x: margin + iconSize + 8,
      y: y + 2,
      size: stepSize,
      font,
      color: textColor,
      maxWidth: pageWidth - margin * 2 - iconSize - 8,
    });

    y -= iconSize + 14;

    page.drawText("↓", {
      x: pageWidth / 2 - 4,
      y,
      size: 14,
      font,
      color: accent,
    });
    y -= 18;
  }

  if (poster.celebrationText) {
    page.drawText(`${theme.rewardEmoji} ${poster.celebrationText}`, {
      x: margin,
      y: Math.max(margin + 60, y),
      size: stepSize + 2,
      font,
      color: accent,
      maxWidth: pageWidth - margin * 2,
    });
  }

  if (poster.rewardEnabled) {
    page.drawText("Daily stars: ⭐ ⭐ ⭐    Weekly badge: 🏆", {
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
    page.drawText(`Signed: ${poster.parentSignature}`, {
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
