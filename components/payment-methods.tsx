"use client";

import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | "cod";

export const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM"];
export const BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra",
  "Punjab National Bank",
];
export const WALLETS = ["Paytm Wallet", "Amazon Pay", "Mobikwik", "Freecharge"];

const TABS: { value: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "netbanking", label: "Netbanking", icon: Landmark },
  { value: "wallet", label: "Wallet", icon: Wallet },
  { value: "cod", label: "COD", icon: Banknote },
];

function Choice({
  active,
  children,
  onSelect,
}: {
  active: boolean;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-2.5 text-left text-sm transition-all duration-300",
        active ? "border-primary bg-secondary" : "border-border hover:border-gold",
      )}
    >
      {children}
    </button>
  );
}

export type CardDetails = { number: string; expiry: string; cvv: string; name: string };

/** Groups digits in 4s the way payment forms do, without fighting the caret. */
function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function cardBrand(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^(60|65|81|82|508)/.test(digits)) return "RuPay";
  if (/^3[47]/.test(digits)) return "Amex";
  return "";
}

export function PaymentMethods({
  method,
  onMethodChange,
  channel,
  onChannelChange,
  card,
  onCardChange,
}: {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  channel: string;
  onChannelChange: (channel: string) => void;
  card: CardDetails;
  onCardChange: (card: CardDetails) => void;
}) {
  const brand = cardBrand(card.number);
  return (
    <Tabs
      value={method}
      onValueChange={(value) => {
        onMethodChange(value as PaymentMethod);
        onChannelChange("");
      }}
      className="mt-3"
    >
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 sm:grid-cols-5">
        {TABS.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="flex flex-col items-center gap-1 px-1 py-2 text-[11px] tracking-[0.06em] sm:flex-row sm:gap-2 sm:text-xs"
          >
            <Icon width={15} height={15} strokeWidth={1.6} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="upi" className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {UPI_APPS.map((app) => (
            <Choice key={app} active={channel === app} onSelect={() => onChannelChange(app)}>
              {app}
            </Choice>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="upi-id">Or enter a UPI ID</Label>
          <Input
            id="upi-id"
            inputMode="email"
            placeholder="yourname@upi"
            value={channel.includes("@") ? channel : ""}
            onChange={(event) => onChannelChange(event.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          You'll approve the payment request in your UPI app.
        </p>
      </TabsContent>

      <TabsContent value="card" className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="card-number">Card number</Label>
          <div className="relative">
            <Input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={card.number}
              onChange={(event) => {
                const number = formatCardNumber(event.target.value);
                onCardChange({ ...card, number });
                onChannelChange(`Card ····${number.replace(/\D/g, "").slice(-4)}`);
              }}
            />
            {brand ? (
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {brand}
              </span>
            ) : null}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-name">Name on card</Label>
          <Input
            id="card-name"
            autoComplete="cc-name"
            value={card.name}
            onChange={(event) => onCardChange({ ...card, name: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="card-exp">Expiry</Label>
            <Input
              id="card-exp"
              autoComplete="cc-exp"
              inputMode="numeric"
              placeholder="MM/YY"
              value={card.expiry}
              onChange={(event) => onCardChange({ ...card, expiry: formatExpiry(event.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card-cvc">CVV</Label>
            <Input
              id="card-cvc"
              autoComplete="cc-csc"
              inputMode="numeric"
              type="password"
              placeholder="•••"
              value={card.cvv}
              onChange={(event) =>
                onCardChange({ ...card, cvv: event.target.value.replace(/\D/g, "").slice(0, 4) })
              }
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Visa, Mastercard, RuPay and Amex accepted. Card details are never stored.
        </p>
      </TabsContent>


      <TabsContent value="netbanking" className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BANKS.map((bank) => (
            <Choice key={bank} active={channel === bank} onSelect={() => onChannelChange(bank)}>
              {bank}
            </Choice>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          You'll be taken to your bank to authorise the payment.
        </p>
      </TabsContent>

      <TabsContent value="wallet" className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WALLETS.map((wallet) => (
            <Choice
              key={wallet}
              active={channel === wallet}
              onSelect={() => onChannelChange(wallet)}
            >
              {wallet}
            </Choice>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="cod" className="mt-4">
        <div className="rounded-md border border-border bg-secondary/50 p-4 text-sm">
          <p>Pay in cash when your order arrives.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Available on orders up to ₹20,000. Please keep exact change ready.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
