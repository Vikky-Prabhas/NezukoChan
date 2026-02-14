import { NavLink } from "react-router-dom";
import { Home, Search, BookMarked, User } from "lucide-react";
import { cn } from "../../lib/utils";

const TABS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/catalog", label: "Search", icon: Search },
  { path: "/collections", label: "Library", icon: BookMarked },
  { path: "/profile", label: "Profile", icon: User },
];

export default function NavbarMobile() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {TABS.map(tab => (
          <NavLink
            key={tab.label}
            to={tab.path}
            end={tab.path === "/"}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300",
              isActive ? "text-white" : "text-white/35",
            )}
          >
            {({ isActive }) => (
              <>
                <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
