import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const TESTIMONIALS = [
  {
    initials: "АК",
    name: "Алексей К.",
    text: "Инструмент выдали быстро, всё чистое и полностью готово к работе.",
  },
  {
    initials: "МС",
    name: "Мария С.",
    text: "Помогли подобрать нужную модель и спокойно объяснили условия аренды.",
  },
  {
    initials: "ДВ",
    name: "Дмитрий В.",
    text: "Удобно забронировал даты заранее и забрал заказ без очереди.",
  },
] as const;

/** Static local testimonials; arrows are visual until a real review feed is connected. */
export const StoreTestimonials = () => (
  <section id="reviews" className="py-16 sm:py-24" aria-labelledby="testimonials-title">
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-center justify-between gap-4">
        <h2
          id="testimonials-title"
          className="font-display text-3xl font-black tracking-[-0.01em] uppercase sm:text-4xl"
        >
          Отзывы клиентов
        </h2>
        <div aria-hidden className="flex gap-2 text-primary-foreground">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary">
            <ChevronLeftIcon className="size-4" />
          </span>
          <span className="flex size-10 items-center justify-center rounded-full bg-primary">
            <ChevronRightIcon className="size-4" />
          </span>
        </div>
      </div>
      <ul className="grid gap-8 md:grid-cols-3">
        {TESTIMONIALS.map(({ initials, name, text }) => (
          <li key={name} className="relative border bg-card px-6 pt-12 pb-7 text-center">
            <span className="font-display absolute -top-7 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary font-extrabold text-primary-foreground">
              {initials}
            </span>
            <h3 className="font-display font-extrabold uppercase">{name}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
