// CLI syntax only: no shell expansion or changes to engine command validation.
const commands = new Map([
  ['train', [1, 2, 'train o1,o2,o3 [baseId]']],
  ['preview', [1, 2, 'preview o1,o2,o3 [baseId]']],
  ['save', [0, 1, 'save [path]']],
  ['load', [0, 1, 'load [path]']],
  ...['end', 'inspect', 'trace', 'replay', 'help', 'quit', 'exit'].map(verb => [verb, [0, 0, verb]]),
]);

export function parseInput(line) {
  const tokens = [];
  let index = 0;
  while (index < line.length) {
    if (/\s/.test(line[index])) { index++; continue; }
    const quote = line[index] === '"' || line[index] === "'" ? line[index++] : null;
    const start = index;
    if (quote) {
      while (index < line.length && line[index] !== quote) index++;
      if (index === line.length) throw new Error('引号未闭合');
      tokens.push(line.slice(start, index++));
      if (index < line.length && !/\s/.test(line[index])) throw new Error('引号参数后必须为空白');
    } else {
      while (index < line.length && !/\s/.test(line[index])) index++;
      tokens.push(line.slice(start, index));
    }
  }
  if (!tokens.length) return null;
  const [verb, ...args] = tokens;
  const spec = commands.get(verb);
  if (spec && (args.length < spec[0] || args.length > spec[1] || args.some(arg => arg === ''))) {
    throw new Error(`用法：${spec[2]}（参数不能为空或多余）`);
  }
  return {verb, args};
}
