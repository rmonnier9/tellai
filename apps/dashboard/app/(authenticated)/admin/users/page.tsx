import { AdminUserImpersonation } from '@/components/admin-user-impersonation';
import { AppSidebar } from '@/components/app-sidebar';
import { auth } from '@workspace/auth/server';
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
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const ADMIN_IDS =
  process.env.ADMIN_IDS?.split(',').map((id) => id.trim()) || [];

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/sign-in');
  }

  // Check if user is an admin
  if (!ADMIN_IDS.includes(session.user.id)) {
    redirect('/');
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Admin - User Management</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          <div className="flex flex-col gap-2">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Admin - User Management
              </h1>
              <p className="text-muted-foreground">
                Impersonate any user to help with support or troubleshooting
              </p>
            </div>
          </div>
          <AdminUserImpersonation />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
