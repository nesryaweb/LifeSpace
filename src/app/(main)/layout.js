import AppSidebar from "@/components/AppSidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#FAF7F5]">
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
    </div>
  );
}
