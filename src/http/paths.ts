/** Strip leading and/or trailing "/" in linear time (avoids regex backtracking on long slash runs). */
export function trimSlashes(value: string, { start = false, end = false }: { start?: boolean; end?: boolean } = {}): string {
  let from = 0;
  let to = value.length;
  if (start) {
    while (from < to && value.charCodeAt(from) === 47) from += 1;
  }
  if (end) {
    while (to > from && value.charCodeAt(to - 1) === 47) to -= 1;
  }
  return value.slice(from, to);
}
