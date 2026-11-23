import Feed from "@/components/Feed";
import { PlusSquare } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#101114]">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-10 bg-[#101114]/90 backdrop-blur-md border-b border-[#22242B] p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt=".ROOT" className="h-7 w-auto object-contain" />
        </Link>
        <Link href="/create">
          <PlusSquare className="h-6 w-6 text-[#F1F0EB] hover:text-[#E16B55] transition" />
        </Link>
      </header>

      <Feed />
    </div>
  );
}
