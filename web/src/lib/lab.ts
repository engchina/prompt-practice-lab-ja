import lessons from './lessons.json';
export type Lesson = (typeof lessons)[number];
export { lessons };
export const anthropic =
  'https://platform.claude.com/docs/ja/build-with-claude/prompt-engineering/claude-prompting-best-practices';
export const openai =
  'https://developers.openai.com/ja-JP/api/docs/guides/prompting';
export const english =
  'https://developers.openai.com/api/docs/guides/prompting';
const defaultConnection = {
  base: 'https://api.openai.com/v1',
  model: '',
};
const connectionKey = 'prompt-lab:connection';
let credential: { base: string; key: string } | undefined;

export function readSaved<T extends object>(key: string): Partial<T> | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    return saved && typeof saved === 'object' && !Array.isArray(saved)
      ? saved
      : null;
  } catch {
    return null;
  }
}

export function settings() {
  const saved = readSaved<typeof defaultConnection>(connectionKey);
  const base = typeof saved?.base === 'string' ? saved.base : defaultConnection.base;
  return {
    base,
    model: typeof saved?.model === 'string' ? saved.model : '',
    key: credential?.base === base ? credential.key : '',
  };
}

export function saveSettings(base: string, model: string, key: string) {
  localStorage.setItem(connectionKey, JSON.stringify({ base, model }));
  credential = { base, key };
}

export async function generate(system: string, input: string, instruction: string) {
  const config = settings();
  if (!config.model.trim())
    throw new Error('設定で接続先とモデルIDを入力してください。');
  const user = input + '\n\n' + instruction;
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...config, system, user }),
    signal: AbortSignal.timeout(100000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      typeof body.detail === 'string'
        ? body.detail
        : 'APIを起動してから再実行してください。',
    );
  if (typeof body.text !== 'string' || !body.text.trim())
    throw new Error('接続先からテキスト応答を取得できませんでした。');
  return {
    text: body.text,
    model: config.model,
    base: config.base,
    system,
    user,
    input,
    instruction,
  };
}
type RunResult = Awaited<ReturnType<typeof generate>>;
export type Result = Omit<RunResult, 'input' | 'instruction'> &
  Partial<Pick<RunResult, 'input' | 'instruction'>>;
export const recordKey = (id: number) => 'prompt-lab:lesson:' + id;
