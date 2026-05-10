export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-transparent m-0 p-0 w-full h-screen overflow-hidden">
      {children}
    </div>
  );
}
