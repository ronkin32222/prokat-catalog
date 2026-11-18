/**
 * Customer name as shown in notifications and the dashboard. The booking form
 * asks only for a first name and the server copies it into the last name, so
 * "Роман Роман" is shown as "Роман" once.
 */
export function formatCustomerName(firstName: string, lastName?: string | null): string {
  const first = firstName.trim();
  const last = (lastName ?? "").trim();
  if (!last || last.toLowerCase() === first.toLowerCase()) return first;
  return `${first} ${last}`;
}
