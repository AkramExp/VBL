import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "@/config";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";

interface Transaction {
    _id: string;
    type: 'signing' | 'release';
    player: any;
    team: any;
    details: string;
    timestamp: string;
}

export function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/transactions`);
                setTransactions(response.data);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-white font-bold">🏐</span>
                </div>
                <p className="text-muted-foreground">Loading transactions...</p>
            </div>
        </div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-volleyball-court/10">
            <Header
                title="Indian Volleyball League"
                subtitle="Transaction History"
            />


            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
                <Card className="shadow-card max-h-[80vh] overflow-y-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            All Transactions ({transactions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.map(transaction => (
                                <div key={transaction._id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-4">
                                        {transaction.type === 'signing' ? (
                                            <ArrowUpRight className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <ArrowDownLeft className="h-6 w-6 text-red-600" />
                                        )}
                                        <div>
                                            <div className="font-medium">
                                                {transaction?.player?.discordName}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {transaction.details}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDate(transaction.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={transaction.type === 'signing' ? 'default' : 'destructive'} className="hidden sm:block">
                                        {transaction.type === 'signing' ? 'SIGNING' : 'RELEASE'}
                                    </Badge>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No transactions yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default Transactions;