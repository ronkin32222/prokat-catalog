import { BadgeCheckIcon, Clock3Icon, ShieldCheckIcon, TruckIcon } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheckIcon, title: "Без залога или с малым залогом" },
  { icon: Clock3Icon, title: "Выдача за 10 минут" },
  { icon: TruckIcon, title: "Доставка по городу" },
  { icon: BadgeCheckIcon, title: "Чистый и проверенный инструмент" },
] as const;

/** Four concrete rental advantages; decorative hexagons echo workshop hardware. */
export const StoreBenefits = () => (
  <section
    className="relative overflow-hidden border-y bg-secondary py-14 sm:py-20"
    aria-labelledby="benefits-title"
  >
    <div aria-hidden className="absolute -right-10 top-4 grid grid-cols-3 gap-3 opacity-[.06]">
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className="size-16 bg-primary [clip-path:polygon(25%_7%,75%_7%,100%_50%,75%_93%,25%_93%,0_50%)]"
        />
      ))}
    </div>
    <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="benefits-title" className="sr-only">
        Преимущества проката
      </h2>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title }) => (
          <li key={title} className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary text-primary">
              <Icon aria-hidden className="size-6" strokeWidth={1.5} />
            </span>
            <p className="font-display text-base leading-tight font-extrabold tracking-[-0.01em] uppercase">
              {title}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
