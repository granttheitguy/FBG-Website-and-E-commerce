import { redirect } from "next/navigation"

export default function ShippingPage() {
    // Shipping zones are managed in the admin panel
    // Super admin can access admin panel via the sidebar link
    redirect("/admin/shipping")
}
