'use client';
import { useState } from 'react';
import { Layout, LayoutContent, LayoutHeader } from '@astryxdesign/core/Layout';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { saveSettings, settings } from '@/lib/lab';

export default function SettingsPage() {
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState('');

  function change(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      ...(field === 'base' && current.base !== value ? { key: '' } : {}),
      [field]: value,
    }));
    setMessage('');
  }
  function save() {
    let url: URL;
    try {
      url = new URL(form.base);
    } catch {
      setMessage('URLを確認してください。');
      return;
    }
    if (
      !(
        url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      ) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      setMessage('HTTPS または localhost の HTTP URL を指定してください。');
      return;
    }
    try {
      saveSettings(url.href.replace(/\/+$/, ''), form.model.trim(), form.key.trim());
    } catch {
      setMessage('ブラウザに設定を保存できません。');
      return;
    }
    setMessage('保存しました。レッスン一覧から演習を開始できます。');
  }
  return (
    <Layout
      header={
        <LayoutHeader>
          <Heading level={1}>LLM 接続設定</Heading>
        </LayoutHeader>
      }
      content={
        <LayoutContent>
          <VStack gap={4} maxWidth={640}>
            <Text>
              Chat Completions
              に対応する接続先を指定してください。実行時にプロンプトとキーをこの接続先へ送ります。
            </Text>
            <TextInput
              label="ベースURL（例 https://api.openai.com/v1）"
              value={form.base}
              onChange={(v) => change('base', v)}
            />
            <TextInput
              label="モデルID（接続先で利用できる名称）"
              value={form.model}
              onChange={(v) => change('model', v)}
            />
            <TextInput
              type="password"
              autoComplete="off"
              label="APIキー（認証不要の場合は空欄）"
              value={form.key}
              onChange={(v) => change('key', v)}
            />
            <Text type="supporting">
              URLとモデルIDはこのブラウザに保存します。キーはページを再読み込みするまでメモリ内で保持します。
            </Text>
            <Button
              label="設定を保存"
              variant="primary"
              isDisabled={!form.model.trim() || !form.base.trim()}
              onClick={save}
            />
            <div role="status">{message}</div>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
