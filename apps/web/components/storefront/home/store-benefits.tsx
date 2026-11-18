import { GemIcon, HeadsetIcon, BoxIcon, RefreshCwIcon } from "lucide-react";

const BENEFITS = [
  { icon: GemIcon, title: "Надёжное оборудование" },
  { icon: RefreshCwIcon, title: "Регулярное обслуживание" },
  { icon: HeadsetIcon, title: "Поддержка и консультации" },
  { icon: BoxIcon, title: "Гибкие условия аренды" },
] as const;

/** Compact light band: heading on the left, four short points in a row. */
export const StoreBenefits = () => (
  <section
    className="light border-b bg-background py-12 text-foreground sm:py-14"
    aria-labelledby="benefits-title"
  >
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_2.4fr] lg:items-center lg:px-8">
      <h2
        id="benefits-title"
        className="font-display text-3xl leading-[.95] font-black tracking-[-0.03em] uppercase sm:text-4xl"
      >
        Почему выбирают нас
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title }) => (
          <li key={title} className="flex items-center gap-4">
            <Icon aria-hidden className="size-7 shrink-0 text-foreground" strokeWidth={1.5} />
            <p className="text-sm leading-5 font-medium">{title}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
