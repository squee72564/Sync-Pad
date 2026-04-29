'use client';

import { Link } from '@tanstack/react-router';
import type React from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '#/components/ui/navigation-menu';

const components: {
  id: string;
  title: string;
  href: string;
  description: string;
}[] = [
  {
    id: 'about',
    title: 'About Sync Pad',
    href: '/about',
    description: 'Learn more about what we have to offer',
  },
  {
    id: 'docs',
    title: 'Documentation',
    href: '/docs',
    description: 'Get started with Sync Pad',
  },
];

export default function HomeNavigationMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex flex-col items-start gap-2 min-w-86 max-w-112">
              {components.map((item) => (
                <ListItem
                  key={item.id}
                  href={item.href}
                  title={item.title}
                  className="w-full"
                >
                  {item.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link to="/docs">Docs</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link to={href} className="block w-full text-left">
          <div className="flex flex-col items-start gap-1 text-left text-sm">
            <div className="leading-none font-medium">{title}</div>
            <div className="line-clamp-2 text-muted-foreground">{children}</div>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
