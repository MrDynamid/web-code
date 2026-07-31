'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader as Loader2, Mail, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const dynamic = 'force-dynamic'

const SUBJECTS = [
  'Order enquiry',
  'Shipping & delivery',
  'Returns & exchanges',
  'Product information',
  'Sizing help',
  'Press & media',
  'Other',
]

export default function ContactPage() {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      // TODO: wire to an email-sending service (Resend, Nodemailer, etc.)
      await new Promise((r) => setTimeout(r, 700))
      setSent(true)
      toast.success("Message sent — we'll reply within 24 hours.")
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Client care</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Contact us</h1>

      <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_340px]">
        {sent ? (
          <div className="flex flex-col items-start gap-4 rounded-sm border border-border bg-card p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-gold/10">
              <Mail className="size-5 text-gold" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl">Message received</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Our client care team will reply within 24 hours (Monday–Saturday, 9 am–6 pm IST).
            </p>
            <Button variant="outline" onClick={() => setSent(false)} className="mt-2">
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" name="firstName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" name="lastName" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                name="subject"
                required
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a subject…</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order">Order number (optional)</Label>
              <Input id="order" name="orderNumber" placeholder="#1234" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={5} required placeholder="How can we help?" />
            </div>
            <Button type="submit" disabled={pending} className="h-11 w-fit gap-2">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Send message
            </Button>
          </form>
        )}

        <div className="flex flex-col gap-6">
          <div className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-serif text-xl">Get in touch</h2>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:hello@maisonlumiere.com" className="text-muted-foreground hover:text-gold">
                    hello@maisonlumiere.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">+91 98765 43210</p>
                  <p className="text-xs text-muted-foreground">Mon–Sat · 9 am–6 pm IST</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.5} />
                <div>
                  <p className="font-medium">Atelier</p>
                  <p className="text-muted-foreground">14 Rue de la Paix<br />Paris, 75002 France</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="rounded-sm border border-border bg-card p-5 text-sm">
            <p className="font-medium">Response times</p>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              We reply to all enquiries within 24 hours, Monday to Saturday.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
