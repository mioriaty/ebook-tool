const dictCache = new Map<string, Set<string>>();

export async function loadPlainDictionary(url: string): Promise<Set<string>> {
  if (dictCache.has(url)) return dictCache.get(url)!;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load dictionary from ${url}`);

  const text = await response.text();
  const wordSet = new Set<string>();

  for (const line of text.split("\n")) {
    const entry = line.trim().toLowerCase();
    if (!entry) continue;
    wordSet.add(entry);
    for (const part of entry.split(/\s+/)) {
      if (part) wordSet.add(part);
    }
  }

  dictCache.set(url, wordSet);
  return wordSet;
}
