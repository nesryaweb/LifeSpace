
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  CalendarDays,
  FolderHeart,
  SquareCheck,
  Wallet,
  Droplet,
  BookOpen,
  BookHeart,
  ChartNoAxesCombined,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import BrandIcon from "@/components/BrandIcon";

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

  const navRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);

  const [scrollbar, setScrollbar] = useState({
    height: 40,
    top: 0,
    visible: false,
  });

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Calculate the custom scrollbar size and position.
  const updateScrollbar = useCallback(() => {
    const nav = navRef.current;
    const track = trackRef.current;

    if (!nav || !track) return;

    const trackHeight = track.clientHeight;
    const clientHeight = nav.clientHeight;
    const scrollHeight = nav.scrollHeight;

    if (
      !trackHeight ||
      !clientHeight ||
      scrollHeight <= clientHeight
    ) {
      setScrollbar((previous) => ({
        ...previous,
        visible: false,
        top: 0,
      }));
      return;
    }

    const thumbHeight = Math.min(
      trackHeight,
      Math.max(36, (clientHeight / scrollHeight) * trackHeight)
    );

    const maxThumbTop = trackHeight - thumbHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    const thumbTop =
      (nav.scrollTop / maxScrollTop) * maxThumbTop;

    setScrollbar({
      height: thumbHeight,
      top: thumbTop,
      visible: true,
    });
  }, []);

  // Keep the custom scrollbar updated when scrolling or resizing.
  useEffect(() => {
    const nav = navRef.current;

    if (!nav) return;

    updateScrollbar();

    nav.addEventListener("scroll", updateScrollbar);
    window.addEventListener("resize", updateScrollbar);

    const observer = new ResizeObserver(updateScrollbar);
    observer.observe(nav);

    if (nav.firstElementChild) {
      observer.observe(nav.firstElementChild);
    }

    return () => {
      nav.removeEventListener("scroll", updateScrollbar);
      window.removeEventListener("resize", updateScrollbar);
      observer.disconnect();
    };
  }, [updateScrollbar, collapsed, mobileOpen]);

  // Click on the scrollbar track to jump to that position.
  const handleTrackClick = (event) => {
    if (event.target !== event.currentTarget) return;

    const nav = navRef.current;
    const track = trackRef.current;

    if (!nav || !track) return;

    const rect = track.getBoundingClientRect();
    const clickPosition = event.clientY - rect.top;
    const ratio = clickPosition / track.clientHeight;

    nav.scrollTop =
      ratio * (nav.scrollHeight - nav.clientHeight);
  };

  // Drag the rounded scrollbar thumb.
  const handleThumbPointerDown = (event) => {
    event.preventDefault();

    dragRef.current = {
      startY: event.clientY,
      startTop: scrollbar.top,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleThumbPointerMove = (event) => {
    if (!dragRef.current) return;

    const nav = navRef.current;
    const track = trackRef.current;

    if (!nav || !track) return;

    const trackHeight = track.clientHeight;
    const maxThumbTop = trackHeight - scrollbar.height;
    const maxScrollTop = nav.scrollHeight - nav.clientHeight;

    if (maxThumbTop <= 0 || maxScrollTop <= 0) return;

    const delta = event.clientY - dragRef.current.startY;

    const nextThumbTop = Math.max(
      0,
      Math.min(maxThumbTop, dragRef.current.startTop + delta)
    );

    nav.scrollTop =
      (nextThumbTop / maxThumbTop) * maxScrollTop;
  };

  const handleThumbPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <>
      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#EDE5F5] bg-[#FFFCFE] px-4 shadow-sm lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <BrandIcon size={36} />
          <span className="text-xl font-bold tracking-tight text-[#795D8F]">
            LifeSpace
          </span>
        </Link>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl p-2 text-[#9479B5] transition hover:bg-[#EDE5F8] hover:text-[#795D8F]"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#795D8F]/20 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-[#EDE5F5] bg-[#FFFCFE]
          shadow-[3px_0_20px_rgba(145,115,175,0.07)]
          transition-all duration-300
          ${collapsed ? "w-[88px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Brand header */}
        <div
          className={`flex h-[88px] shrink-0 items-center border-b border-[#F1EBF7] ${
            collapsed ? "justify-center px-3" : "justify-between px-5"
          }`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-[#8063A3] transition-all duration-200 hover:bg-[#C9C8F0] hover:text-[#674F82]"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <span className="transition duration-200 group-hover:scale-75 group-hover:opacity-0">
                <BrandIcon size={34} />
              </span>

              <span className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 transition duration-200 group-hover:opacity-100">
                <ChevronRight size={21} strokeWidth={2.3} />
              </span>
            </button>
          ) : (
            <>
              <Link
                href="/"
                className="flex min-w-0 items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                <BrandIcon size={42} />

                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none tracking-tight text-[#795D8F]">
                    LifeSpace
                  </p>
                  <p className="mt-1 text-[9px] font-semibold tracking-[2.5px] text-[#A18BBE]">
                    YOUR LITTLE WORLD
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setCollapsed(true)}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C9C8F0] bg-transparent text-[#8063A3] transition-all duration-200 hover:border-[#B9B7E8] hover:bg-[#C9C8F0] hover:text-[#674F82] lg:flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={19} strokeWidth={2.3} />
              </button>
            </>
          )}
        </div>

        {/* Navigation and custom scrollbar */}
        <div className="relative flex-1 min-h-0 px-3 py-5">
          <nav
            ref={navRef}
            className="sidebar-scrollbar h-full space-y-1 overflow-y-auto pr-3"
          >
            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-[#A995C2]">
                Your Space
              </p>
            )}

            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={`
                    group flex items-center gap-3 rounded-xl
                    px-3 py-3 transition-all duration-200
                    ${
                      active
                        ? "bg-[#DDD0F2] font-semibold text-[#674F82] shadow-[0_2px_8px_rgba(160,135,195,0.10)]"
                        : "text-[#927CA8] hover:bg-[#E5D5F5] hover:text-[#674F82]"
                    }
                    ${collapsed ? "justify-center px-0" : ""}
                  `}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.3 : 1.9}
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-[#8063A3]"
                        : "text-[#B09ACB] group-hover:text-[#8063A3]"
                    }`}
                  />

                  {!collapsed && (
                    <span className="truncate text-[13px]">
                      {item.name}
                    </span>
                  )}

                  {!collapsed && active && (
                    <Sparkles
                      size={13}
                      className="ml-auto shrink-0 text-[#987DB8]"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Custom rounded scrollbar */}
          <div
            ref={trackRef}
            onPointerDown={handleTrackClick}
            className={`absolute bottom-5 right-1 top-5 w-[7px] rounded-full transition-colors duration-200 hover:bg-[#F3EDFA] ${
              scrollbar.visible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
              className="absolute left-0 right-0 cursor-grab rounded-full bg-[#C9C8F0] transition-colors hover:bg-[#A99BDC] active:cursor-grabbing"
              style={{
                height: `${scrollbar.height}px`,
                transform: `translateY(${scrollbar.top}px)`,
                touchAction: "none",
              }}
            />
          </div>
        </div>

        {/* Bottom reminder */}
        <div className="shrink-0 px-3 pb-3">
          {!collapsed && (
            <div className="mb-4 rounded-2xl border border-[#E9E1F5] bg-[#F3EDFA] p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DDD0F2] text-[#8063A3]">
                  <Sparkles size={15} />
                </span>
                <p className="text-xs font-semibold text-[#674F82]">
                  A gentle reminder
                </p>
              </div>

              <p className="text-[11px] leading-relaxed text-[#8C79A3]">
                Little steps every day create a life you love.
              </p>
            </div>
          )}

          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Settings" : undefined}
            className={`
              flex items-center gap-3 rounded-xl px-3 py-3
              text-[#927CA8] transition hover:bg-[#E5D5F5] hover:text-[#674F82]
              ${collapsed ? "justify-center px-0" : ""}
            `}
          >
            <Settings size={19} className="shrink-0 text-[#B09ACB]" />
            {!collapsed && <span className="text-[13px]">Settings</span>}
          </Link>
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-[#F1EBF7] px-5 py-3">
            <p className="text-center text-[10px] text-[#A995C2]">
              Made with love, for your life ♡
            </p>
          </div>
        )}
      </aside>

      {/* Hide the browser's native scrollbar in all browsers */}
      <style jsx global>{`
        .sidebar-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .sidebar-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </>
  );
}
