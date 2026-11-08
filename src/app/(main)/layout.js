
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import PageLoader from "@/components/PageLoader";

export default function MainLayoutClient({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  function handleNavigation(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest("a[href]");

    if (
      !link ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    const destination = new URL(link.href, window.location.href);

    if (
      destination.origin === window.location.origin &&
      destination.pathname !== pathname
    ) {
      setLoading(true);
    }
  }

  return (
    <div
      className="min-h-screen w-full bg-[#FAF7F5]"
      onClickCapture={handleNavigation}
    >
      <AppSidebar />

      {/* Main content area */}
      <main className="min-h-screen w-full min-w-0 px-4 py-6 text-[#51434A] sm:px-7 lg:px-10 lg:py-9"
        style={{
          backgroundImage:
            "radial-gradient(circle, #eedabfde 1px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      >
        <div className="mx-auto w-full max-w-[1400px]">
          {children}
        </div>
      </main>

      <PageLoader loading={loading} />
    </div>
  );
}
