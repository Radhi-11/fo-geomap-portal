export function getQueryParam(req: any, key: string): string | undefined {
  const value = req.query[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] as string;
  return undefined;
}

export function getQueryParamAsNumber(req: any, key: string, defaultValue?: number): number | undefined {
  const value = getQueryParam(req, key);
  if (value === undefined) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}
