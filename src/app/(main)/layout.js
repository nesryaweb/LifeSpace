
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import PageLoader from "@/components/PageLoader";

export default function MainLayoutClient({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Hide the loader when the destination page has changed.
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Detect internal navigation immediately when a link is clicked.
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

    if (!link || link.target === "_blank" || link.hasAttribute("download")) {
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
      className="flex min-h-screen bg-[#FAF7F5]"
      onClickCapture={handleNavigation}
    >
      <AppSidebar />

      <main
        className="min-w-0 flex-1 pt-16 lg:pt-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #eedabfde 1px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      >
        {children}
      </main>

      <PageLoader loading={loading} />
    </div>
  );
}
