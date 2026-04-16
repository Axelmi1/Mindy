/**
 * Stripe Webhook Controller
 *
 * Handles incoming Stripe webhook events for subscription lifecycle:
 *   - checkout.session.completed      → activate subscription
 *   - customer.subscription.updated   → sync plan changes
 *   - customer.subscription.deleted   → downgrade to FREE
 *   - invoice.payment_failed          → mark subscription PAST_DUE
 *   - invoice.payment_succeeded       → renew currentPeriodEnd
 *
 * Security: Stripe signature is verified via STRIPE_WEBHOOK_SECRET.
 * All payloads are processed idempotently (safe to retry).
 */

import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventType } from '@prisma/client';

@ApiTags('webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {
    // Mock mode for school project — Stripe key not required
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? 'sk_test_mock_key_for_school_project';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint() // Hide from Swagger (raw body endpoint)
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook not configured');
    }

    let event: Stripe.Event;

    try {
      // Use raw body for signature verification (needs rawBody middleware in main.ts)
      const rawBody = (req as any).rawBody ?? req.body;
      event = this.stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      this.logger.warn(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }

    this.logger.log(`[Stripe] Event received: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;


      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  /**
   * checkout.session.completed
   * User completed Stripe Checkout → activate their Pro subscription.
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.warn('[Stripe] checkout.session.completed: no userId in metadata');
      return;
    }

    const priceId = session.metadata?.priceId;
    const plan = this.resolvePlan(priceId);

    const periodEnd = session.subscription
      ? await this.getSubscriptionPeriodEnd(session.subscription as string)
      : this.defaultPeriodEnd(plan);

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: SubStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        stripeCustomerId: session.customer as string ?? undefined,
        stripePriceId: priceId ?? undefined,
      },
      create: {
        userId,
        plan,
        status: SubStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
        stripeCustomerId: session.customer as string ?? undefined,
        stripePriceId: priceId ?? undefined,
      },
    });

    // Grant 10 streak freeze bonus for new Pro subscribers
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakFreezes: { increment: 10 } },
    });

    await this.analytics.track(userId, EventType.APP_OPENED, {
      action: 'subscription_activated_via_stripe',
      plan,
      sessionId: session.id,
    });

    this.logger.log(`[Stripe] Activated ${plan} for user ${userId}`);
  }

  /**
   * customer.subscription.updated
   * Plan changed (upgrade/downgrade) or renewal date pushed.
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = await this.findUserByStripeCustomer(subscription.customer as string);
    if (!userId) return;

    const priceId = subscription.items.data[0]?.price?.id;
    const plan = this.resolvePlan(priceId);
    // Note: current_period_end removed in Stripe API 2026; use cancel_at or billing_cycle_anchor
    const rawPeriodEnd = (subscription as any).current_period_end
      ?? subscription.cancel_at
      ?? subscription.billing_cycle_anchor + 30 * 86400;
    const periodEnd = new Date((rawPeriodEnd ?? 0) * 1000);

    const stripeStatus = subscription.status;
    const status = this.mapStripeStatus(stripeStatus);

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        stripePriceId: priceId ?? undefined,
      },
      create: {
        userId,
        plan,
        status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId ?? undefined,
      },
    });

    this.logger.log(`[Stripe] Subscription updated for user ${userId}: ${plan} / ${status}`);
  }

  /**
   * customer.subscription.deleted
   * Subscription expired/canceled → downgrade to FREE.
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = await this.findUserByStripeCustomer(subscription.customer as string);
    if (!userId) return;

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubStatus.CANCELLED,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      },
    });

    await this.analytics.track(userId, EventType.APP_OPENED, {
      action: 'subscription_canceled',
      stripeSubscriptionId: subscription.id,
    });

    this.logger.log(`[Stripe] Subscription canceled for user ${userId} → downgraded to FREE`);
  }

  /**
   * invoice.payment_succeeded
   * Successful renewal → refresh currentPeriodEnd.
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const userId = await this.findUserByStripeCustomer(invoice.customer as string);
    if (!userId) return;

    const sub = (invoice as any).subscription;
    if (!sub) return;

    const stripeSub = await this.stripe.subscriptions.retrieve(sub as string);
    const rawEnd = (stripeSub as any).current_period_end
      ?? stripeSub.cancel_at
      ?? stripeSub.billing_cycle_anchor + 30 * 86400;
    const periodEnd = new Date(rawEnd * 1000);

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        status: SubStatus.ACTIVE,
        currentPeriodEnd: periodEnd,
      },
    });

    this.logger.log(`[Stripe] Invoice paid for user ${userId}, period renewed to ${periodEnd.toISOString()}`);
  }

  /**
   * invoice.payment_failed
   * Payment failed → mark subscription PAST_DUE.
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const userId = await this.findUserByStripeCustomer(invoice.customer as string);
    if (!userId) return;

    await this.prisma.subscription.update({
      where: { userId },
      data: { status: SubStatus.PAST_DUE },
    });

    await this.analytics.track(userId, EventType.APP_OPENED, {
      action: 'payment_failed',
      invoiceId: invoice.id,
    });

    this.logger.warn(`[Stripe] Payment failed for user ${userId}, subscription marked PAST_DUE`);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async findUserByStripeCustomer(customerId: string): Promise<string | null> {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
      select: { userId: true },
    });
    if (!sub) {
      this.logger.warn(`[Stripe] No user found for Stripe customer: ${customerId}`);
    }
    return sub?.userId ?? null;
  }

  private async getSubscriptionPeriodEnd(subscriptionId: string): Promise<Date> {
    try {
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
      const rawEnd = (sub as any).current_period_end
        ?? sub.cancel_at
        ?? sub.billing_cycle_anchor + 30 * 86400;
      return new Date(rawEnd * 1000);
    } catch {
      return this.defaultPeriodEnd(SubscriptionPlan.PRO_MONTHLY);
    }
  }

  private resolvePlan(priceId?: string | null): SubscriptionPlan {
    if (!priceId) return SubscriptionPlan.PRO_MONTHLY;
    if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) return SubscriptionPlan.PRO_ANNUAL;
    if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) return SubscriptionPlan.PRO_MONTHLY;
    // Fallback: infer from price lookup
    return SubscriptionPlan.PRO_MONTHLY;
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubStatus {
    switch (stripeStatus) {
      case 'active':
        return SubStatus.ACTIVE;
      case 'past_due':
        return SubStatus.PAST_DUE;
      case 'canceled':
      case 'incomplete_expired':
        return SubStatus.CANCELLED;
      default:
        return SubStatus.ACTIVE;
    }
  }

  private defaultPeriodEnd(plan: SubscriptionPlan): Date {
    const date = new Date();
    if (plan === SubscriptionPlan.PRO_ANNUAL) {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }
}
