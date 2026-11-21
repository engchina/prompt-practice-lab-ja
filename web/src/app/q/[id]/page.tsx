'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutPanel,
} from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Link } from '@astryxdesign/core/Link';
import { TextArea } from '@astryxdesign/core/TextArea';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Drawer } from '@astryxdesign/core/Drawer';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { ResizeHandle, useResizable } from '@astryxdesign/core/Resizable';
import {
  anthropic,
  openai,
  english,
  lessons,
  readSaved,
  recordKey,
  generate,
  type Result,
  type Lesson,
} from '@/lib/lab';
import extensions from '@/lib/extensions.json';

function Reading({ lesson: l }: { lesson: Lesson }) {
  const [title, detail] = extensions[l.id - 1];
  return (
    <VStack gap={3}>
      <Heading level={2}>背景と教材</Heading>
      <Text>{l.goal}</Text>
      <Text>{l.guide}</Text>
      <Heading level={3}>{title}</Heading>
      <Text>{detail}</Text>
      <details>
        <summary>改善例を読む</summary>
        <p className="output">{l.example}</p>
      </details>
      <Heading level={3}>公式資料</Heading>
      <Link href={anthropic}>
        Anthropic｜プロンプティングのベストプラクティス
      </Link>
      <Link href={openai}>OpenAI｜プロンプティング</Link>
      <Link href={english}>OpenAI｜Prompting（英語原文）</Link>
    </VStack>
  );
}

