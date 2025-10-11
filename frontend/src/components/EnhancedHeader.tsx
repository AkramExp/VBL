import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, Volleyball } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
    title?: string;
    subtitle?: string;
    showAdminLogout?: boolean;
    onLogout?: () => void;
}

export function EnhancedHeader({
    title = "Indian Volleyball League",
    subtitle = "Professional Volleyball Management System",
    showAdminLogout = false,
    onLogout
}: HeaderProps) {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isAdminPage = location.pathname.startsWith('/admin');

    // Navigation items for regular users
    const navItems = [
        { path: "/", label: "Home" },
        { path: "/fixtures", label: "Fixtures" },
        { path: "/rankings", label: "Rankings" },
        { path: "/rosters", label: "Rosters" },
        { path: "/transactions", label: "Transactions" },
        { path: '/cooldowns', label: 'Cooldowns' }
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isActivePath = (path: string) => {
        if (path === "/") {
            return location.pathname === "/";
        }
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Top Banner Header */}
            <header className="relative bg-gradient-to-r from-primary via-blue-600 to-purple-600 text-white shadow-lg">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo and Title */}
                        <Link to="/" className="flex items-center space-x-3 flex-shrink-0 group">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-all duration-200">
                                <Volleyball className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                                    {title}
                                </h1>
                                <p className="text-sm text-white/80 truncate hidden sm:block">
                                    {subtitle}
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation and Actions */}
                        <div className="hidden md:flex items-center gap-6">
                            {/* Regular Navigation */}
                            {!isAdminPage && (
                                <nav className="flex items-center gap-6">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`text-sm font-medium transition-all duration-200 whitespace-nowrap px-3 py-2 rounded-lg ${isActivePath(item.path)
                                                ? "bg-white/20 text-white backdrop-blur-sm"
                                                : "text-white/80 hover:text-white hover:bg-white/10"
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </nav>
                            )}

                            {/* Admin Logout Button */}
                            {showAdminLogout && onLogout && (
                                <Button
                                    onClick={onLogout}
                                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm flex items-center gap-2"
                                    size="sm"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </Button>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        {!isAdminPage && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleMobileMenu}
                                className="md:hidden p-2 text-white hover:bg-white/20"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-5 w-5" />
                                ) : (
                                    <Menu className="h-5 w-5" />
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Bottom Navigation Bar for Mobile */}
                    {!isAdminPage && (
                        <div className="md:hidden pb-4 border-t border-white/20 pt-4">
                            <nav className="flex items-center justify-between overflow-x-auto scrollbar-hide -mx-2 px-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`text-xs font-medium transition-all duration-200 px-3 py-2 rounded-lg whitespace-nowrap flex-shrink-0 ${isActivePath(item.path)
                                            ? "bg-white/20 text-white"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Full-screen Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-gradient-to-br from-primary to-purple-600 text-white z-50 md:hidden">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Volleyball className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">
                                        {title}
                                    </h1>
                                    <p className="text-sm text-white/80">
                                        {subtitle}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeMobileMenu}
                                className="p-2 text-white hover:bg-white/20"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 p-6">
                            <div className="space-y-3">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`block text-lg font-medium transition-all duration-200 p-4 rounded-xl ${isActivePath(item.path)
                                            ? "bg-white/20 text-white backdrop-blur-sm"
                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {/* Admin Logout in Mobile Menu */}
                        {showAdminLogout && onLogout && (
                            <div className="p-6 border-t border-white/20">
                                <Button
                                    onClick={() => {
                                        onLogout();
                                        closeMobileMenu();
                                    }}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm flex items-center justify-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </Button>
                            </div>
                        )}

                        {/* Close Button at Bottom */}
                        <div className="p-6">
                            <Button
                                onClick={closeMobileMenu}
                                className="w-full bg-white text-primary hover:bg-white/90 font-semibold"
                            >
                                Close Menu
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}