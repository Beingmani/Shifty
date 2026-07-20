export function parseChangelog(raw) {
  const releases = [];
  const sections = raw.split(/\n## /).slice(1);

  for (const section of sections) {
    const lines = section.split('\n');
    const header = lines[0].trim();

    if (header.startsWith('[Unreleased]')) continue;

    const headerMatch = header.match(/\[?([^\]]+)\]?\s*[—–-]+\s*(.+)/);
    if (!headerMatch) continue;

    const version = headerMatch[1].trim();
    const date = headerMatch[2].trim();

    let summary = '';
    let i = 1;
    while (i < lines.length && !summary) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('-') && line !== '---') {
        summary = line;
      }
      i++;
    }

    const groups = [];
    let currentGroup = null;
    for (const line of lines) {
      const groupMatch = line.match(/^###\s+(.+)/);
      if (groupMatch) {
        currentGroup = { label: groupMatch[1].trim(), items: [] };
        groups.push(currentGroup);
        continue;
      }
      if (currentGroup && line.startsWith('- ')) {
        const text = line
          .slice(2)
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .trim();
        currentGroup.items.push(text);
      }
    }

    releases.push({ version, date, summary, groups });
  }

  return releases;
}
