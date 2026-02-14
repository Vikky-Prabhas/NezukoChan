import { NavLink, Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { useState, type FormEvent } from "react";

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/catalog", label: "Catalog" },
  { path: "/news", label: "News" },
  { path: "/collections", label: "Collections" },
];

interface Props {
  transparent?: boolean;
}

export default function NavbarDesktop({ transparent }: Props) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
      transparent
        ? "bg-gradient-to-b from-black/90 via-black/50 to-transparent pt-4 pb-14"
        : "bg-black/95 backdrop-blur-2xl border-b border-white/5 py-4",
    )}>
      <div className="flex items-center justify-between px-8 md:px-12 max-w-[1920px] mx-auto">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link to="/" className="group flex items-center">
            <span className="text-xl font-serif font-black tracking-tight text-white group-hover:text-white/80 transition-colors">
              NezukoChan
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === "/"}
                className={({ isActive }) => cn(
                  "text-[13px] font-medium transition-all duration-300 relative",
                  isActive ? "text-white" : "text-white/50 hover:text-white",
                )}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && <span className="absolute -bottom-1 left-0 right-0 h-px bg-white/60 transition-all duration-300" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Search + Auth */}
        <div className="flex items-center gap-5">
          <form onSubmit={handleSearch} className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 w-56 focus-within:w-72 focus-within:bg-white/[0.08] focus-within:border-white/20 transition-all duration-500 group">
            <Search className="w-3.5 h-3.5 text-white/30 group-focus-within:text-white/60 transition-colors shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm ml-2.5 text-white placeholder:text-white/25 w-full font-medium"
            />
          </form>

          <div className="h-5 w-px bg-white/10 hidden lg:block" />

          <Link to="/profile" className="text-[13px] font-bold text-white/60 hover:text-white transition-colors">
            My Library
          </Link>

          <Link
            to="/profile"
            className="w-8 h-8 rounded-full bg-white/10 border border-white/10 hover:border-white/30 transition-all overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-[10px] font-bold text-white/60 uppercase">
              NC
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
