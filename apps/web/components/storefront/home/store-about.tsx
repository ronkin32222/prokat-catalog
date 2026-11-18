import { CalendarDaysIcon, LayoutGridIcon, MapPinIcon, RotateCcwIcon } from "lucide-react";

const STEPS = [
  { icon: LayoutGridIcon, title: "Выберите оборудование" },
  { icon: CalendarDaysIcon, title: "Укажите срок аренды" },
  { icon: MapPinIcon, title: "Заберите в удобном месте" },
  { icon: RotateCcwIcon, title: "Верните в срок" },
] as const;

/** Four booking steps in one row on a dark band; no invented metrics. */
export const StoreAbout = () => (
  <section className="dark border-y bg-background py-16 text-foreground sm:py-20" aria-labelledby="how-title">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-light tracking-[0.4em] text-primary uppercase">
        Просто и удобно
      </p>
      <h2
        id="how-title"
        className="mt-3 font-display text-4xl leading-[.95] font-black tracking-[-0.03em] uppercase sm:text-5xl"
      >
        Как это работает
      </h2>
      <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title }, index) => (
          <li key={title} className="flex flex-col gap-5 bg-background p-6 sm:p-8">
            <span className="font-display text-3xl font-light text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Icon aria-hidden className="size-7 text-primary" strokeWidth={1.5} />
            <h3 className="font-display text-base leading-snug font-extrabold uppercase sm:text-lg">
              {title}
            </h3>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