function Practice({ lesson: l }: { lesson: Lesson }) {
  const initial = {
    system: l.system,
    input: l.input,
    a: l.baseline,
    b: l.baseline,
    note: '',
    done: false,
    results: {} as Partial<Record<'a' | 'b', Result>>,
  };
  const [work, setWork] = useState(() => ({
    ...initial,
    ...readSaved<typeof initial>(recordKey(l.id)),
  }));

  const [active, setActive] = useState<'a' | 'b'>('a');
  const [view, setView] = useState('play');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [docs, setDocs] = useState(false);
  const wide = useMediaQuery('(min-width: 1024px)');
  const panel = useResizable({
    defaultSize: 480,
    minSize: 320,
    maxSize: 720,
    collapsible: true,
    autoSaveId: 'prompt-lab-panel',
  });
  function update(patch: Partial<typeof work>, success = '') {
    const next = { ...work, done: false, ...patch };
    setWork(next);
    try {
      localStorage.setItem(recordKey(l.id), JSON.stringify(next));
      setNotice(success);
    } catch {
      setNotice('ブラウザに保存できません。内容を手元に控えてください。');
    }
  }
  async function run() {
    setBusy(true);
    setNotice('');
    try {
      const result = await generate(
        work.system,
        work.input,
        work[active],
      );
      update(
        { results: { ...work.results, [active]: result } },
        active === 'a'
          ? '初稿の出力を保存しました。次は改善稿を試してください。'
          : '改善稿の出力を保存しました。「出力比較」で確認できます。',
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const current = work.results[active];
  const { a, b } = work.results;
  const completedRuns = a && b;
  const differentConditions = completedRuns && (
    a.system !== b.system ||
    a.base !== b.base ||
    a.model !== b.model ||
    (a.input !== undefined && b.input !== undefined && a.input !== b.input)
  );
  return (
    <Layout
      header={
        <LayoutHeader hasDivider>
          <VStack gap={2}>
            <Text type="supporting">第 {l.id} 課 / 10</Text>
            <Heading level={1}>{l.title}</Heading>
            <HStack gap={2} hAlign="between" wrap="wrap">
              <TabList value={view} onChange={setView}>
                <Tab value="play" label="演習台" />
                <Tab value="compare" label="出力比較" />
                <Tab value="card" label="決定カード" />
              </TabList>
              {!wide && (
                <Button label="背景と教材" onClick={() => setDocs(true)} />
              )}
            </HStack>
          </VStack>
          {!wide && (
            <Drawer
              isOpen={docs}
              onOpenChange={setDocs}
              side="start"
              width={480}
              label="背景と教材"
            >
              <Reading lesson={l} />
            </Drawer>
          )}
        </LayoutHeader>
      }
      start={
        wide && (
          <>
            <LayoutPanel resizable={panel} padding={4} label="背景と教材">
              <Reading lesson={l} />
            </LayoutPanel>
            <ResizeHandle
              resizable={panel}
              hasDivider
              pillPlacement="end"
              label="教材パネルの幅を変える"
            />
          </>
        )
      }
      content={
        <LayoutContent>
          <VStack gap={4}>
            {view === 'play' && (
              <>
                <Heading level={2}>同じ題材で2案を試す</Heading>
                <Text>
                  ① 初稿を実行する。②
                  改善稿に切り替え、指示を一箇所変えて実行する。③
                  出力比較で違いを確かめる。
                </Text>
                <HStack gap={2}>
                  {(['a', 'b'] as const).map((k) => (
                    <Button
                      key={k}
                      label={k === 'a' ? '初稿 A' : '改善稿 B'}
                      variant={active === k ? 'primary' : 'secondary'}
                      isDisabled={busy}
                      onClick={() => setActive(k)}
                    />
                  ))}
                </HStack>
                <TextArea
                  label="役割・共通方針（system）"
                  rows={2}
                  value={work.system}
                  isReadOnly={busy}
                  onChange={(v) => update({ system: v })}
                />
                <TextArea
                  label="共通の入力資料（user）"
                  rows={4}
                  value={work.input}
                  isReadOnly={busy}
                  onChange={(v) => update({ input: v })}
                />
                <TextArea
                  label={active === 'a' ? '初稿の指示' : '改善稿の指示'}
                  rows={5}
                  value={work[active]}
                  isReadOnly={busy}
                  onChange={(v) => update({ [active]: v })}
                />
                <HStack gap={2} wrap="wrap">
                  <Button
                    label="この案を実行"
                    variant="primary"
                    isLoading={busy}
                    isDisabled={busy || !work[active].trim()}
                    onClick={run}
                  />
                  <Link href="/settings">LLM 接続設定</Link>
                </HStack>
                {current && (
                  <>
                    <Heading level={3}>直近の実行結果</Heading>
                    <p className="output">{current.text}</p>
                  </>
                )}
              </>
            )}
            {view === 'compare' && (
              <>
                <Heading level={2}>判定の観点</Heading>
                <Text>{l.check}</Text>
                {differentConditions && (
                  <Text>
                    役割・入力資料・接続先・モデルのいずれかが実行間で異なります。
                    指示だけの効果を調べるには、条件をそろえて両案を実行してください。
                  </Text>
                )}
                {(['a', 'b'] as const).map((k) => {
                  const r = work.results[k];
                  return (
                    <section key={k}>
                      <Heading level={3}>
                        {k === 'a' ? '初稿 A' : '改善稿 B'}
                      </Heading>
                      {r ? (
                        <>
                          <Text type="supporting">
                            {r.model} · {r.base}
                          </Text>
                          <p className="output">{r.text}</p>
                          <details>
                            <summary>実行時の役割・資料・指示</summary>
                            <p className="output">system：{r.system}</p>
                            {r.input === undefined ? (
                              <p className="output">user：{r.user}</p>
                            ) : (
                              <>
                                <p className="output">入力資料：{r.input}</p>
                                <p className="output">指示：{r.instruction}</p>
                              </>
                            )}
                          </details>
                        </>
                      ) : (
                        <Text>演習台でこの案を実行してください。</Text>
                      )}
                    </section>
                  );
                })}
                <Text>応用課題：{l.transfer}</Text>
                <Button
                  label="決定カードを書く"
                  onClick={() => setView('card')}
                />
              </>
            )}
            {view === 'card' && (
              <>
                <Heading level={2}>どちらの指示を採用しますか</Heading>
                <Text>{l.check}</Text>
                <Text>応用課題：{l.transfer}</Text>
                <TextArea
                  label="採用案・出力から分かる差・応用課題の結果"
                  rows={8}
                  value={work.note}
                  isReadOnly={busy}
                  onChange={(v) => update({ note: v })}
                />
                <Text type="supporting">
                  両案を実行し、採用理由を書くと修了できます。下書きは自動保存されます。
                </Text>
                <Button
                  label={work.done ? '修了済み' : 'この課を修了する'}
                  variant="primary"
                  isDisabled={
                    busy || work.done || !completedRuns || !work.note.trim()
                  }
                  onClick={() => update({ done: true })}
                />
                {work.done && (
                  <Link href={l.id < 10 ? '/q/' + (l.id + 1) : '/'}>
                    {l.id < 10 ? '次の課へ進む' : '全10課の進捗を見る'}
                  </Link>
                )}
              </>
            )}
            <div role="status">{notice}</div>
          </VStack>
        </LayoutContent>
      }
    />
  );
}

export default function Page() {
  const id = useParams<{ id: string }>().id;
  const lesson = lessons.find((l) => String(l.id) === id);
  return lesson ? (
    <Practice key={id} lesson={lesson} />
  ) : (
    <Link href="/">該当する課がありません。一覧へ戻る</Link>
  );
}
