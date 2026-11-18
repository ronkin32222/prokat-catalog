import { StarIcon } from "lucide-react";

export interface StoreTestimonial {
  authorName: string;
  rating: number;
  text: string;
}

interface StoreTestimonialsProps {
  /** Real reviews of the store, already filtered by the page. Nothing renders when empty. */
  reviews: StoreTestimonial[];
}

/** Light band of real reviews; the page passes them from the store's place data. */
export const StoreTestimonials = ({ reviews }: StoreTestimonialsProps) => {
  if (reviews.length === 0) return null;

  return (
    <section
      id="reviews"
      className="light border-t bg-background py-16 text-foreground sm:py-20"
      aria-labelledby="testimonials-title"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="testimonials-title"
          className="font-display text-4xl leading-[.95] font-black tracking-[-0.03em] uppercase sm:text-5xl"
        >
          Отзывы клиентов
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {reviews.map((review, index) => (
            <li key={index} className="flex flex-col gap-4 rounded-lg border bg-card p-6">
              <span
                role="img"
                aria-label={`Оценка ${review.rating} из 5`}
                className="flex gap-0.5 text-primary"
              >
                {Array.from({ length: 5 }, (_, star) => (
                  <StarIcon
                    key={star}
                    aria-hidden
                    className="size-4"
                    fill={star < review.rating ? "currentColor" : "none"}
                  />
                ))}
              </span>
              <p className="text-sm leading-6 text-card-foreground">{review.text}</p>
              <p className="mt-auto text-sm font-semibold">{review.authorName}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
