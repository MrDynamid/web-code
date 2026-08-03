"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { itemKey, useCart } from "@/lib/cart";
import { formatINR, shippingFor, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { SmartImage } from "@/components/smart-image";

export function CartDrawer() {
  const { items, isOpen, setOpen, subtotal, setQuantity, remove } = useCart();
  const shipping = shippingFor(subtotal);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-2xl">Your bag</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag width={30} height={30} strokeWidth={1.2} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your bag is waiting to be filled.</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/shop">Browse the collection</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {remaining > 0 ? (
                <p className="mb-4 rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                  Add {formatINR(remaining)} more for free shipping.
                </p>
              ) : (
                <p className="mb-4 rounded-md bg-secondary px-3 py-2 text-xs text-success">
                  Free shipping unlocked.
                </p>
              )}

              <ul className="space-y-4">
                {items.map((item) => {
                  const key = itemKey(item);
                  return (
                    <li key={key} className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-3">
                      <SmartImage
                        src={item.image}
                        alt={item.name}
                        width={144}
                        height={180}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/5] w-full rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-display text-base">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.color} · {item.size}
                        </p>
                        <p className="mt-1 text-sm">{formatINR(item.price * item.quantity)}</p>
                        <div className="mt-2 inline-flex items-center rounded-md border border-border">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="px-2 py-1 transition-colors hover:text-primary"
                            onClick={() => setQuantity(key, item.quantity - 1)}
                          >
                            <Minus width={13} height={13} />
                          </button>
                          <span className="min-w-7 text-center text-xs">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="px-2 py-1 transition-colors hover:text-primary"
                            onClick={() => setQuantity(key, item.quantity + 1)}
                          >
                            <Plus width={13} height={13} />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(key)}
                        className="shrink-0 self-start p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X width={15} height={15} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-border px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatINR(subtotal + shipping)}</span>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <Button asChild size="lg" onClick={() => setOpen(false)}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link href="/shop">Keep shopping</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
