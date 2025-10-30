'use client';

import {
  BookOpen,
  Bot,
  Calendar,
  History,
  Link2,
  Puzzle,
  Settings2,
  SquareTerminal,
  Network,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import { client } from '@workspace/auth/client';
import { ProductSwitcher } from '@workspace/ui/components/product-switcher';
import { Separator } from '@workspace/ui/components/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import { ThemeModeToggle } from '@workspace/ui/components/theme-mode-toggle';
import { cn } from '@workspace/ui/lib/utils';

// This is sample data.
const data = {
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '/test',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
      items: [
        {
          title: 'Introduction',
          url: '#',
        },
        {
          title: 'Get Started',
          url: '#',
        },
        {
          title: 'Tutorials',
          url: '#',
        },
        {
          title: 'Changelog',
          url: '#',
        },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '#',
        },
        {
          title: 'Team',
          url: '#',
        },
        {
          title: 'Billing',
          url: '#',
        },
        {
          title: 'Limits',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Content Calendar',
      url: '/calendar',
      icon: Calendar,
    },
    {
      name: 'Content History',
      url: '/history',
      icon: History,
    },
    {
      name: 'Product Settings',
      url: '/settings',
      icon: Settings2,
    },
    {
      name: 'Integrations',
      url: '/integrations',
      icon: Puzzle,
    },
    {
      name: 'Linking Configuration',
      url: '/linking-configuration',
      icon: Link2,
    },
    {
      name: 'Backlink Exchange',
      url: '/',
      icon: Network,
      label: 'soon',
      disabled: true,
    },
  ],
};

const Logo = () => {
  const { open } = useSidebar();

  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2', {
        'mx-auto': !open,
        'pl-2': !!open,
      })}
    >
      <Image
        src="/images/lovarank-logo-icon-animated-2.png"
        alt="Lovarank Icon"
        width={24}
        height={24}
        className={cn('h-auto w-6', {
          '-rotate-15 w-6': !!open,
        })}
      />
      {open && (
        <>
          <span className="text-lg font-extrabold font-display">Lovarank</span>
          <div className="ml-auto">
            <ThemeModeToggle />
          </div>
        </>
      )}
    </Link>
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = client.useSession();

  const user = {
    name:
      session?.data?.user.name ||
      session?.data?.user.email?.split('@')[0] ||
      '',
    email: session?.data?.user.email || '',
    avatar: session?.data?.user.image || '',
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Logo />
        <Separator />
        <ProductSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
