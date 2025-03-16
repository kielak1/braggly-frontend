export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Panel boczny */}
      <aside className="w-64 bg-gray-800 text-white p-4">Panel Admina</aside>
      
      {/* Główna część */}
      <div className="flex-1 flex flex-col">
        {/* <Navbar /> */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

