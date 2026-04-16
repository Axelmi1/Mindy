/**
 * ProgressExportService
 *
 * Generates a beautiful PDF progress report for Pro users.
 * PDF includes:
 *   - User name, level, XP, streak
 *   - Domain breakdown (CRYPTO / FINANCE / TRADING)
 *   - Achievement count
 *   - Lessons completed per domain + difficulty
 *   - Activity summary
 *   - Branding: dark theme, neon green #39FF14
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0D1117',
  surface: '#161B22',
  border: '#30363D',
  primary: '#39FF14',
  text: '#E6EDF3',
  muted: '#8B949E',
  crypto: '#F7931A',
  finance: '#3B82F6',
  trading: '#A855F7',
};

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

@Injectable()
export class ProgressExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  /**
   * Get the UTC Sunday of the week containing `date`.
   * Consistent with LeaderboardService.getWeekStart().
   */
  private getWeekStart(date: Date): Date {
    const day = date.getUTCDay(); // 0 = Sunday
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day),
    );
  }

  /**
   * Generate a PDF progress report buffer for the given user.
   * @throws ForbiddenException if user is not on Pro plan
   * @throws NotFoundException if user not found
   */
  async generateProgressPdf(userId: string): Promise<Buffer> {
    // Auth check — Pro only
    const isPro = await this.subscriptions.isPro(userId);
    if (!isPro) {
      throw new ForbiddenException('PDF export is a Pro feature. Upgrade to unlock.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          include: {
            lesson: {
              select: { domain: true, difficulty: true, title: true },
            },
          },
        },
        achievements: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // ── Compute stats ──────────────────────────────────────────────────────

    const completedProgress = (user.progress as Array<{
      isCompleted: boolean;
      lesson: { domain: string; difficulty: string; title: string };
    }>).filter((p) => p.isCompleted);

    const domainStats: Record<string, { completed: number; xp: number }> = {
      CRYPTO: { completed: 0, xp: 0 },
      FINANCE: { completed: 0, xp: 0 },
      TRADING: { completed: 0, xp: 0 },
    };

    const difficultyStats: Record<string, number> = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
    };

    for (const p of completedProgress) {
      const domain = p.lesson.domain;
      const diff = p.lesson.difficulty;
      domainStats[domain].completed++;
      difficultyStats[diff]++;
    }

    const totalCompleted = completedProgress.length;
    const totalLessons = await this.prisma.lesson.count();
    const completionPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
    const achievementsCount = (user.achievements as unknown[]).length;

    // ── Weekly XP history (last 8 weeks) ─────────────────────────────────
    const now = new Date();
    const currentWeekStart = this.getWeekStart(now);

    const weeklyXpRecords = await this.prisma.weeklyXp.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: 8,
      select: { weekStart: true, xpEarned: true },
    });

    // Build 8-week array (fill missing weeks with 0)
    const weeklyXpChart: Array<{ label: string; xp: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - i * 7);
      const record = weeklyXpRecords.find(
        (r) => r.weekStart.toISOString().slice(0, 10) === weekStart.toISOString().slice(0, 10),
      );
      const label = weekStart.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      weeklyXpChart.push({ label, xp: record?.xpEarned ?? 0 });
    }

    // ── Generate PDF ───────────────────────────────────────────────────────

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 48,
        info: {
          Title: `Mindy Progress Report — ${user.username}`,
          Author: 'Mindy App',
          Subject: 'Learning Progress Report',
          CreationDate: new Date(),
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const MARGIN = 48;
      const CONTENT_W = W - MARGIN * 2;

      // ── Background ────────────────────────────────────────────────────────
      doc
        .rect(0, 0, W, doc.page.height)
        .fill(hexToRgb(COLORS.bg));

      // ── Header band ───────────────────────────────────────────────────────
      doc
        .rect(0, 0, W, 80)
        .fill(hexToRgb(COLORS.surface));

      // Logo text
      doc
        .font('Helvetica-Bold')
        .fontSize(28)
        .fillColor(hexToRgb(COLORS.primary))
        .text('MINDY', MARGIN, 24, { continued: false });

      // Tag line
      doc
        .font('Helvetica')
        .fontSize(12)
        .fillColor(hexToRgb(COLORS.muted))
        .text('Your Financial Learning Journey', MARGIN + 110, 32);

      // Date top-right
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      doc
        .fontSize(10)
        .fillColor(hexToRgb(COLORS.muted))
        .text(dateStr, MARGIN, 52, { width: CONTENT_W, align: 'right' });

      // ── Title section ─────────────────────────────────────────────────────
      doc.moveDown(3);

      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(hexToRgb(COLORS.text))
        .text(`Progress Report`, MARGIN);

      doc
        .font('Helvetica')
        .fontSize(14)
        .fillColor(hexToRgb(COLORS.muted))
        .text(`${user.username}  ·  Level ${user.level}  ·  ${user.xp.toLocaleString()} XP`, MARGIN);

      doc.moveDown(0.5);

      // Neon divider line
      doc
        .moveTo(MARGIN, doc.y)
        .lineTo(MARGIN + CONTENT_W, doc.y)
        .strokeColor(hexToRgb(COLORS.primary))
        .lineWidth(2)
        .stroke();

      doc.moveDown(1);

      // ── Stats row ─────────────────────────────────────────────────────────
      const statY = doc.y;
      const statBoxW = Math.floor(CONTENT_W / 4) - 8;

      const stats = [
        { label: 'Streak', value: `${user.streak} 🔥`, sub: `Best: ${user.maxStreak}` },
        { label: 'Lessons Done', value: String(totalCompleted), sub: `${completionPct}% complete` },
        { label: 'Achievements', value: String(achievementsCount), sub: 'Unlocked' },
        { label: 'Total XP', value: user.xp.toLocaleString(), sub: `Level ${user.level}` },
      ];

      stats.forEach((s, i) => {
        const x = MARGIN + i * (statBoxW + 8);

        // Box background
        doc
          .roundedRect(x, statY, statBoxW, 64, 6)
          .fill(hexToRgb(COLORS.surface));

        // Value
        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor(hexToRgb(COLORS.primary))
          .text(s.value, x + 10, statY + 10, { width: statBoxW - 20, align: 'center' });

        // Label
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(hexToRgb(COLORS.muted))
          .text(s.label.toUpperCase(), x + 10, statY + 36, { width: statBoxW - 20, align: 'center' });

        // Sub
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(hexToRgb(COLORS.muted))
          .text(s.sub, x + 10, statY + 50, { width: statBoxW - 20, align: 'center' });
      });

      doc.y = statY + 80;
      doc.moveDown(1);

      // ── Domain Breakdown ──────────────────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(hexToRgb(COLORS.text))
        .text('Domain Breakdown', MARGIN);

      doc.moveDown(0.5);

      const domainColors: Record<string, string> = {
        CRYPTO: COLORS.crypto,
        FINANCE: COLORS.finance,
        TRADING: COLORS.trading,
      };

      const domainEmoji: Record<string, string> = {
        CRYPTO: '₿',
        FINANCE: '💰',
        TRADING: '📈',
      };

      const domainBarY = doc.y;
      const barW = CONTENT_W;
      const BAR_H = 48;
      const totalForBar = Object.values(domainStats).reduce((s, d) => s + d.completed, 0) || 1;

      let barX = MARGIN;
      let legendX = MARGIN;
      const legendY = domainBarY + BAR_H + 10;

      // Background bar
      doc
        .roundedRect(MARGIN, domainBarY, barW, BAR_H, 6)
        .fill(hexToRgb(COLORS.surface));

      // Colored segments
      for (const [domain, stat] of Object.entries(domainStats)) {
        const segW = Math.round((stat.completed / totalForBar) * barW);
        if (segW > 0) {
          doc
            .rect(barX, domainBarY, segW, BAR_H)
            .fill(hexToRgb(domainColors[domain]));
          barX += segW;
        }
      }

      // Legend
      for (const [domain, stat] of Object.entries(domainStats)) {
        doc
          .circle(legendX + 6, legendY + 6, 6)
          .fill(hexToRgb(domainColors[domain]));

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(hexToRgb(COLORS.text))
          .text(`${domainEmoji[domain]} ${domain}`, legendX + 16, legendY + 1);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(hexToRgb(COLORS.muted))
          .text(`${stat.completed} lessons`, legendX + 16, legendY + 13);

        legendX += 150;
      }

      doc.y = legendY + 32;
      doc.moveDown(1);

      // ── Difficulty Progress ────────────────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(hexToRgb(COLORS.text))
        .text('Difficulty Progress', MARGIN);

      doc.moveDown(0.5);

      const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
      const diffColors = ['#22C55E', '#EAB308', '#EF4444'];
      const diffLabels = ['Beginner 🌱', 'Intermediate ⚡', 'Advanced 🔥'];

      difficulties.forEach((diff, i) => {
        const count = difficultyStats[diff] ?? 0;
        const rowY = doc.y;

        // Label
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(hexToRgb(COLORS.text))
          .text(diffLabels[i], MARGIN, rowY + 2, { width: 120 });

        // Bar background
        const BAR_START = MARGIN + 130;
        const BAR_TRACK_W = CONTENT_W - 130 - 50;

        doc
          .roundedRect(BAR_START, rowY, BAR_TRACK_W, 16, 4)
          .fill(hexToRgb(COLORS.surface));

        // Bar fill (max display at total completed or 1)
        const maxCount = Math.max(totalCompleted, 1);
        const fillW = Math.max(8, Math.round((count / maxCount) * BAR_TRACK_W));

        doc
          .roundedRect(BAR_START, rowY, fillW, 16, 4)
          .fill(hexToRgb(diffColors[i]));

        // Count label
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(hexToRgb(COLORS.muted))
          .text(String(count), BAR_START + BAR_TRACK_W + 8, rowY + 2);

        doc.y = rowY + 26;
      });

      doc.moveDown(1.5);

      // ── Weekly XP Chart ───────────────────────────────────────────────────
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(hexToRgb(COLORS.text))
        .text('XP — 8 dernières semaines', MARGIN);

      doc.moveDown(0.5);

      const maxWeekXp = Math.max(...weeklyXpChart.map((w) => w.xp), 1);
      const chartHeight = 80;
      const barGroupW = Math.floor(CONTENT_W / 8);
      const chartBarW = Math.max(10, barGroupW - 12);
      const chartBaseY = doc.y + chartHeight;

      // Chart background
      doc
        .roundedRect(MARGIN, doc.y, CONTENT_W, chartHeight + 22, 6)
        .fill(hexToRgb(COLORS.surface));

      weeklyXpChart.forEach((week, i) => {
        const barH = week.xp > 0 ? Math.max(4, Math.round((week.xp / maxWeekXp) * (chartHeight - 8))) : 2;
        const x = MARGIN + i * barGroupW + Math.floor((barGroupW - chartBarW) / 2);
        const y = chartBaseY - barH;

        // Dimmer bar for weeks with 0 XP
        const barColor = week.xp > 0 ? COLORS.primary : COLORS.border;

        doc
          .roundedRect(x, y, chartBarW, barH, 3)
          .fill(hexToRgb(barColor));

        // XP label on top (only if > 0 and bar tall enough)
        if (week.xp > 0 && barH > 14) {
          doc
            .font('Helvetica-Bold')
            .fontSize(7)
            .fillColor(hexToRgb(COLORS.bg))
            .text(String(week.xp), x, y + 3, { width: chartBarW, align: 'center' });
        }

        // Date label below
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor(hexToRgb(COLORS.muted))
          .text(week.label, x - 2, chartBaseY + 6, { width: chartBarW + 4, align: 'center' });
      });

      doc.y = chartBaseY + 28;
      doc.moveDown(1.5);

      // ── Footer ────────────────────────────────────────────────────────────
      const footerY = doc.page.height - 50;

      doc
        .moveTo(MARGIN, footerY)
        .lineTo(MARGIN + CONTENT_W, footerY)
        .strokeColor(hexToRgb(COLORS.border))
        .lineWidth(1)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(hexToRgb(COLORS.muted))
        .text(
          'Generated by Mindy — The Duolingo for Crypto & Finance  ·  mindy.app',
          MARGIN,
          footerY + 10,
          { width: CONTENT_W, align: 'center' },
        );

      doc.end();
    });
  }
}
