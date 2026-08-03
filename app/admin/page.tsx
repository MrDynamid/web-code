import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAdminAccess, getAdminData } from "@/lib/admin.actions"
import { getSession } from "@/lib/session"
import { AdminOverview } from "@/components/admin-overview"
import { AdminClaim } from "@/components/admin-claim"
import { AdminOrders } from "@/components/admin-orders"
import { AdminInventory } from "@/components/admin-inventory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "Store admin",
  robots: { index: false, follow: false },
}

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.user) redirect("/auth?redirect=/admin")

  const access = await getAdminAccess()

  // No admin exists yet — let the first signed-in user claim ownership once.
  if (!access.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="text-eyebrow text-muted-foreground">Store admin</p>
        <h1 className="mt-2 font-display text-4xl">
          {access.adminExists ? "Not authorised" : "Claim this store"}
        </h1>
        {access.adminExists ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            This dashboard is limited to store owners. If you should have access, ask an
            existing owner to add your account.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No owner has been set for this store yet. Claim it with your account
              ({session.user.email}) to unlock the dashboard. This can only be done once.
            </p>
            <div className="mt-6">
              <AdminClaim />
            </div>
          </>
        )}
      </div>
    )
  }

  const data = await getAdminData()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <header>
        <p className="text-eyebrow text-muted-foreground">Store admin</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Dashboard</h1>
      </header>

      <Tabs defaultValue="overview" className="mt-10">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders ({data.stats.orderCount})</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({data.stats.products})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <AdminOverview
            orders={data.orders}
            subscribers={data.subscribers}
            products={data.products}
          />
        </TabsContent>

        <TabsContent value="orders" className="mt-8">
          <AdminOrders orders={data.orders} />
        </TabsContent>

        <TabsContent value="inventory" className="mt-8">
          <AdminInventory products={data.products} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
