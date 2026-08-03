import type { Metadata } from "next"
import Link from "next/link"
import { Reveal } from "@/components/reveal"
import { SmartImage } from "@/components/smart-image"

export const metadata: Metadata = {
  title: "Our craft",
  description:
    "MEHR works directly with weaving and hand-block families in Varanasi, Kanchipuram, Lucknow and Bagru — small runs, natural fibres, and the people who have always made them.",
}

const CLUSTERS = [
  {
    place: "Varanasi",
    craft: "Banarasi brocade",
    copy: "Kadhwa and cutwork brocade woven on pit looms, with real zari laid in by hand. A single saree can hold six weeks of work.",
  },
  {
    place: "Kanchipuram",
    craft: "Kanjivaram silk",
    copy: "Body and border woven separately, then interlocked at the korvai join — the seam that refuses to give even when the silk does.",
  },
  {
    place: "Lucknow",
    craft: "Chikankari",
    copy: "Shadow work embroidered from the reverse of the cloth so the motif surfaces as a soft bloom rather than a hard outline.",
  },
  {
    place: "Bagru",
    craft: "Hand-block print",
    copy: "Carved teak blocks, madder and indigo, and river-washed cotton. Slight offsets in the repeat are the proof of the hand.",
  },
]

const PROMISES = [
  {
    title: "Small runs, no surplus",
    copy: "We cut in editions of a few dozen. When a piece sells out we ask the family whether they want to weave it again — the answer is not always yes.",
  },
  {
    title: "Paid before dispatch",
    copy: "Weavers and printers are paid on completion, not on our sell-through. Nobody in the chain finances our inventory except us.",
  },
  {
    title: "Named, not anonymous",
    copy: "Every order card carries the cluster and the workshop the piece came from. Craft is a person, not a texture.",
  },
]

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <SmartImage
          src="/images/editorial-craft.jpg"
          alt="A weaver working at a pit loom"
          width={2048}
          height={1152}
          loading="eager"
          fetchPriority="high"
          className="h-[46vh] min-h-[320px] w-full object-cover object-center sm:h-[56vh]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:pb-14">
          <p className="text-eyebrow text-ink-foreground/80">Our craft</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl text-balance text-ink-foreground sm:text-5xl lg:text-6xl">
            Made by the families who have always made it
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
        <Reveal>
          <p className="font-display text-2xl leading-relaxed text-pretty sm:text-3xl">
            MEHR began with a simple refusal: not to buy handloom through three
            middlemen and call it a partnership.
          </p>
          <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
            <p>
              We work directly with four clusters. We visit, we commission, and we pay on
              completion. That is the whole model — it is unglamorous, and it is the only
              part of this business we are unwilling to optimise.
            </p>
            <p>
              What it costs us is speed. We cannot restock a sold-out weave in a week, and
              we do not pretend otherwise. What it buys you is a garment whose small
              irregularities are evidence rather than defect: the slub in the silk, the
              half-millimetre drift in a block repeat, the korvai join you can feel with a
              thumb.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="border-t bg-secondary/40">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
          <Reveal>
            <p className="text-eyebrow text-muted-foreground">Where it&apos;s made</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Four clusters</h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {CLUSTERS.map((cluster, index) => (
              <Reveal key={cluster.place} delay={index * 60}>
                <article className="h-full bg-card p-6 sm:p-8">
                  <p className="text-eyebrow text-primary">{cluster.place}</p>
                  <h3 className="mt-2 font-display text-2xl">{cluster.craft}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {cluster.copy}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
        <Reveal>
          <p className="text-eyebrow text-muted-foreground">What we hold to</p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">Three commitments</h2>
        </Reveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {PROMISES.map((promise, index) => (
            <Reveal key={promise.title} delay={index * 60}>
              <div className="border-t pt-5">
                <h3 className="font-display text-xl">{promise.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {promise.copy}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 lg:py-20">
          <h2 className="font-display text-3xl text-balance sm:text-4xl">
            Start with a piece, not a collection
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sizes run true and returns are open for seven days, so there is no penalty for
            being unsure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-md bg-primary px-7 py-3 text-xs tracking-[0.18em] uppercase text-primary-foreground transition-opacity hover:opacity-90"
            >
              Shop all
            </Link>
            <Link
              href="/size-guide"
              className="rounded-md border px-7 py-3 text-xs tracking-[0.18em] uppercase transition-colors hover:border-primary hover:text-primary"
            >
              Size guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
