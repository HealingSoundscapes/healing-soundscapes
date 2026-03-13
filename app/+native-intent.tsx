export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  const normalizedPath = path.trim().toLowerCase();
  console.log('[HealingSoundscapes] redirectSystemPath', {
    path,
    normalizedPath,
    initial,
  });

  if (normalizedPath.includes('session')) {
    return '/';
  }

  return '/';
}
