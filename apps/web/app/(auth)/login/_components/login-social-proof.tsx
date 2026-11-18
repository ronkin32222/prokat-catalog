import { CalendarCheck, ClipboardList, Wrench } from "lucide-react";

const points = [
  { icon: Wrench, text: "Каталог позиций с фото и ценами" },
  { icon: ClipboardList, text: "Заявки арендаторов в одном месте" },
  { icon: CalendarCheck, text: "Календарь выдачи и возврата" },
] as const;

/** Right-hand brand panel of the login page: plain facts, no testimonials or figures. */
export const LoginSocialProof = () => (
  <div className="flex max-w-md flex-col gap-8">
    <h2 className="font-display text-4xl leading-tight font-extrabold tracking-tight uppercase">
      Каталог проката
    </h2>
    <ul className="flex flex-col gap-4">
      {points.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3 text-lg">
          <Icon aria-hidden className="size-5 shrink-0" />
          {text}
        </li>
      ))}
    </ul>
  </div>
);
