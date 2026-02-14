import { Outlet, useLocation } from "react-router-dom";
import { useResponsive } from "../../hooks/useResponsive";
import NavbarDesktop from "./Navbar.desktop";
import NavbarMobile from "./Navbar.mobile";
import Footer from "./Footer";

export default function Layout() {
    const location = useLocation();
    const { isMobile } = useResponsive();
    const isHome = location.pathname === "/";
    const isWatch = location.pathname.startsWith("/watch/");

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col">
            {/* Navbar */}
            {!isWatch && (
                isMobile ? <NavbarMobile /> : <NavbarDesktop transparent={isHome} />
            )}

            {/* Main Content */}
            <main className={isMobile ? "flex-1 pb-20" : "flex-1"}>
                <Outlet />
            </main>

            {/* Footer */}
            {!isWatch && !isMobile && <Footer />}
        </div>
    );
}
