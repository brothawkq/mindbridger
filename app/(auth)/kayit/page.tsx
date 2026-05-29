"use client";

import React, { useState, useId, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ─── Sabitler ─────────────────────────────────────────────────
const UZMANLIK = [
  "Anksiyete ve Panik Atak","Depresyon","Travma ve PTSD",
  "Çift ve İlişki Terapisi","Aile Terapisi","Çocuk ve Ergen",
  "OKB","Yeme Bozuklukları","Bağımlılık","Yas ve Kayıp",
  "Kariyer ve İş Hayatı","Öz Güven","Fobiler","Uyku Sorunları",
  "LGBTQ+ Meseleler","Cinsel Sağlık","Kişilik Bozuklukları",
];

const YAKLASIMLAR = [
  "BDT (Bilişsel Davranışçı Terapi)","EMDR","Psikoanaliz",
  "Gestalt Terapisi","Çözüm Odaklı Terapi","ACT",
  "Şema Terapi","Aile Sistemleri Terapisi","Mindfulness Tabanlı","Varoluşçu Terapi",
];

const YAS_GRUPLARI = ["Çocuk (0-12)","Ergen (13-18)","Yetişkin (19-64)","Yaşlı (65+)"];
const DILLER = ["Türkçe","İngilizce","Almanca","Arapça","Fransızca","Rusça"];
const UNVANLAR = ["Psikolog","Klinik Psikolog","Uzman PDR","Psikoterapist","Çocuk ve Ergen Psikologu","Psikiyatrist","Sosyal Çalışmacı"];
const BANKALAR = ["Ziraat Bankası","Halkbank","Vakıfbank","İş Bankası","Garanti BBVA","Akbank","Yapı Kredi","QNB Finansbank","Denizbank","TEB","İNG","HSBC","Diğer"];
const SEKTORLER = ["Teknoloji","Finans ve Bankacılık","Sağlık","Eğitim","Perakende","Üretim","Lojistik","İnşaat","Medya","Hukuk","Kamu Kurumu","Diğer"];
const SIRKET_TURLERI = ["Anonim Şirket (A.Ş.)","Limited Şirket (Ltd. Şti.)","Şahıs Şirketi","Kamu Kurumu","Dernek / Vakıf","Diğer"];

// ─── Şemalar ──────────────────────────────────────────────────
const musteriSchema = z.object({
  first_name: z.string().min(2,"Ad en az 2 karakter.").max(50),
  last_name:  z.string().min(2,"Soyad en az 2 karakter.").max(50),
  email:      z.string().min(1,"E-posta zorunludur.").email("Geçerli e-posta girin."),
  phone:      z.string().regex(/^(\+90|0)?[0-9]{10}$/,"Geçerli telefon numarası girin.").optional().or(z.literal("")),
  password:   z.string().min(8,"En az 8 karakter.").regex(/[A-Z]/,"En az 1 büyük harf.").regex(/[0-9]/,"En az 1 rakam."),
  confirm_password: z.string().min(1,"Şifre tekrarı zorunludur."),
  kvkk: z.literal(true,{ message: "KVKK metnini kabul etmelisiniz." }),
}).refine(d => d.password === d.confirm_password,{ message:"Şifreler eşleşmiyor.", path:["confirm_password"] });

const danisanSchema = z.object({
  // Adım 1
  first_name: z.string().min(2,"Ad en az 2 karakter.").max(50),
  last_name:  z.string().min(2,"Soyad en az 2 karakter.").max(50),
  email:      z.string().min(1,"E-posta zorunludur.").email("Geçerli e-posta girin."),
  phone:      z.string().regex(/^(\+90|0)?[0-9]{10}$/,"Geçerli telefon girin.").optional().or(z.literal("")),
  gender:     z.enum(["erkek","kadin","belirtmek_istemiyorum"] as const,{ message:"Cinsiyet seçiniz." }),
  city:       z.string().min(2,"Şehir zorunludur.").max(80),
  age_groups: z.array(z.string()).min(1,"En az bir yaş grubu seçin."),
  languages:  z.array(z.string()).min(1,"En az bir dil seçin."),
  // Adım 2
  title:                 z.string().min(2,"Unvan seçiniz."),
  specialties:           z.array(z.string()).min(1,"En az bir uzmanlık alanı seçin."),
  approach:              z.array(z.string()).min(1,"En az bir terapi yaklaşımı seçin."),
  session_duration:      z.coerce.number().int().min(1,"Seans süresi seçiniz."),
  is_online:             z.boolean(),
  is_in_person:          z.boolean(),
  price_individual:      z.coerce.number().positive("Geçerli seans ücreti girin."),
  intro_session_enabled: z.boolean(),
  // Adım 4
  password:         z.string().min(8,"En az 8 karakter.").regex(/[A-Z]/,"En az 1 büyük harf.").regex(/[0-9]/,"En az 1 rakam."),
  confirm_password: z.string().min(1,"Şifre tekrarı zorunludur."),
  bank_iban:         z.string().regex(/^TR\d{24}$/,"Geçerli IBAN girin (TR + 24 rakam)."),
  bank_name:         z.string().min(2,"Banka adı zorunludur."),
  bank_account_name: z.string().min(2,"Hesap sahibi adı zorunludur."),
  kvkk: z.literal(true,{ message:"KVKK ve Danışman Sözleşmesini kabul etmelisiniz." }),
}).superRefine((d,ctx) => {
  if (d.password !== d.confirm_password) ctx.addIssue({ code:"custom", message:"Şifreler eşleşmiyor.", path:["confirm_password"] });
  if (!d.is_online && !d.is_in_person) ctx.addIssue({ code:"custom", message:"En az bir seans türü seçiniz.", path:["is_online"] });
});

const sirketSchema = z.object({
  company_name:   z.string().min(2,"Şirket adı zorunludur.").max(150),
  tax_id:         z.string().regex(/^\d{10}$/,"10 haneli vergi kimlik numarası girin."),
  tax_office:     z.string().min(2,"Vergi dairesi zorunludur.").max(100),
  company_type:   z.string().min(2,"Şirket türü seçiniz."),
  sector:         z.string().min(2,"Sektör seçiniz."),
  city:           z.string().min(2,"İl zorunludur.").max(80),
  contact_name:   z.string().min(2,"Yetkili adı zorunludur.").max(100),
  contact_title:  z.string().min(2,"Yetkili unvanı zorunludur.").max(100),
  email:          z.string().min(1,"E-posta zorunludur.").email("Geçerli e-posta girin."),
  phone:          z.string().regex(/^(\+90|0)?[0-9]{10}$/,"Geçerli telefon girin."),
  license_count:         z.preprocess(v => Number(v), z.number().int().min(1,"En az 1 lisans gereklidir.").max(10000)),
  default_monthly_budget:z.preprocess(v => Number(v), z.number().min(0,"Geçerli bütçe girin.")),
  password:         z.string().min(8,"En az 8 karakter.").regex(/[A-Z]/,"En az 1 büyük harf.").regex(/[0-9]/,"En az 1 rakam."),
  confirm_password: z.string().min(1,"Şifre tekrarı zorunludur."),
  kvkk: z.literal(true,{ message:"KVKK ve Kurumsal Sözleşmeyi kabul etmelisiniz." }),
}).refine(d => d.password === d.confirm_password,{ message:"Şifreler eşleşmiyor.", path:["confirm_password"] });

type MusteriForm = z.infer<typeof musteriSchema>;
type DanisanForm = z.infer<typeof danisanSchema>;
type SirketForm  = z.infer<typeof sirketSchema>;
type Role = "musteri" | "danisan" | "sirket";

// ─── Ortak Bileşenler ──────────────────────────────────────────
function Field({ label, required, error, children, hint }: {
  label: string; required?: boolean; error?: string;
  children: React.ReactNode; hint?: string;
}) {
  const id = useId();
  return (
    <div style={{ marginBottom: error ? 4 : 14 }}>
      <label htmlFor={id} style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", color: error ? "oklch(0.577 0.245 27.325)" : "#252625", marginBottom:5 }}>
        {label}{required && <span style={{ color:"#4A4D4A", marginLeft:3 }}>*</span>}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, { id })
        : children}
      {hint && !error && <p style={{ fontSize:10, color:"#4A4D4A", marginTop:3 }}>{hint}</p>}
      {error && <p role="alert" style={{ fontSize:11, color:"oklch(0.577 0.245 27.325)", marginTop:4, marginBottom:10 }}>⚠ {error}</p>}
    </div>
  );
}

