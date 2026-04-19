import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend | null;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    this.client = key ? new Resend(key) : null;
  }

  async sendMagicLink(email: string, link: string): Promise<void> {
    const html = `
      <div style="font-family:sans-serif;background:#0D1117;color:#E6EDF3;padding:32px;border-radius:12px;max-width:480px;margin:auto">
        <h1 style="color:#39FF14">Verify your Mindy account</h1>
        <p>Click the button below to link this email to your account. The link expires in 15 minutes.</p>
        <a href="${link}" style="display:inline-block;background:#39FF14;color:#0D1117;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:700">Verify</a>
        <p style="color:#8B949E;font-size:12px;margin-top:24px">If you didn't ask for this, you can ignore this email.</p>
      </div>
    `;

    if (!this.client) {
      this.logger.warn(`[DEV] Would send magic link to ${email}: ${link}`);
      return;
    }

    const { error } = await this.client.emails.send({
      from: 'Mindy <noreply@mindy.app>',
      to: email,
      subject: 'Verify your Mindy account',
      html,
    });
    if (error) {
      this.logger.error(`Resend error: ${JSON.stringify(error)}`);
      throw new Error('Failed to send email');
    }
  }
}
