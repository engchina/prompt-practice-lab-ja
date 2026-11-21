'use client';
import { useState } from 'react';
import { Layout, LayoutHeader, LayoutContent } from '@astryxdesign/core/Layout';
import { Heading } from '@astryxdesign/core/Heading';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Table,
  type TableColumn,
  pixel,
  proportional,
} from '@astryxdesign/core/Table';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { lessons, readSaved, recordKey, type Lesson } from '@/lib/lab';

export default function Index() {
  const [filter, setFilter] = useState('すべて');
  const [states] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      lessons.map((l) => {
        const saved = readSaved<{ done: boolean }>(recordKey(l.id));
        return [
          l.id,
          saved ? (saved.done ? '修了' : '練習中') : '未着手',
        ];
      }),
    ),
  );
  const columns: TableColumn<Lesson>[] = [
    { key: 'id', header: '課', width: pixel(52) },
    {
      key: 'title',
      header: 'レッスン',
      width: proportional(2, { minWidth: 160 }),
      renderCell: (l) => <Link href={'/q/' + l.id}>{l.title}</Link>,
    },
    {
      key: 'goal',
      header: '演習の目標',
      width: proportional(3, { minWidth: 180 }),
    },
    {
      key: 'status',
      header: '進捗',
      width: pixel(80),
      renderCell: (l) => (
        <Badge
          label={states[l.id] ?? '…'}
          variant={states[l.id] === '修了' ? 'success' : 'neutral'}
        />
      ),
    },
  ];
  return (
    <Layout
      header={
        <LayoutHeader>
          <VStack gap={2}>
            <Heading level={1}>レッスン一覧</Heading>
            <Text>
              初稿を試し、指示を一つ変え、出力を比べます。修了{' '}
              {Object.values(states).filter((s) => s === '修了').length} / 10
            </Text>
            <SegmentedControl
              label="進捗で絞り込み"
              value={filter}
              onChange={setFilter}
            >
              {['すべて', '未着手', '練習中', '修了'].map((f) => (
                <SegmentedControlItem key={f} value={f} label={f} />
              ))}
            </SegmentedControl>
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent>
          <Table
            data={lessons.filter(
              (l) => filter === 'すべて' || states[l.id] === filter,
            )}
            columns={columns}
            idKey="id"
            hasHover
          />
        </LayoutContent>
      }
    />
  );
}
