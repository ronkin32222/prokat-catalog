import { CalendarDaysIcon, CheckIcon, PackageCheckIcon, RotateCcwIcon } from "lucide-react";

const STEPS = [
  { icon: CheckIcon, title: "Выберите", text: "Найдите подходящую позицию в каталоге." },
  { icon: CalendarDaysIcon, title: "Укажите срок", text: "Выберите даты получения и возврата." },
  { icon: PackageCheckIcon, title: "Получите", text: "Заберите заказ или оформите доставку." },
  { icon: RotateCcwIcon, title: "Верните", text: "Верните заказ в согласованное время." },
] as const;

/** Four plain booking steps, without invented metrics or testimonials. */
export const StoreAbout = () => (
  <section className="storefront-concrete border-y py-16 sm:py-20" aria-labelledby="how-title">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <p className="font-display text-xs font-light tracking-[0.4em] text-primary uppercase">
        Просто и удобно
      </p>
      <div className="mt-3 grid gap-10 lg:grid-cols-[.8fr_2.2fr] lg:items-start">
        <h2
          id="how-title"
          className="font-display text-4xl leading-[.95] font-black tracking-[-0.03em] uppercase sm:text-5xl"
        >
          Как это работает
        </h2>
        <ol className="grid border-t sm:grid-cols-2 lg:grid-cols-4 lg:border-t-0">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="border-b py-6 sm:px-6 lg:border-b-0 lg:border-l lg:py-2">
              <span className="font-display text-3xl font-light text-foreground/75">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon aria-hidden className="mt-8 size-6 text-primary" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-lg font-extrabold uppercase">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);
