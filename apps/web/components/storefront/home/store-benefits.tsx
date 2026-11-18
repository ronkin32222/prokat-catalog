import { CalendarCheckIcon, HeadphonesIcon, RefreshCcwIcon, ShieldCheckIcon } from "lucide-react";

const BENEFITS = [
  { icon: ShieldCheckIcon, title: "Понятные условия" },
  { icon: RefreshCcwIcon, title: "Актуальное наличие" },
  { icon: HeadphonesIcon, title: "Помощь с выбором" },
  { icon: CalendarCheckIcon, title: "Удобное бронирование" },
] as const;

/** Product capabilities only: no unsupported promises or fictional numbers. */
export const StoreBenefits = () => (
  <section
    className="light border-b bg-background py-12 text-foreground sm:py-16"
    aria-labelledby="benefits-title"
  >
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.8fr_2.2fr] lg:px-8">
      <h2
        id="benefits-title"
        className="font-display text-3xl leading-[.95] font-black tracking-[-0.03em] uppercase sm:text-4xl"
      >
        Почему выбирают нас
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title }) => (
          <li key={title} className="border-l border-border pl-5">
            <Icon aria-hidden className="size-7 text-primary" strokeWidth={1.5} />
            <p className="mt-4 text-sm font-medium leading-5">{title}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
