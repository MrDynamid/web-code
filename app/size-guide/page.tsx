import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Size Guide | Maison Lumière',
}

const SIZE_CHARTS = [
  {
    label: 'Dresses, Tops & Knitwear',
    headers: ['Size', 'Bust (cm)', 'Waist (cm)', 'Hip (cm)'],
    rows: [
      ['XS', '80–83', '61–64', '86–89'],
      ['S',  '84–87', '65–68', '90–93'],
      ['M',  '88–92', '69–73', '94–98'],
      ['L',  '93–97', '74–78', '99–103'],
    ],
  },
  {
    label: 'Bottoms',
    headers: ['Size', 'Waist (cm)', 'Hip (cm)', 'Inseam (cm)'],
    rows: [
      ['XS', '61–64', '86–89', '76'],
      ['S',  '65–68', '90–93', '77'],
      ['M',  '69–73', '94–98', '78'],
      ['L',  '74–78', '99–103', '79'],
    ],
  },
  {
    label: 'Outerwear',
    headers: ['Size', 'Shoulder (cm)', 'Chest (cm)', 'Length (cm)'],
    rows: [
      ['XS', '37–38', '88–90',  '85'],
      ['S',  '39–40', '91–94',  '87'],
      ['M',  '41–42', '95–99',  '89'],
      ['L',  '43–44', '100–104','91'],
    ],
  },
]

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
      <p className="text-[11px] tracking-[0.25em] text-muted-foreground uppercase">Client care</p>
      <h1 className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Size guide</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Our pieces are designed in Paris with a European fit. When between sizes, size up for
        a more relaxed silhouette. All measurements in centimetres.
      </p>

      <section className="mt-14">
        <h2 className="font-serif text-2xl tracking-tight">How to measure</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { m: 'Bust',   h: 'Around the fullest part of your chest, tape parallel to the floor.' },
            { m: 'Waist',  h: 'Around the narrowest part of your natural waist, just above the navel.' },
            { m: 'Hip',    h: 'Feet together — around the fullest part of your hips.' },
            { m: 'Inseam', h: 'From the crotch to the floor along the inside of the leg.' },
          ].map(({ m, h }) => (
            <div key={m} className="rounded-sm border border-border bg-card p-5">
              <p className="font-medium">{m}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{h}</p>
            </div>
          ))}
        </div>
      </section>

      {SIZE_CHARTS.map((chart) => (
        <section key={chart.label} className="mt-14 border-t border-border pt-10">
          <h2 className="font-serif text-2xl tracking-tight">{chart.label}</h2>
          <div className="mt-6 overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-secondary/40">
                <tr>
                  {chart.headers.map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chart.rows.map(([size, ...vals]) => (
                  <tr key={size} className="transition-colors hover:bg-secondary/20">
                    <td className="px-5 py-3.5 font-medium">{size}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-5 py-3.5 tabular-nums text-muted-foreground">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="mt-10 text-sm text-muted-foreground">
        Need help?{' '}
        <a href="/contact" className="font-medium text-gold underline underline-offset-4">
          Contact our team
        </a>
        .
      </p>
    </div>
  )
}
