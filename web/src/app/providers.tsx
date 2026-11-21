'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { usePathname } from 'next/navigation';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { AppShell } from '@astryxdesign/core/AppShell';
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
} from '@astryxdesign/core/SideNav';
import { chocolateTheme } from '@astryxdesign/theme-chocolate/built';

const subscribe = () => () => {};
const browserReady = () => true;
const serverReady = () => false;

export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const ready = useSyncExternalStore(subscribe, browserReady, serverReady);
  return (
    <Theme theme={chocolateTheme}>
      <LinkProvider component={Link}>
        <AppShell
          sideNav={
            <SideNav
              header={
                <SideNavHeading
                  heading="プロンプト訓練場"
                  subheading="全10課の実践コース"
                  headingHref="/"
                />
              }
            >
              <SideNavItem
                label="レッスン一覧"
                href="/"
                isSelected={path === '/'}
              />
              <SideNavItem
                label="設定"
                href="/settings"
                isSelected={path === '/settings'}
              />
            </SideNav>
          }
        >
          {ready ? children : <Skeleton height={240} />}
        </AppShell>
      </LinkProvider>
    </Theme>
  );
}
