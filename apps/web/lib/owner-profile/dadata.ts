/**
 * «Заполнить по ИНН» через DaData (сервис подсказок по организациям).
 * Ключ берётся из анкеты владельца и никогда не уходит в браузер: запрос
 * делает сервер. Любая ошибка сети возвращает null, форма не ломается.
 */

/**
 * The DaData key comes from the server environment only. It is not stored in
 * `stores.settings`, which whole settings objects carry into browser components.
 */
export const getDadataApiKey = (): string | null => process.env.DADATA_API_KEY?.trim() || null;

export const DADATA_PARTY_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";

export interface DadataParty {
  /** Полное наименование (ООО) or ФИО (ИП). */
  name: string | null;
  /** Full name of the organization, with the legal form. */
  organizationName: string | null;
  directorName: string | null;
  ogrn: string | null;
  address: string | null;
  inn: string | null;
  isIndividual: boolean;
}

const str = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * The first suggestion of a DaData `findById/party` answer, or null when the
 * answer holds none. Unknown or malformed fields become null, never a throw.
 */
export const parseDadataPartyResponse = (body: unknown): DadataParty | null => {
  if (!body || typeof body !== "object") return null;
  const suggestions = (body as { suggestions?: unknown }).suggestions;
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;
  const first = suggestions[0] as { value?: unknown; data?: Record<string, unknown> } | undefined;
  const data = first?.data;
  if (!data || typeof data !== "object") return null;

  const nameObj = (data.name ?? {}) as Record<string, unknown>;
  const management = (data.management ?? {}) as Record<string, unknown>;
  const address = (data.address ?? {}) as Record<string, unknown>;
  const fio = (data.fio ?? {}) as Record<string, unknown>;
  const isIndividual = data.type === "INDIVIDUAL";
  const fioFull = [str(fio.surname), str(fio.name), str(fio.patronymic)]
    .filter(Boolean)
    .join(" ");

  return {
    name: isIndividual ? fioFull || str(nameObj.full) : str(nameObj.full_with_opf) ?? str(nameObj.full),
    organizationName: isIndividual ? null : str(nameObj.full_with_opf) ?? str(nameObj.full),
    directorName: str(management.name),
    ogrn: str(data.ogrn),
    address: str(address.value) ?? str(first?.value),
    inn: str(data.inn),
    isIndividual,
  };
};

/** Asks DaData for the party by ИНН. Null on a missing key, a refusal, a timeout or no match. */
export const lookupDadataParty = async (
  inn: string,
  apiKey: string,
  fetcher: typeof fetch = fetch,
): Promise<DadataParty | null> => {
  if (!apiKey.trim()) return null;
  try {
    const response = await fetcher(DADATA_PARTY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Token ${apiKey.trim()}`,
      },
      body: JSON.stringify({ query: inn }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return parseDadataPartyResponse(await response.json());
  } catch {
    return null;
  }
};