function inp(err: boolean): React.CSSProperties {
  return { width:"100%", border:`1.5px solid ${err ? "oklch(0.577 0.245 27.325)" : "#252625"}`, padding:"9px 12px", fontSize:13, fontFamily:"inherit", color:"#252625", backgroundColor: err ? "#F5F7F5" : "#FFFCF6", display:"block" };
}

function sel(err: boolean): React.CSSProperties {
  return { ...inp(err), cursor:"pointer" };
}

function StepBar({ current, total, labels }: { current: number; total: number; labels?: string[] }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", gap:4 }}>
        {Array.from({ length: total }).map((_,i) => (
          <div key={i} style={{ flex:1, height:3, backgroundColor: i < current ? "#325343" : "#E8E4DC", transition:"background-color 0.2s" }} />
        ))}
      </div>
      {labels && <p style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", color:"#4A4D4A", marginTop:8 }}>Adım {current}/{total} — {labels[current-1]}</p>}
    </div>
  );
}

function CheckboxPills({ items, selected, onChange, error }: { items: string[]; selected: string[]; onChange: (v: string[]) => void; error?: string }) {
  const toggle = (item: string) => onChange(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]);
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: error ? 4 : 0 }}>
        {items.map(item => {
          const active = selected.includes(item);
          return (
            <button key={item} type="button" onClick={() => toggle(item)}
              style={{ fontSize:11, fontWeight: active ? 700 : 400, padding:"5px 10px", border:`1.5px solid ${active ? "#325343" : "#E8E4DC"}`, backgroundColor: active ? "#325343" : "#FFFCF6", color: active ? "#FFFFFF" : "#252625", cursor:"pointer", transition:"all 0.1s" }}>
              {item}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" style={{ fontSize:11, color:"oklch(0.577 0.245 27.325)", marginTop:4 }}>⚠ {error}</p>}
    </div>
  );
}

function ServerErr({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div role="alert" style={{ backgroundColor:"#F5F7F5", border:"1.5px solid oklch(0.577 0.245 27.325)", padding:"8px 12px", fontSize:12, color:"#252625", marginBottom:16, display:"flex", gap:6 }}>
      <span>⚠</span><span>{msg}</span>
    </div>
  );
}

// ─── Müşteri Formu ─────────────────────────────────────────────
function MusteriKayit() {
  const prefersReduced = useReducedMotion();
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const { register, handleSubmit, getValues, formState:{ errors, isSubmitting } } = useForm<MusteriForm>({ resolver: zodResolver(musteriSchema) });

  const onSubmit = async (data: MusteriForm) => {
    setServerErr("");
    try {
      const res = await fetch("/api/auth/register/musteri",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ first_name:data.first_name, last_name:data.last_name, email:data.email, password:data.password, phone:data.phone ?? null, kvkk:data.kvkk }) });
      const json = (await res.json()) as { error?:string };
      if (!res.ok) { setServerErr(json.error ?? "Kayıt sırasında bir hata oluştu."); return; }
      setSubmitted(true);
    } catch { setServerErr("Bağlantı hatası. Lütfen tekrar deneyin."); }
  };

  if (submitted) return (
    <div style={{ padding:"40px 36px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:16 }}>📬</div>
      <p style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>E-postanızı doğrulayın</p>
      <p style={{ fontSize:13, color:"#4A4D4A", lineHeight:1.7, marginBottom:20 }}>
        <strong>{getValues("email")}</strong> adresine doğrulama linki gönderdik.
      </p>
      <Link href="/giris" style={{ display:"inline-block", padding:"9px 20px", backgroundColor:"#325343", color:"#FFFFFF", fontSize:13, fontWeight:700, textDecoration:"none" }}>Giriş Sayfasına Dön</Link>
    </div>
  );

  return (
    <div style={{ padding:"24px 36px 32px" }}>
      <ServerErr msg={serverErr} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Field label="Ad" required error={errors.first_name?.message}><input type="text" autoComplete="given-name" placeholder="Adınız" {...register("first_name")} style={inp(!!errors.first_name)} /></Field>
          <Field label="Soyad" required error={errors.last_name?.message}><input type="text" autoComplete="family-name" placeholder="Soyadınız" {...register("last_name")} style={inp(!!errors.last_name)} /></Field>
        </div>
        <Field label="E-posta" required error={errors.email?.message}><input type="email" autoComplete="email" placeholder="ornek@mail.com" {...register("email")} style={inp(!!errors.email)} /></Field>
        <Field label="Telefon" error={errors.phone?.message} hint="İsteğe bağlı"><input type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" {...register("phone")} style={inp(!!errors.phone)} /></Field>
        <Field label="Şifre" required error={errors.password?.message}>
          <div style={{ position:"relative" }}>
            <input type={showPass ? "text" : "password"} autoComplete="new-password" {...register("password")} style={{ ...inp(!!errors.password), paddingRight:36 }} />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4A4D4A", fontSize:14, cursor:"pointer" }}>{showPass ? "🙈" : "👁"}</button>
          </div>
        </Field>
        <Field label="Şifre Tekrar" required error={errors.confirm_password?.message}>
          <div style={{ position:"relative" }}>
            <input type={showConf ? "text" : "password"} autoComplete="new-password" {...register("confirm_password")} style={{ ...inp(!!errors.confirm_password), paddingRight:36 }} />
            <button type="button" onClick={() => setShowConf(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4A4D4A", fontSize:14, cursor:"pointer" }}>{showConf ? "🙈" : "👁"}</button>
          </div>
        </Field>
        <div style={{ marginBottom:20 }}>
          <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
            <input type="checkbox" {...register("kvkk")} style={{ width:16, height:16, flexShrink:0, marginTop:1, accentColor:"#325343" }} />
            <span style={{ fontSize:12, color:"#252625", lineHeight:1.6 }}>
              <Link href="/kvkk" target="_blank" style={{ color:"#252625", textDecoration:"underline" }}>KVKK Aydınlatma Metnini</Link> ve <Link href="/gizlilik-politikasi" target="_blank" style={{ color:"#252625", textDecoration:"underline" }}>Gizlilik Politikasını</Link> okudum, kabul ediyorum.<span style={{ color:"#4A4D4A" }}> *</span>
            </span>
          </label>
          {errors.kvkk && <p role="alert" style={{ fontSize:11, color:"oklch(0.577 0.245 27.325)", marginTop:6 }}>⚠ {errors.kvkk.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} style={{ width:"100%", backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
          {isSubmitting ? "Kayıt oluşturuluyor..." : "Hesap Oluştur"}
        </button>
      </form>
      <div style={{ marginTop:16, textAlign:"center", fontSize:12, color:"#4A4D4A" }}>
        Zaten hesabın var mı?{" "}<Link href="/giris" style={{ color:"#252625", textDecoration:"underline" }}>Giriş yap</Link>
      </div>
    </div>
  );
}

// ─── Danışman Formu (4 Adım) ───────────────────────────────────
const DANISAN_STEPS = ["Kişisel Bilgiler","Mesleki Bilgiler","Belgeler","Hesap & Banka"];
const STEP_FIELDS: Record<number, (keyof DanisanForm)[]> = {
  1: ["first_name","last_name","email","phone","gender","city","age_groups","languages"],
  2: ["title","specialties","approach","session_duration","is_online","is_in_person","price_individual","intro_session_enabled"],
  3: [],
  4: ["password","confirm_password","bank_iban","bank_name","bank_account_name","kvkk"],
};

function DanisanKayit() {
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [dir, setDir]   = useState(1);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [idDocFile,   setIdDocFile]   = useState<File | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState("");
  const diplomaRef = useRef<HTMLInputElement>(null);
  const idDocRef   = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, trigger, watch, setValue, getValues, formState:{ errors, isSubmitting } } = useForm<DanisanForm, any, DanisanForm>({
    resolver: zodResolver(danisanSchema) as Resolver<DanisanForm>,
    defaultValues: { age_groups:[], specialties:[], approach:[], languages:["Türkçe"], is_online:true, is_in_person:false, intro_session_enabled:true, session_duration:50 },
  });

  const watchOnline    = watch("is_online");
  const watchInPerson  = watch("is_in_person");
  const watchSpec      = watch("specialties") as string[];
  const watchApproach  = watch("approach") as string[];
  const watchAgeGroups = watch("age_groups") as string[];
  const watchLanguages = watch("languages") as string[];

  const SLIDE = { enter: (d: number) => ({ opacity:0, x: d > 0 ? 24 : -24 }), center:{ opacity:1, x:0 }, exit: (d: number) => ({ opacity:0, x: d > 0 ? -24 : 24 }) };

  const goNext = async () => {
    const ok = await trigger(STEP_FIELDS[step] as Array<keyof DanisanForm>);
    if (!ok) return;
    if (step === 3) {
      if (!diplomaFile) { alert("Lütfen diploma/belge yükleyin."); return; }
    }
    setDir(1); setStep(s => s + 1);
  };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  const onSubmit = async (data: DanisanForm) => {
    setServerErr("");
    try {
      const fd = new FormData();
      fd.append("first_name", data.first_name); fd.append("last_name", data.last_name);
      fd.append("email", data.email); fd.append("phone", data.phone ?? "");
      fd.append("password", data.password); fd.append("gender", data.gender);
      fd.append("age_groups", JSON.stringify(data.age_groups));
      fd.append("city", data.city); fd.append("languages", JSON.stringify(data.languages));
      fd.append("title", data.title); fd.append("specialties", JSON.stringify(data.specialties));
      fd.append("approach", JSON.stringify(data.approach));
      fd.append("session_duration", String(data.session_duration));
      fd.append("is_online", String(data.is_online)); fd.append("is_in_person", String(data.is_in_person));
      fd.append("price_individual", String(data.price_individual));
      fd.append("intro_session_enabled", String(data.intro_session_enabled));
      if (diplomaFile) fd.append("diploma", diplomaFile);
      if (idDocFile)   fd.append("id_document", idDocFile);
      fd.append("bank_iban", data.bank_iban); fd.append("bank_name", data.bank_name);
      fd.append("bank_account_name", data.bank_account_name);
      fd.append("kvkk", String(data.kvkk));
      const res = await fetch("/api/auth/register/danisan",{ method:"POST", body:fd });
      const json = (await res.json()) as { error?:string };
      if (!res.ok) { setServerErr(json.error ?? "Kayıt sırasında bir hata oluştu."); return; }
      setSubmitted(true);
    } catch { setServerErr("Bağlantı hatası. Lütfen tekrar deneyin."); }
  };

  if (submitted) return (
    <div style={{ padding:"40px 36px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:16 }}>✅</div>
      <p style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Başvurunuz Alındı</p>
      <p style={{ fontSize:13, color:"#4A4D4A", lineHeight:1.7 }}>
        Belgeleriniz incelendikten sonra 24–48 saat içinde size bilgi vereceğiz.
      </p>
    </div>
  );

  return (
    <div style={{ padding:"24px 36px 32px" }}>
      <StepBar current={step} total={4} labels={DANISAN_STEPS} />
      <ServerErr msg={serverErr} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AnimatePresence mode="wait" custom={dir}>
          {/* ── Adım 1: Kişisel ── */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: prefersReduced ? 0.01 : 0.18 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Ad" required error={errors.first_name?.message}><input type="text" autoComplete="given-name" placeholder="Adınız" {...register("first_name")} style={inp(!!errors.first_name)} /></Field>
                <Field label="Soyad" required error={errors.last_name?.message}><input type="text" autoComplete="family-name" placeholder="Soyadınız" {...register("last_name")} style={inp(!!errors.last_name)} /></Field>
              </div>
              <Field label="E-posta" required error={errors.email?.message}><input type="email" autoComplete="email" placeholder="ornek@mail.com" {...register("email")} style={inp(!!errors.email)} /></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Telefon" required error={errors.phone?.message}><input type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" {...register("phone")} style={inp(!!errors.phone)} /></Field>
                <Field label="Cinsiyet" required error={errors.gender?.message}>
                  <select {...register("gender")} style={sel(!!errors.gender)}>
                    <option value="">Seçiniz</option>
                    <option value="kadin">Kadın</option>
                    <option value="erkek">Erkek</option>
                    <option value="belirtmek_istemiyorum">Belirtmek istemiyorum</option>
                  </select>
                </Field>
              </div>
              <Field label="İl" required error={errors.city?.message} hint="Hizmet verdiğiniz şehir"><input type="text" placeholder="İstanbul" {...register("city")} style={inp(!!errors.city)} /></Field>
              <Field label="Hizmet Verilen Yaş Grupları" required error={errors.age_groups?.message}>
                <CheckboxPills items={YAS_GRUPLARI} selected={watchAgeGroups} onChange={v => setValue("age_groups",v,{ shouldValidate:true })} error={errors.age_groups?.message} />
              </Field>
              <Field label="Konuşulan Diller" required error={errors.languages?.message}>
                <CheckboxPills items={DILLER} selected={watchLanguages} onChange={v => setValue("languages",v,{ shouldValidate:true })} error={errors.languages?.message} />
              </Field>
              <button type="button" onClick={goNext} style={{ width:"100%", backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor:"pointer", marginTop:4 }}>Devam Et →</button>
            </motion.div>
          )}

          {/* ── Adım 2: Mesleki ── */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: prefersReduced ? 0.01 : 0.18 }}>
              <Field label="Mesleki Unvan" required error={errors.title?.message}>
                <select {...register("title")} style={sel(!!errors.title)}>
                  <option value="">Unvan seçiniz</option>
                  {UNVANLAR.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Uzmanlık Alanları" required error={errors.specialties?.message}>
                <CheckboxPills items={UZMANLIK} selected={watchSpec} onChange={v => setValue("specialties",v,{ shouldValidate:true })} error={errors.specialties?.message} />
              </Field>
              <Field label="Terapi Yaklaşımları" required error={errors.approach?.message}>
                <CheckboxPills items={YAKLASIMLAR} selected={watchApproach} onChange={v => setValue("approach",v,{ shouldValidate:true })} error={errors.approach?.message} />
              </Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Seans Süresi (dakika)" required error={errors.session_duration?.message}>
                  <select {...register("session_duration")} style={sel(!!errors.session_duration)}>
                    <option value={45}>45 dakika</option>
                    <option value={50}>50 dakika</option>
                    <option value={60}>60 dakika</option>
                    <option value={90}>90 dakika</option>
                  </select>
                </Field>
                <Field label="Seans Ücreti (TL)" required error={errors.price_individual?.message}><input type="number" min={1} placeholder="800" {...register("price_individual")} style={inp(!!errors.price_individual)} /></Field>
              </div>
              <Field label="Seans Türü" required error={errors.is_online?.message}>
                <div style={{ display:"flex", gap:8 }}>
                  {([["is_online","Online",watchOnline],["is_in_person","Yüz yüze",watchInPerson]] as [keyof DanisanForm, string, boolean][]).map(([key,label,active]) => (
                    <label key={key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"8px 14px", border:`1.5px solid ${active ? "#252625" : "#E8E4DC"}`, backgroundColor: active ? "#252625" : "#FFFCF6", color: active ? "#FFFFFF" : "#252625", transition:"all 0.1s" }}>
                      <input type="checkbox" {...register(key)} style={{ accentColor:"#325343" }} />
                      <span style={{ fontSize:12, fontWeight: active ? 700 : 400 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Ücretsiz Tanışma Seansı (15 dk)">
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                  <input type="checkbox" {...register("intro_session_enabled")} style={{ accentColor:"#325343" }} />
                  <span style={{ fontSize:12, color:"#252625" }}>Yeni danışanlara 15 dk ücretsiz tanışma seansı sun</span>
                </label>
              </Field>
              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button type="button" onClick={goBack} style={{ flex:"0 0 auto", padding:"11px 16px", backgroundColor:"#FFFCF6", color:"#252625", border:"1.5px solid #252625", fontSize:13, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>← Geri</button>
                <button type="button" onClick={goNext} style={{ flex:1, backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>Devam Et →</button>
              </div>
            </motion.div>
          )}

          {/* ── Adım 3: Belgeler ── */}
          {step === 3 && (
            <motion.div key="s3" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: prefersReduced ? 0.01 : 0.18 }}>
              <div style={{ backgroundColor:"#F5F7F5", border:"1px solid #E8E4DC", padding:"10px 14px", fontSize:12, color:"#4A4D4A", lineHeight:1.6, marginBottom:20 }}>
                Yüklenen belgeler gizlilik kapsamında şifreli olarak saklanır. Onay sürecinde yalnızca platform ekibimiz tarafından incelenir.
              </div>

              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", color:"#252625", marginBottom:6 }}>Diploma / Lisans Belgesi <span style={{ color:"#4A4D4A" }}>*</span></p>
                <p style={{ fontSize:11, color:"#4A4D4A", marginBottom:8 }}>Mezuniyet belgenizi yükleyin (PDF, JPG, PNG — maks. 10 MB)</p>
                <input ref={diplomaRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 10*1024*1024) setDiplomaFile(f); else if (f) alert("Dosya 10 MB'dan küçük olmalıdır."); }} />
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button type="button" onClick={() => diplomaRef.current?.click()} style={{ padding:"9px 16px", border:"1.5px solid #252625", backgroundColor:"#FFFCF6", color:"#252625", fontSize:12, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>Dosya Seç</button>
                  {diplomaFile ? <span style={{ fontSize:12, color:"#325343", fontWeight:700 }}>✓ {diplomaFile.name}</span> : <span style={{ fontSize:12, color:"#4A4D4A" }}>Dosya seçilmedi</span>}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", color:"#252625", marginBottom:6 }}>Uzmanlık Sertifikaları <span style={{ color:"#4A4D4A", fontWeight:400 }}>(İsteğe bağlı)</span></p>
                <p style={{ fontSize:11, color:"#4A4D4A", marginBottom:8 }}>BDT, EMDR, Şema Terapi vb. sertifikalar (PDF, JPG, PNG — maks. 10 MB)</p>
                <input ref={idDocRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f && f.size <= 10*1024*1024) setIdDocFile(f); else if (f) alert("Dosya 10 MB'dan küçük olmalıdır."); }} />
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <button type="button" onClick={() => idDocRef.current?.click()} style={{ padding:"9px 16px", border:"1.5px solid #E8E4DC", backgroundColor:"#FFFCF6", color:"#252625", fontSize:12, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>Dosya Seç</button>
                  {idDocFile ? <span style={{ fontSize:12, color:"#325343", fontWeight:700 }}>✓ {idDocFile.name}</span> : <span style={{ fontSize:12, color:"#4A4D4A" }}>Dosya seçilmedi</span>}
                </div>
              </div>

              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button type="button" onClick={goBack} style={{ flex:"0 0 auto", padding:"11px 16px", backgroundColor:"#FFFCF6", color:"#252625", border:"1.5px solid #252625", fontSize:13, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>← Geri</button>
                <button type="button" onClick={goNext} style={{ flex:1, backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>Devam Et →</button>
              </div>
            </motion.div>
          )}

          {/* ── Adım 4: Hesap & Banka ── */}
          {step === 4 && (
            <motion.div key="s4" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: prefersReduced ? 0.01 : 0.18 }}>
              <Field label="Şifre" required error={errors.password?.message}>
                <div style={{ position:"relative" }}>
                  <input type={showPass ? "text" : "password"} autoComplete="new-password" {...register("password")} style={{ ...inp(!!errors.password), paddingRight:36 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4A4D4A", fontSize:14, cursor:"pointer" }}>{showPass ? "🙈" : "👁"}</button>
                </div>
                <p style={{ fontSize:10, color:"#4A4D4A", marginTop:3 }}>En az 8 karakter, 1 büyük harf, 1 rakam</p>
              </Field>
              <Field label="Şifre Tekrar" required error={errors.confirm_password?.message}>
                <div style={{ position:"relative" }}>
                  <input type={showConf ? "text" : "password"} autoComplete="new-password" {...register("confirm_password")} style={{ ...inp(!!errors.confirm_password), paddingRight:36 }} />
                  <button type="button" onClick={() => setShowConf(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4A4D4A", fontSize:14, cursor:"pointer" }}>{showConf ? "🙈" : "👁"}</button>
                </div>
              </Field>

              <div style={{ height:1, backgroundColor:"#E8E4DC", margin:"16px 0" }} />
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", color:"#4A4D4A", marginBottom:12 }}>Ödeme Bilgileri</p>

              <Field label="IBAN" required error={errors.bank_iban?.message} hint="TR ile başlar, 26 karakter (TR + 24 rakam)"><input type="text" placeholder="TR00 0000 0000 0000 0000 0000 00" {...register("bank_iban")} style={inp(!!errors.bank_iban)} onChange={e => { const v = e.target.value.replace(/\s/g,"").toUpperCase(); setValue("bank_iban",v); }} /></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Banka" required error={errors.bank_name?.message}>
                  <select {...register("bank_name")} style={sel(!!errors.bank_name)}>
                    <option value="">Seçiniz</option>
                    {BANKALAR.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Hesap Sahibi Adı" required error={errors.bank_account_name?.message}><input type="text" placeholder="Ad Soyad" {...register("bank_account_name")} style={inp(!!errors.bank_account_name)} /></Field>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                  <input type="checkbox" {...register("kvkk")} style={{ width:16, height:16, flexShrink:0, marginTop:1, accentColor:"#325343" }} />
                  <span style={{ fontSize:12, color:"#252625", lineHeight:1.6 }}>
                    <Link href="/kvkk" target="_blank" style={{ color:"#252625", textDecoration:"underline" }}>KVKK Aydınlatma Metnini</Link> ve <Link href="/danisan-sozlesmesi" target="_blank" style={{ color:"#252625", textDecoration:"underline" }}>Danışman Sözleşmesini</Link> okudum, kabul ediyorum.<span style={{ color:"#4A4D4A" }}> *</span>
                  </span>
                </label>
                {errors.kvkk && <p role="alert" style={{ fontSize:11, color:"oklch(0.577 0.245 27.325)", marginTop:6 }}>⚠ {errors.kvkk.message}</p>}
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button type="button" onClick={goBack} style={{ flex:"0 0 auto", padding:"11px 16px", backgroundColor:"#FFFCF6", color:"#252625", border:"1.5px solid #252625", fontSize:13, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>← Geri</button>
                <button type="submit" disabled={isSubmitting} style={{ flex:1, backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? "Başvuru gönderiliyor..." : "Başvuruyu Gönder"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

// ─── Şirket Formu (2 Adım) ────────────────────────────────────
const SIRKET_STEPS = ["Şirket & Yetkili Bilgileri","Paket & Hesap"];

function SirketKayit() {
  const prefersReduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [dir, setDir]   = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverErr, setServerErr] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, trigger, formState:{ errors, isSubmitting } } = useForm<SirketForm, any, SirketForm>({ resolver: zodResolver(sirketSchema) as Resolver<SirketForm> });

  const SIRKET_STEP_FIELDS: Record<number, (keyof SirketForm)[]> = {
    1: ["company_name","tax_id","tax_office","company_type","sector","city","contact_name","contact_title","email","phone"],
    2: ["license_count","default_monthly_budget","password","confirm_password","kvkk"],
  };

  const SLIDE = { enter: (d: number) => ({ opacity:0, x: d > 0 ? 24 : -24 }), center:{ opacity:1, x:0 }, exit: (d: number) => ({ opacity:0, x: d > 0 ? -24 : 24 }) };

  const goNext = async () => { const ok = await trigger(SIRKET_STEP_FIELDS[step] as Array<keyof SirketForm>); if (!ok) return; setDir(1); setStep(s => s + 1); };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  const onSubmit = async (data: SirketForm) => {
    setServerErr("");
    try {
      const res = await fetch("/api/auth/register/kurumsal",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ company_name:data.company_name, contact_name:data.contact_name, email:data.email, phone:data.phone, password:data.password, license_count:data.license_count, default_monthly_budget:data.default_monthly_budget, kvkk:data.kvkk }) });
      const json = (await res.json()) as { error?:string };
      if (!res.ok) { setServerErr(json.error ?? "Kayıt sırasında bir hata oluştu."); return; }
      setSubmitted(true);
    } catch { setServerErr("Bağlantı hatası. Lütfen tekrar deneyin."); }
  };

  if (submitted) return (
    <div style={{ padding:"40px 36px", textAlign:"center" }}>
      <div style={{ fontSize:36, marginBottom:16 }}>🏢</div>
      <p style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Başvurunuz Alındı</p>
      <p style={{ fontSize:13, color:"#4A4D4A", lineHeight:1.7 }}>
        Kurumsal hesabınız 24 saat içinde aktive edilecektir. Onay e-postası gönderildi.
      </p>
    </div>
  );

  return (
    <div style={{ padding:"24px 36px 32px" }}>
      <StepBar current={step} total={2} labels={SIRKET_STEPS} />
      <ServerErr msg={serverErr} />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AnimatePresence mode="wait" custom={dir}>
          {step === 1 && (
            <motion.div key="ss1" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: prefersReduced ? 0.01 : 0.18 }}>
              <Field label="Şirket Adı" required error={errors.company_name?.message}><input type="text" autoComplete="organization" placeholder="Acme Teknoloji A.Ş." {...register("company_name")} style={inp(!!errors.company_name)} /></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Vergi Kimlik No" required error={errors.tax_id?.message} hint="10 haneli"><input type="text" placeholder="1234567890" maxLength={10} {...register("tax_id")} style={inp(!!errors.tax_id)} /></Field>
                <Field label="Vergi Dairesi" required error={errors.tax_office?.message}><input type="text" placeholder="Beşiktaş VD" {...register("tax_office")} style={inp(!!errors.tax_office)} /></Field>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Şirket Türü" required error={errors.company_type?.message}>
                  <select {...register("company_type")} style={sel(!!errors.company_type)}>
                    <option value="">Seçiniz</option>
                    {SIRKET_TURLERI.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Sektör" required error={errors.sector?.message}>
                  <select {...register("sector")} style={sel(!!errors.sector)}>
                    <option value="">Seçiniz</option>
                    {SEKTORLER.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="İl" required error={errors.city?.message}><input type="text" placeholder="İstanbul" {...register("city")} style={inp(!!errors.city)} /></Field>
              <div style={{ height:1, backgroundColor:"#E8E4DC", margin:"16px 0" }} />
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:0.8, textTransform:"uppercase", color:"#4A4D4A", marginBottom:12 }}>Yetkili Bilgileri</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Ad Soyad" required error={errors.contact_name?.message}><input type="text" autoComplete="name" placeholder="İK Müdürü" {...register("contact_name")} style={inp(!!errors.contact_name)} /></Field>
                <Field label="Unvan" required error={errors.contact_title?.message}><input type="text" placeholder="İK Müdürü, CEO..." {...register("contact_title")} style={inp(!!errors.contact_title)} /></Field>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Kurumsal E-posta" required error={errors.email?.message}><input type="email" autoComplete="email" placeholder="yetkili@sirket.com" {...register("email")} style={inp(!!errors.email)} /></Field>
                <Field label="Telefon" required error={errors.phone?.message}><input type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" {...register("phone")} style={inp(!!errors.phone)} /></Field>
              </div>
              <button type="button" onClick={goNext} style={{ width:"100%", backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor:"pointer", marginTop:4 }}>Devam Et →</button>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="ss2" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit" transition={{ duration: prefersReduced ? 0.01 : 0.18 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Çalışan Lisansı" required error={errors.license_count?.message} hint="Platforma erişecek çalışan sayısı"><input type="number" min={1} max={10000} placeholder="50" {...register("license_count")} style={inp(!!errors.license_count)} /></Field>
                <Field label="Aylık Bütçe / Kişi (TL)" required error={errors.default_monthly_budget?.message} hint="0 = sınırsız"><input type="number" min={0} placeholder="0" {...register("default_monthly_budget")} style={inp(!!errors.default_monthly_budget)} /></Field>
              </div>
              <div style={{ backgroundColor:"#F5F7F5", border:"1px solid #E8E4DC", padding:"8px 12px", fontSize:11, color:"#4A4D4A", lineHeight:1.6, marginBottom:14 }}>
                Aylık bütçe her çalışan için ayrı ayarlanabilir. 0 girerseniz sınırsız seans alabilir.
              </div>
              <Field label="Şifre" required error={errors.password?.message}>
                <div style={{ position:"relative" }}>
                  <input type={showPass ? "text" : "password"} autoComplete="new-password" {...register("password")} style={{ ...inp(!!errors.password), paddingRight:36 }} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4A4D4A", fontSize:14, cursor:"pointer" }}>{showPass ? "🙈" : "👁"}</button>
                </div>
              </Field>
              <Field label="Şifre Tekrar" required error={errors.confirm_password?.message}>
                <div style={{ position:"relative" }}>
                  <input type={showConf ? "text" : "password"} autoComplete="new-password" {...register("confirm_password")} style={{ ...inp(!!errors.confirm_password), paddingRight:36 }} />
                  <button type="button" onClick={() => setShowConf(v => !v)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4A4D4A", fontSize:14, cursor:"pointer" }}>{showConf ? "🙈" : "👁"}</button>
                </div>
              </Field>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                  <input type="checkbox" {...register("kvkk")} style={{ width:16, height:16, flexShrink:0, marginTop:1, accentColor:"#325343" }} />
                  <span style={{ fontSize:12, color:"#252625", lineHeight:1.6 }}>
                    <Link href="/kvkk" target="_blank" style={{ color:"#252625", textDecoration:"underline" }}>KVKK Aydınlatma Metnini</Link> ve <Link href="/kurumsal-sozlesme" target="_blank" style={{ color:"#252625", textDecoration:"underline" }}>Kurumsal Sözleşmeyi</Link> okudum, şirketim adına kabul ediyorum.<span style={{ color:"#4A4D4A" }}> *</span>
                  </span>
                </label>
                {errors.kvkk && <p role="alert" style={{ fontSize:11, color:"oklch(0.577 0.245 27.325)", marginTop:6 }}>⚠ {errors.kvkk.message}</p>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button type="button" onClick={goBack} style={{ flex:"0 0 auto", padding:"11px 16px", backgroundColor:"#FFFCF6", color:"#252625", border:"1.5px solid #252625", fontSize:13, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>← Geri</button>
                <button type="submit" disabled={isSubmitting} style={{ flex:1, backgroundColor:"#325343", color:"#FFFFFF", border:"none", padding:11, fontSize:14, fontWeight:700, fontFamily:"inherit", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? "Başvuru gönderiliyor..." : "Başvuruyu Gönder"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────────────
const ROL_ETIKETLERI: Record<Role, string> = { musteri:"Bireysel", danisan:"Danışman", sirket:"Şirket" };
const ROL_ACIKLAMALARI: Record<Role, string> = { musteri:"Terapi almak için", danisan:"Platform üzerinden danışmanlık ver", sirket:"Çalışanlarına terapi imkânı sun" };

function KayitIci() {
  const prefersReduced = useReducedMotion();
  const searchParams   = useSearchParams();
  const rawRol = searchParams.get("rol") as Role | null;
  const [activeRol, setActiveRol] = useState<Role>(
    rawRol && ["musteri","danisan","sirket"].includes(rawRol) ? rawRol : "musteri"
  );

  return (
    <div style={{ minHeight:"100dvh", backgroundColor:"#325343", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", padding:"48px 16px 80px" }}>
      <Link href="/" style={{ fontSize:16, fontWeight:700, color:"#A6DE9B", textDecoration:"none", marginBottom:24, letterSpacing:"-0.3px" }}>
        MindBridger
      </Link>

      <motion.div
        initial={prefersReduced ? { opacity:0 } : { opacity:0, y:16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.2, ease:"easeOut" }}
        style={{ backgroundColor:"#FFFCF6", borderRadius:16, overflow:"hidden", maxWidth:600, width:"100%" }}
      >
        {/* ── Rol Seçici (Üst) ── */}
        <div style={{ backgroundColor:"#325343", padding:"20px 24px 0" }}>
          <p style={{ fontSize:11, color:"rgba(245,247,245,0.5)", marginBottom:12, textAlign:"center" }}>Hesap türünüzü seçin</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
            {(["musteri","danisan","sirket"] as Role[]).map(rol => {
              const active = activeRol === rol;
              return (
                <button key={rol} type="button" onClick={() => setActiveRol(rol)}
                  style={{ padding:"10px 8px", backgroundColor: active ? "#FFFCF6" : "transparent", color: active ? "#252625" : "rgba(245,247,245,0.6)", border:"none", borderRadius: active ? "10px 10px 0 0" : "0", cursor:"pointer", transition:"all 0.15s", fontFamily:"inherit" }}>
                  <span style={{ display:"block", fontSize:13, fontWeight: active ? 700 : 400 }}>{ROL_ETIKETLERI[rol]}</span>
                  <span style={{ display:"block", fontSize:10, color: active ? "#4A4D4A" : "rgba(245,247,245,0.4)", marginTop:2 }}>{ROL_ACIKLAMALARI[rol]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form İçeriği ── */}
        <AnimatePresence mode="wait">
          {activeRol === "musteri" && (
            <motion.div key="musteri"
              initial={prefersReduced ? { opacity:0 } : { opacity:0, y:6 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}>
              <MusteriKayit />
            </motion.div>
          )}
          {activeRol === "danisan" && (
            <motion.div key="danisan"
              initial={prefersReduced ? { opacity:0 } : { opacity:0, y:6 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}>
              <DanisanKayit />
            </motion.div>
          )}
          {activeRol === "sirket" && (
            <motion.div key="sirket"
              initial={prefersReduced ? { opacity:0 } : { opacity:0, y:6 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              transition={{ duration: prefersReduced ? 0.01 : 0.15 }}>
              <SirketKayit />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense>
      <KayitIci />
    </Suspense>
  );
}
