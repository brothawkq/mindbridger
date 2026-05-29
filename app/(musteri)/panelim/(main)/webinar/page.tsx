import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import WebinarKlient, {
  type MusteriWebinar,
} from "@/components/musteri/WebinarKlient";

export const metadata = { title: "Webinarlarım | MindBridger" };

export default async function WebinarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  // Kayıtlar
  const { data: kayitlarRaw } = await supabase
    .from("webinar_kayitlar")
    .select("id, webinar_id, status")
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const kayitlar = kayitlarRaw ?? [];

  if (kayitlar.length === 0) {
    return (
      <>
        <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
          <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
            Webinarlarım
          </span>
          <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
            Müşteri
          </span>
        </div>
        <WebinarKlient webinarlar={[]} />
      </>
    );
  }

  // Webinar detayları
  const webinarIds = kayitlar.map((k) => k.webinar_id);
  const { data: webinarlarRaw } = await supabase
    .from("webinarlar")
    .select(
      "id, title, description, scheduled_at, duration_minutes, price, status, daily_room_name"
    )
    .in("id", webinarIds)
    .is("deleted_at", null);

  const webinarMap = new Map(
    (webinarlarRaw ?? []).map((w) => [w.id, w])
  );

  const webinarlar: MusteriWebinar[] = kayitlar
    .filter((k) => webinarMap.has(k.webinar_id))
    .map((k) => {
      const w = webinarMap.get(k.webinar_id)!;
      return {
        kayit_id: k.id,
        webinar_id: w.id,
        title: w.title,
        description: w.description,
        scheduled_at: w.scheduled_at,
        duration_minutes: w.duration_minutes,
        price: w.price,
        status: w.status,
        kayit_status: k.status,
        daily_room_name: w.daily_room_name,
      };
    });

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Webinarlarım
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Kayıtlı olduğunuz webinarlar
        </span>
      </div>

      <div className="overflow-y-auto flex-1">
        <WebinarKlient webinarlar={webinarlar} />
      </div>
    </>
  );
}
