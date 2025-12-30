import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
    title?: string;
    subtitle?: string;
    showAdminLogout?: boolean;
    onLogout?: () => void;
}

export function Header({
    title = "Indian Volleyball League",
    subtitle = "Volleyball Management System",
    showAdminLogout = false,
    onLogout
}: HeaderProps) {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isAdminPage = location.pathname.startsWith('/admin');
    const navigate = useNavigate();

    // Navigation items for regular users
    const navItems = [
        // { path: "/", label: "Home" },
        // { path: "/fixtures", label: "Fixtures" },
        // { path: "/rankings", label: "Rankings" },
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

    return (
        <>
            <header className="bg-white shadow-card border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo and Title */}
                        <div className="flex items-center space-x-3 flex-shrink-0 hover:cursor-pointer" onClick={() => navigate("/")}>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                <span className="text-lg sm:text-xl text-white font-bold">🏐</span>
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                                    {title}
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                    {subtitle}
                                </p>
                            </div>
                        </div>

                        {/* Navigation and Actions */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {/* Regular Navigation (hidden on admin pages) */}
                            {!isAdminPage && (
                                <nav className="hidden md:flex items-center gap-4 lg:gap-6">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${location.pathname === item.path
                                                ? "text-primary"
                                                : "text-muted-foreground"
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
                                    variant="outline"
                                    onClick={onLogout}
                                    className="flex items-center gap-1 sm:gap-2"
                                    size="sm"
                                >
                                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden xs:inline">Logout</span>
                                </Button>
                            )}

                            {/* Mobile Menu Button */}
                            {!isAdminPage && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleMobileMenu}
                                    className="md:hidden p-2"
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
                    </div>

                    {/* Bottom Mobile Navigation - Always visible on small screens */}
                    {!isAdminPage && (
                        <div className="hidden pb-3 border-t pt-3">
                            <nav className="flex items-center justify-between overflow-x-auto scrollbar-hide -mx-2 px-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`text-xs font-medium transition-colors px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${location.pathname === item.path
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-primary"
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
                <div className="fixed inset-0 bg-background z-50 md:hidden">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                                    <span className="text-xl text-white font-bold">🏐</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-foreground">
                                        {title}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {subtitle}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeMobileMenu}
                                className="p-2"
                            >
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 p-6">
                            <div className="space-y-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={closeMobileMenu}
                                        className={`block text-lg font-medium transition-colors p-3 rounded-lg ${location.pathname === item.path
                                            ? "text-primary bg-primary/10"
                                            : "text-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {/* Admin Logout in Mobile Menu */}
                        {showAdminLogout && onLogout && (
                            <div className="p-6 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        onLogout();
                                        closeMobileMenu();
                                    }}
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}