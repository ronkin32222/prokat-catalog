"use client";

import { useState } from "react";

import { CheckIcon, RotateCcwIcon } from "lucide-react";

import { Button, Input, Label } from "@louez/ui";
import type { SiteContentOverrides, SiteTemplateId } from "@louez/types";
import { cn } from "@louez/utils";

import { SITE_TEMPLATES, getSiteTemplate } from "@/lib/site-templates";

const COLOR_PALETTE = [
  "#E8BE91",
  "#E77D46",
  "#6FAF73",
  "#5B9BD5",
  "#D86A9A",
  "#4DC3C3",
  "#B8D342",
  "#8B5CF6",
  "#EF4444",
] as const;

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

interface SiteTemplatePickerProps {
  templateId: SiteTemplateId;
  primaryColor: string;
  content: SiteContentOverrides;
  onTemplateChange: (templateId: SiteTemplateId) => void;
  onPrimaryColorChange: (color: string) => void;
  onContentChange: (content: SiteContentOverrides) => void;
}

export const SiteTemplatePicker = ({
  templateId,
  primaryColor,
  content,
  onTemplateChange,
  onPrimaryColorChange,
  onContentChange,
}: SiteTemplatePickerProps) => {
  const template = getSiteTemplate(templateId);
  const [colorInput, setColorInput] = useState(primaryColor);
  const [lastColor, setLastColor] = useState(primaryColor);

  if (primaryColor !== lastColor) {
    setLastColor(primaryColor);
    setColorInput(primaryColor);
  }

  const updateText = (key: Exclude<keyof SiteContentOverrides, "perks">, value: string) => {
    onContentChange({ ...content, [key]: value });
  };

  const resolvedPerks = content.perks ?? template.defaultContent.perks;
  const updatePerk = (index: number, value: string) => {
    const perks: [string, string, string, string] = [...resolvedPerks];
    perks[index] = value;
    onContentChange({ ...content, perks });
  };

  const selectTemplate = (nextId: SiteTemplateId) => {
    const next = getSiteTemplate(nextId);
    onTemplateChange(nextId);
    onPrimaryColorChange(next.accent);
    onContentChange({});
  };

  const handleColorInput = (value: string) => {
    setColorInput(value);
    if (HEX_COLOR_PATTERN.test(value)) onPrimaryColorChange(value.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Готовый шаблон сайта</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Выберите вариант под вашу нишу проката.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SITE_TEMPLATES.map((item) => {
          const selected = item.id === templateId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTemplate(item.id)}
              className={cn(
                "relative rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/30",
              )}
            >
              {selected ? (
                <span className="absolute top-2 right-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon aria-hidden className="size-4" />
                </span>
              ) : null}
              <div className="mb-3 aspect-16/9 overflow-hidden rounded-lg bg-[#151515] p-3 text-white">
                <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: item.accent }} />
                <div className="mt-4 text-[10px] leading-none font-black">
                  {item.defaultContent.titleStrong}
                </div>
                <div className="mt-1 text-[9px] leading-none font-light">
                  {item.defaultContent.titleLight}
                </div>
                <div
                  className="mt-3 h-3 w-16 rounded-sm"
                  style={{ backgroundColor: item.accent }}
                />
              </div>
              <span className="block pr-6 text-sm font-medium">{item.title}</span>
              <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                {item.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 border-t pt-5">
        <div>
          <h3 className="text-sm font-semibold">Подстроить</h3>
          <p className="mt-1 text-sm text-muted-foreground">Менять необязательно.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site-template-color">Цвет акцента</Label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Выбрать цвет ${color}`}
                aria-pressed={primaryColor.toUpperCase() === color}
                onClick={() => onPrimaryColorChange(color)}
                className={cn(
                  "size-8 rounded-full border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  primaryColor.toUpperCase() === color &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="site-template-color"
              value={colorInput}
              onChange={(event) => handleColorInput(event.target.value)}
              maxLength={7}
              placeholder="#E8BE91"
              className="font-mono uppercase"
              aria-invalid={!HEX_COLOR_PATTERN.test(colorInput)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onPrimaryColorChange(template.accent)}
            >
              <RotateCcwIcon aria-hidden className="size-4" />
              Вернуть цвет шаблона
            </Button>
          </div>
          {!HEX_COLOR_PATTERN.test(colorInput) ? (
            <p className="text-sm text-destructive">Введите цвет в формате #RRGGBB.</p>
          ) : null}
        </div>

        {(
          [
            ["eyebrow", "Надпись над заголовком", 40],
            ["titleStrong", "Заголовок (жирная строка)", 30],
            ["titleLight", "Заголовок (лёгкая строка)", 30],
          ] as const
        ).map(([key, label, maxLength]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={`site-template-${key}`}>{label}</Label>
            <Input
              id={`site-template-${key}`}
              value={content[key] ?? template.defaultContent[key]}
              maxLength={maxLength}
              onChange={(event) => updateText(key, event.target.value)}
            />
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="site-template-lead">Описание</Label>
          <textarea
            id="site-template-lead"
            value={content.lead ?? template.defaultContent.lead}
            maxLength={220}
            rows={4}
            onChange={(event) => updateText("lead", event.target.value)}
            className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-3">
          <Label>Преимущества</Label>
          {resolvedPerks.map((perk, index) => (
            <Input
              key={index}
              aria-label={`Преимущество ${index + 1}`}
              value={perk}
              maxLength={60}
              onChange={(event) => updatePerk(index, event.target.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
