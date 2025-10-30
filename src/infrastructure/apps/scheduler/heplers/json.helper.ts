export const parseJson = <T = any>(value: string | object | null | undefined): T | null => {
  try {
    if (value == null) return null;
    if (typeof value === 'object') return value as T;

    const trimmed = value.trim();
    if (!trimmed) return null;

    return JSON.parse(trimmed) as T;
  } catch (err) {
    console.error('parseJson error:', err);
    return null;
  }
};

export const stringifyJson = (value: any): string | null => {
  try {
    if (value == null) return null;
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return value;
      } catch {
        return JSON.stringify(value);
      }
    }

    return JSON.stringify(value);
  } catch (err) {
    console.error('stringifyJson error:', err);
    return null;
  }
};
