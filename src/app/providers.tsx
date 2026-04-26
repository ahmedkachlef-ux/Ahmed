"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type Lang = "en" | "fr" | "ar";

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
};

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    home: "Home", catalogue: "Catalogue", calendar: "Calendar", login: "Sign in", register: "Register",
    dashboard: "Dashboard", admin: "Admin", super_admin: "Super Admin", logout: "Sign out",
    hero_title: "Premium training that turns ambition into mastery.",
    hero_sub: "Hands-on programs in IT, Cloud, Cybersecurity, Project Management, Data, AI and Business productivity — designed for professionals who lead.",
    cta_browse: "Browse trainings", cta_join: "Join ADVANCIA",
    featured: "Featured trainings", categories: "Explore by category",
    upcoming: "Upcoming sessions", testimonials: "Loved by learners and teams",
    play: "Take a 10-second break — play Avatar Pop", search: "Search trainings…",
  },
  fr: {
    home: "Accueil", catalogue: "Catalogue", calendar: "Calendrier", login: "Connexion", register: "S'inscrire",
    dashboard: "Espace", admin: "Admin", super_admin: "Super Admin", logout: "Déconnexion",
    hero_title: "Des formations premium qui transforment l'ambition en maîtrise.",
    hero_sub: "Programmes pratiques en IT, Cloud, Cybersécurité, Gestion de projet, Data, IA et Productivité — pour les professionnels qui mènent.",
    cta_browse: "Parcourir les formations", cta_join: "Rejoindre ADVANCIA",
    featured: "Formations à la une", categories: "Explorer par catégorie",
    upcoming: "Sessions à venir", testimonials: "Plébiscité par apprenants et équipes",
    play: "Pause de 10 secondes — jouez à Avatar Pop", search: "Rechercher des formations…",
  },
  ar: {
    home: "الرئيسية", catalogue: "الدورات", calendar: "التقويم", login: "تسجيل الدخول", register: "إنشاء حساب",
    dashboard: "لوحتي", admin: "المشرف", super_admin: "المشرف العام", logout: "خروج",
    hero_title: "تدريب متميّز يحوّل الطموح إلى إتقان.",
    hero_sub: "برامج عملية في تقنية المعلومات، السحابة، الأمن السيبراني، إدارة المشاريع، البيانات والذكاء الاصطناعي.",
    cta_browse: "تصفّح الدورات", cta_join: "انضم إلى ADVANCIA",
    featured: "الدورات المميّزة", categories: "استكشف حسب الفئة",
    upcoming: "الجلسات القادمة", testimonials: "موثوق من المتعلّمين والفرق",
    play: "استراحة قصيرة — العب Avatar Pop", search: "ابحث عن دورات…",
  }
};

const C = createContext<Ctx | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as Theme) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const l = (localStorage.getItem("lang") as Lang) || "en";
    setTheme(t); setLang(l);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  const value = useMemo<Ctx>(() => ({
    theme, setTheme, lang, setLang,
    t: (k) => I18N[lang][k] ?? I18N.en[k] ?? k
  }), [theme, lang]);

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp() {
  const v = useContext(C);
  if (!v) throw new Error("Providers missing");
  return v;
}
