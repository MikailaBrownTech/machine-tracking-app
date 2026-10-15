import Link from "next/link";

export default function AssetsLayout({ children }: LayoutProps<"/assets">) {
  return (
    <>
      <nav className="flex items-center gap-4 border-b px-4 print:hidden">
        <Link href="/" className="flex h-12 items-center text-base">
          Home
        </Link>
        <Link
          href="/assets"
          className="flex h-12 items-center text-base font-medium"
        >
          Assets
        </Link>
      </nav>
      {children}
    </>
  );
}
