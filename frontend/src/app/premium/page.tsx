"use client";

import React, { useState } from "react";
import { Crown, Check, Sparkles, ShieldCheck, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  loadRazorpayScript,
  paymentService,
} from "@/services/payment.service";
import { normalizeApiError } from "@/lib/api-client";
import { MEMBERSHIP_PLANS } from "@/config/routes";
import { PaidMembershipTier } from "@/types";
import { cn, formatFullName } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function PremiumPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<PaidMembershipTier | null>(
    null
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyMembershipStatus = async () => {
    try {
      setIsVerifying(true);
      const status = await paymentService.verifyPremium();
      await refreshProfile();
      if (status.isPremium) {
        toast({
          title: `Active ${status.membershipType?.toUpperCase()} Membership!`,
          description: "Your premium developer perks are unlocked.",
          variant: "success",
        });
      } else {
        toast({
          title: "Free Tier Active",
          description:
            "Upgrade to Silver or Gold below to unlock premium features.",
          variant: "info",
        });
      }
    } catch (err) {
      toast({
        title: "Verification failed",
        description: normalizeApiError(err).message,
        variant: "error",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpgrade = async (membershipType: PaidMembershipTier) => {
    try {
      setLoadingTier(membershipType);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error(
          "Failed to load Razorpay Checkout SDK. Check your internet connection."
        );
      }

      const orderData = await paymentService.createOrder(membershipType);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "DevTinder",
        description: `Upgrade to ${membershipType.toUpperCase()} Membership`,
        order_id: orderData.orderId,
        prefill: {
          name: formatFullName(
            orderData.notes?.firstName || user?.firstName,
            orderData.notes?.lastName || user?.lastName
          ),
          email: user?.emailId || "",
        },
        theme: {
          color: "#e11d48",
        },
        handler: async () => {
          toast({
            title: "Payment Captured!",
            description:
              "Verifying your membership status with the Payment Service...",
            variant: "success",
          });
          await verifyMembershipStatus();
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast({
        title: "Could not initiate checkout",
        description: normalizeApiError(err).message,
        variant: "error",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <Badge variant="gold" className="px-3.5 py-1 text-xs">
            <Crown className="w-3.5 h-3.5" />
            DevTinder Premium Memberships
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Supercharge Your Developer Network
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Stand out with a verified badge, get priority placement in discovery
            feeds, and unlock unlimited daily swipes.
          </p>
        </div>

        {/* Current Membership Banner */}
        <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Current Plan:{" "}
                <span className="text-amber-400">
                  {user?.isPremium
                    ? `${(user.membershipType || "Premium").toUpperCase()} MEMBER`
                    : "FREE DEVELOPER TIER"}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Payments are processed securely via Razorpay and synced via BullMQ events
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            isLoading={isVerifying}
            onClick={verifyMembershipStatus}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Verify Status
          </Button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {MEMBERSHIP_PLANS.map((plan) => {
            const isCurrentTier =
              user?.isPremium && user?.membershipType === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col justify-between rounded-3xl border p-7 sm:p-8 shadow-2xl transition-all",
                  plan.popular
                    ? "border-amber-500/50 bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20"
                    : "border-slate-800 bg-slate-900/75"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 right-6">
                    <Badge variant="gold" className="px-3 py-1 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      MOST POPULAR
                    </Badge>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-white">
                      {plan.name}
                    </h2>
                    <span
                      className={cn(
                        "inline-block h-3 w-3 rounded-full bg-gradient-to-r",
                        plan.badgeColor
                      )}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-white">
                      ₹{plan.priceInr}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      / lifetime upgrade
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3 border-t border-slate-800/80 pt-6">
                    {plan.features.map((feat) => (
                      <li
                        key={feat}
                        className="flex items-start gap-2.5 text-xs text-slate-200"
                      >
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <Button
                    variant={plan.popular ? "primary" : "secondary"}
                    size="lg"
                    className="w-full"
                    disabled={isCurrentTier}
                    isLoading={loadingTier === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentTier
                      ? `Current Active Plan (${plan.name})`
                      : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthGuard>
  );
}
