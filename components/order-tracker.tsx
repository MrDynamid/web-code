"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Package, Truck } from "lucide-react";
import { getOrderTracking } from "@/lib/account.actions";
import { formatINR } from "@/lib/format";
import { SmartImage } from "@/components/smart-image";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const PAYMENT_LABEL: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  cod: "Cash on delivery",
  online: "Online",
};

function formatStamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

type Tracking = Awaited<ReturnType<typeof getOrderTracking>>;

export function OrderTracker({ orderId }: { orderId: string }) {
  const [data, setData] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);

  // The tracker only mounts when a shopper expands an order, so the fetch is
  // deliberately on-demand. It re-polls every minute while it stays open so a
  // courier scan shows up without a manual refresh.
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getOrderTracking({ id: orderId });
        if (active) setData(result);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    const interval = window.setInterval(load, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderId]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 width={14} height={14} className="animate-spin" /> Loading tracking…
      </p>
    );
  }
  if (!data) return null;

  const { order, events, payments } = data;
  const cancelled = order.status === "cancelled";
  const currentIndex = STEPS.findIndex((step) => step.key === order.status);
  const payment = payments[0];

  return (
    <div className="mt-4 border-t border-border pt-4">
      {cancelled ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          This order was cancelled.
        </p>
      ) : (
        <ol className="flex items-start gap-1 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const done = index <= currentIndex;
            return (
              <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      index === 0 ? "bg-transparent" : done ? "bg-primary" : "bg-border",
                    )}
                  />
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {index === currentIndex && index < STEPS.length - 1 ? (
                      <Truck width={12} height={12} strokeWidth={1.8} />
                    ) : done ? (
                      <Check width={12} height={12} strokeWidth={2.2} />
                    ) : (
                      <Package width={12} height={12} strokeWidth={1.6} />
                    )}
                  </span>
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      index === STEPS.length - 1
                        ? "bg-transparent"
                        : index < currentIndex
                          ? "bg-primary"
                          : "bg-border",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-center text-[10px] leading-tight tracking-[0.06em] uppercase",
                    done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="mt-0.5">
            {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
            {payment?.channel ? ` · ${payment.channel}` : ""} · {order.payment_status}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tracking</dt>
          <dd className="mt-0.5">
            {order.tracking_number
              ? `${order.tracking_number}${order.courier ? ` · ${order.courier}` : ""}`
              : "Assigned once shipped"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {order.status === "delivered" ? "Delivered" : "Estimated delivery"}
          </dt>
          <dd className="mt-0.5">
            {order.estimated_delivery
              ? new Date(order.estimated_delivery).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })
              : "—"}
          </dd>
        </div>
      </dl>

      {events.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {[...events].reverse().map((event) => (
            <li key={event.id} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3">
              <span className="mt-1.5 h-2 w-2 rounded-full bg-gold" />
              <div className="min-w-0">
                <p className="text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatStamp(event.created_at)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
                {event.note ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mt-5 space-y-2 border-t border-border pt-4">
        {(
          order.items as Array<{
            image: string;
            name: string;
            size: string;
            quantity: number;
            price: number;
          }>
        ).map((item, index) => (
          <li
            key={index}
            className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 text-sm"
          >
            <SmartImage
              src={String(item.image)}
              alt=""
              width={80}
              height={100}
              loading="lazy"
              decoding="async"
              className="h-12 w-10 rounded object-cover"
            />
            <div className="min-w-0">
              <p className="truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.size} · Qty {item.quantity}
              </p>
            </div>
            <span className="shrink-0 text-xs">
              {formatINR(Number(item.price) * Number(item.quantity))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
