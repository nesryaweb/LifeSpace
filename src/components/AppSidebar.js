"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  CalendarDays,
  FolderHeart,
  Wallet,
  Dumbbell,
  BookOpen,
  BookHeart,
  ChartNoAxesCombined,
  Settings,
  SquareCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  Droplet,
  X,
} from "lucide-react";

const navigation = [
  { name: "My Home", href: "/", icon: Home },
  { name: "My Vision", href: "/vision", icon: Compass },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
  { name: "Projects", href: "/projects", icon: FolderHeart },
  { name: "Tasks", href: "/tasks", icon: SquareCheck },
  { name: "Goals", href: "/goals", icon: Compass },
  { name: "Finance", href: "/finance", icon: Wallet },
  { name: "flo", href: "/flo", icon: Droplet },
  { name: "Learning", href: "/learning", icon: BookOpen },
  { name: "Journal", href: "/journal", icon: BookHeart },
  { name: "Analytics", href: "/analytics", icon: ChartNoAxesCombined },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lifespace-sidebar-collapsed");

    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lifespace-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  function isActive(href) {
    if (href === "/") return pathname === "/";

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-[#eee8ed] bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-[#735F92] hover:bg-[#F8F4F9]"
        >
          <Menu size={22} />
        </button>

        <h1 className="scrapbook-title text-2xl font-bold text-[#65547D]">
          LifeSpace<span className="text-[#E9A8B9]">.</span>
        </h1>

        <div className="w-9" />
      </div>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-[#eee8ed] bg-white
          transition-all duration-300 ease-in-out
          lg:sticky lg:z-20 lg:translate-x-0
          ${collapsed ? "lg:w-[82px]" : "lg:w-[255px]"}
          w-[270px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* BRAND + COLLAPSE BUTTON */}
        <div className="flex h-[90px] shrink-0 items-center justify-between px-5">
          <div className={collapsed ? "lg:hidden" : ""}>
            <h1 className="scrapbook-title text-3xl font-bold text-[#65547D]">
              LifeSpace<span className="text-[#E9A8B9]">.</span>
            </h1>

            <p className="mt-1 text-[10px] uppercase tracking-[3px] text-gray-400">
              My little world
            </p>
          </div>

          {collapsed && (
            <span className="hidden scrapbook-title text-2xl font-bold text-[#65547D] lg:block">
              L<span className="text-[#E9A8B9]">.</span>
            </span>
          )}

          {/* DESKTOP COLLAPSE BUTTON */}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#eee8ed] text-[#927BA9] transition hover:bg-[#F8F4F9]"
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>

          {/* MOBILE CLOSE BUTTON */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-gray-500 hover:bg-[#FAF7FA] lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* SECTION LABEL */}
        <div className={`mb-3 px-6 ${collapsed ? "lg:hidden" : ""}`}>
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-gray-400">
            Your journal
          </p>
        </div>

        {/* NAVIGATION */}
        <nav className="sidebar-scrollbar flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3
                  text-sm transition-all
                  ${collapsed ? "lg:justify-center lg:px-2" : ""}
                  ${
                    selected
                      ? "bg-[#EDE6F6] font-bold text-[#735F92]"
                      : "text-gray-500 hover:bg-[#FAF7FA]"
                  }
                `}
              >
                <Icon size={19} className="shrink-0" />

                <span className={collapsed ? "lg:hidden" : ""}>
                  {item.name}
                </span>

                {selected && !collapsed && (
                  <span className="ml-auto text-[#AA92C9]">✿</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* REMINDER */}
        <div className={`px-4 pb-4 ${collapsed ? "lg:hidden" : ""}`}>
          <div className="relative overflow-hidden rounded-2xl bg-[#F9EDF0] p-4">
            <span className="text-2xl">🌸</span>

            <p className="mt-2 text-sm font-semibold text-[#755D6A]">
              A gentle reminder
            </p>

            <p className="mt-1 text-xs leading-relaxed text-[#987E8A]">
              You don't have to do everything today. Just keep going.
            </p>

            <div className="absolute -bottom-3 -right-2 text-5xl opacity-20">
              ✿
            </div>
          </div>
        </div>

        {/* SETTINGS */}
        <div className="border-t border-[#F1EAEF] p-3">
          <button
            type="button"
            title={collapsed ? "Settings" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-500 transition hover:bg-[#FAF7FA] ${
              collapsed ? "lg:justify-center lg:px-2" : ""
            }`}
          >
            <Settings size={19} className="shrink-0" />

            <span className={collapsed ? "lg:hidden" : ""}>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
