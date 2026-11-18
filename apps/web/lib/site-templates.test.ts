import assert from "node:assert/strict";
import { test } from "node:test";

import { HOME_COPY, SITE_TEMPLATES, getSiteTemplate, resolveHomeCopy } from "./site-templates";

test("contains every niche and falls back to tools", () => {
  assert.equal(SITE_TEMPLATES.length, 7);
  assert.equal(getSiteTemplate("sport").title, "Спорт и туризм");
  assert.equal(getSiteTemplate("unknown").id, "tools");
});

test("template defaults fit the persisted content limits", () => {
  for (const template of SITE_TEMPLATES) {
    assert.ok(template.defaultContent.eyebrow.length <= 40, template.id);
    assert.ok(template.defaultContent.titleStrong.length <= 30, template.id);
    assert.ok(template.defaultContent.titleLight.length <= 30, template.id);
    assert.ok(template.defaultContent.lead.length <= 220, template.id);
    assert.ok(
      template.defaultContent.perks.every((perk) => perk.length <= 60),
      template.id,
    );
  }
});

test("resolves template defaults and owner overrides without changing shared copy", () => {
  const resolved = resolveHomeCopy({
    templateId: "events",
    content: { titleStrong: "ВАШ ПРАЗДНИК", perks: ["Первое", "Второе", "Третье", "Четвёртое"] },
  });
  assert.equal(resolved.hero.eyebrow, "ПРОКАТ ДЛЯ");
  assert.equal(resolved.hero.titleStrong, "ВАШ ПРАЗДНИК");
  assert.deepEqual(
    resolved.hero.perks.map((perk) => perk.text),
    ["Первое", "Второе", "Третье", "Четвёртое"],
  );
  assert.equal(resolved.hero.primaryHref, HOME_COPY.hero.primaryHref);
  assert.equal(HOME_COPY.hero.titleStrong, "СТРОИТЕЛЬНЫХ");
});

test("a legacy theme resolves to the existing tools copy", () => {
  assert.deepEqual(resolveHomeCopy(undefined), HOME_COPY);
});
