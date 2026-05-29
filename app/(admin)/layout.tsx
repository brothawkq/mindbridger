import AdminSidebar from "@/components/admin/AdminSidebar";
import MobilePanelShell from "@/components/shared/MobilePanelShell";
import type { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <MobilePanelShell sidebar={<AdminSidebar />} rolLabel="Admin">
      {children}
    </MobilePanelShell>
  );
}
