'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@workspace/ui/components/sidebar';
import useProducts from '../hooks/use-products';
import useActiveProduct from '../hooks/use-active-product';
import { switchProduct } from '@workspace/lib/server-actions/switch-product';

export function ProductSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const productsQuery = useProducts();
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const currentProductQuery = useActiveProduct();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleProductSwitch = async (productId: string) => {
    if (productId === currentProductQuery?.data?.id) return;

    setIsLoading(true);
    try {
      const result = await switchProduct(productId);
      if (result.success) {
        // Force a full page reload to get updated session data
        window.location.reload();
      } else {
        console.error('Failed to switch product:', result.error);
      }
    } catch (error) {
      console.error('Error switching product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentProductQuery?.data) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {/* <activeTeam.logo className="size-4" /> */}
                <img
                  src={currentProductQuery?.data.logo!}
                  className="w-full h-full rounded-lg"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {currentProductQuery?.data.name}
                </span>
                {/* <span className="truncate text-xs">{activeTeam.plan}</span> */}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Products
            </DropdownMenuLabel>
            {productsQuery?.data?.map((product, index) => (
              <DropdownMenuItem
                key={product?.id}
                onClick={() => handleProductSwitch(product?.id!)}
                className={`gap-2 p-2 ${
                  product?.id === currentProductQuery?.data?.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : ''
                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  {product?.id === currentProductQuery?.data?.id && (
                    <div className="size-2 rounded-full bg-current" />
                  )}
                </div>
                {product?.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add product
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
