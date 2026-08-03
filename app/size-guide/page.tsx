import type { Metadata } from "next"
import Link from "next/link"
import { Ruler } from "lucide-react"
import { Reveal } from "@/components/reveal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Size guide",
  description:
    "Body measurements in inches for MEHR kurtas, lehengas, blouses and anarkalis, plus how to measure yourself and what Free Size means on a saree.",
}

// Body measurements, not garment measurements — our stitched pieces already
// include ease, so shoppers should compare against their own body.
const SIZES = [
  { size: "XS", bust: "31–32", waist: "25–26", hip: "34–35" },
  { size: "S", bust: "33–34", waist: "27–28", hip: "36–37" },
  { size: "M", bust: "35–36", waist: "29–30", hip: "38–39" },
  { size: "L", bust: "37–39", waist: "31–33", hip: "40–42" },
  { size: "XL", bust: "40–42", waist: "34–36", hip: "43–45" },
  { size: "XXL", bust: "43–45", waist: "37–39", hip: "46–48" },
]

const MEASURE_STEPS = [
  {
    label: "Bust",
    copy: "Tape around the fullest part, level under the arms. Keep it snug, not tight, and breathe out normally.",
  },
  {
    label: "Waist",
    copy: "Your natural waist — the narrowest point, usually an inch above the navel. Not where your jeans sit.",
  },
  {
    label: "Hip",
    copy: "The fullest part of the seat, roughly 8 inches below the natural waist, feet together.",
  },
  {
    label: "Length",
    copy: "For lehengas and anarkalis, measure from the shoulder or waist down to where you want the hem to fall, wearing your usual heels.",
  },
]

const FAQ = [
  {
    q: "I'm between two sizes — which do I take?",
    a: "Take the larger one. Handloom cotton and silk have very little give, and letting a seam out is far easier for a local tailor than taking a woven panel in. If your bust and hip land in different sizes, size to the bust for stitched tops and to the hip for lehengas.",
  },
  {
    q: "What does Free Size mean on a saree or dupatta?",
    a: "The drape itself is unstitched, so it fits everyone. Where a saree ships with a blouse piece, that fabric is unstitched too — it is cut generously so your tailor has room to work to your own measurements.",
  },
  {
    q: "Do these garments shrink?",
    a: "Hand-loomed cotton can relax by up to half an inch on the first wash, which our sizing already accounts for. Silks should be dry-cleaned only and will not shrink. Full care notes sit on each product page.",
  },
  {
    q: "Can I have something altered or made to measure?",
    a: "Yes. Write to us within seven days of delivery with your measurements and we will advise whether the piece has enough seam allowance. Made-to-measure commissions run to the weaving cluster's own calendar, so allow several weeks.",
  },
]

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-eyebrow text-muted-foreground">Help</p>
        <h1 className="mt-2 font-display text-4xl text-balance sm:text-5xl">Size guide</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          All figures are body measurements in inches — our stitched pieces already include
          the ease you need, so measure yourself and match the row, not the garment.
        </p>
      </header>

      <Reveal>
        <section className="mt-10" aria-labelledby="chart-heading">
          <h2 id="chart-heading" className="font-display text-2xl">
            Body measurements
          </h2>
          <div className="mt-5 overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Bust (in)</TableHead>
                  <TableHead>Waist (in)</TableHead>
                  <TableHead>Hip (in)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SIZES.map((row) => (
                  <TableRow key={row.size}>
                    <TableCell className="font-medium">{row.size}</TableCell>
                    <TableCell className="text-muted-foreground">{row.bust}</TableCell>
                    <TableCell className="text-muted-foreground">{row.waist}</TableCell>
                    <TableCell className="text-muted-foreground">{row.hip}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Ruler width={14} height={14} strokeWidth={1.6} className="mt-0.5 shrink-0" />
            Sarees, dupattas and unstitched blouse pieces are listed as Free Size — the
            drape fits every body, and the blouse fabric is cut for your tailor.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-14" aria-labelledby="measure-heading">
          <h2 id="measure-heading" className="font-display text-2xl">
            How to measure
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use a soft tape over light clothing, and keep it parallel to the floor.
          </p>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2">
            {MEASURE_STEPS.map((step, index) => (
              <li key={step.label} className="border-t pt-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-lg text-primary">{index + 1}</span>
                  <h3 className="font-medium">{step.label}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.copy}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display text-2xl">
            Common questions
          </h2>
          <Accordion type="single" collapsible className="mt-4">
            {FAQ.map((item, index) => (
              <AccordionItem key={item.q} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </Reveal>

      <div className="mt-14 flex flex-col items-center rounded-lg border bg-secondary/40 px-6 py-10 text-center">
        <h2 className="font-display text-2xl text-balance">Still unsure?</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Returns are open for seven days, so you can try a size at home without risk.
        </p>
        <Link
          href="/shop"
          className="mt-6 rounded-md bg-primary px-7 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
        >
          Shop all
        </Link>
      </div>
    </div>
  )
}
