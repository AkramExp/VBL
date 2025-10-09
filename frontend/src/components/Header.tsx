import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
    const isAdminPage = location.pathname.startsWith('/admin');

    // Navigation items for regular users
    const navItems = [
        { path: "/", label: "Fixtures" },
        { path: "/rankings", label: "Rankings" },
        { path: "/rosters", label: "Rosters" },
        { path: "/transactions", label: "Transactions" },
        { path: '/cooldowns', label: 'Cooldowns' }
    ];

    // Navigation items for admin (shown in sidebar, not header)
    const adminNavItems = [
        { path: "/admin", label: "Admin Dashboard" }
    ];

    return (
        <header className="bg-white shadow-card border-b sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo and Title */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                            <span className="text-xl text-white font-bold">🏐</span>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                {title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Navigation and Actions */}
                    <div className="flex items-center gap-4">
                        {/* Regular Navigation (hidden on admin pages) */}
                        {!isAdminPage && (
                            <nav className="hidden sm:flex items-center gap-4">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === item.path
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
                                className="flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        )}

                        {/* Mobile Menu Button (can be extended later) */}
                        <div className="sm:hidden">
                            {/* Mobile menu would go here */}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {!isAdminPage && (
                    <div className="sm:hidden pb-4">
                        <nav className="flex items-center justify-around">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`text-xs font-medium transition-colors px-2 py-1 rounded ${location.pathname === item.path
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
    );
}