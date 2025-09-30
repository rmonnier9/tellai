'use client';

import { AppSidebar } from '@/components/app-sidebar';
import Premium from '@workspace/ui/components/premium';
import PricingTable from '@workspace/ui/components/pricing-table';
import useSubscriptions from '@workspace/ui/hooks/use-subscriptions';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Separator } from '@workspace/ui/components/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar';
import Free from '@workspace/ui/components/free';
import { client } from '@workspace/auth/client';
import { Button } from '@workspace/ui/components/button';

import CreateProductForm from '@workspace/ui/components/create-product-form';

export default function Page() {
  const subscriptionQuery = useSubscriptions();
  const manageSubscription = async () => {
    const { data, error } = await client.subscription.billingPortal({
      referenceId: subscriptionQuery?.data?.subscriptions?.[0]?.referenceId,
    });
  };
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
            <CreateProductForm />
            <Free>
              <PricingTable />
            </Free>
            <Premium>
              <Button onClick={manageSubscription}>Manage subscription</Button>
            </Premium>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
