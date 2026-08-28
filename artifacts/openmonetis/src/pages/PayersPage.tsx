import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { RiAddLine, RiUserLine, RiSettings3Line } from "@remixicon/react";

export function PayersPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">Pagadores</h1>
                        <p className="text-muted-foreground mt-1">Gerencie as pessoas que dividem despesas com você.</p>
                    </div>
                    <Button className="gap-2">
                        <RiAddLine className="size-4" />
                        Novo Pagador
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { id: "1", name: "Você (Admin)", initials: "VC", role: "Administrador", isMe: true },
                        { id: "2", name: "Maria Silva", initials: "MS", role: "Pagador", isMe: false },
                        { id: "3", name: "João Pedro", initials: "JP", role: "Pagador", isMe: false },
                    ].map((payer) => (
                        <Card key={payer.id} className={`hover:bg-muted/10 transition-colors ${payer.isMe ? 'border-primary/50 bg-primary/5' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-12">
                                            <AvatarFallback className={payer.isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                                                {payer.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{payer.name}</h3>
                                            <p className="text-xs text-muted-foreground">{payer.role}</p>
                                        </div>
                                    </div>
                                    <Link href={`/payers/${payer.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                            <RiSettings3Line className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

export function PayerDetailsPage({ params }: { params?: { payerId: string } }) {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link href="/payers">
                        <Button variant="outline" size="sm" className="gap-2">
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Detalhes do Pagador</h1>
                        <p className="text-muted-foreground text-sm">Gerencie informações e permissões.</p>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-8 text-center flex flex-col items-center">
                        <Avatar className="size-20 mb-4">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                                MS
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-semibold">Maria Silva</h3>
                        <p className="text-muted-foreground mb-6">maria@exemplo.com</p>
                        
                        <div className="flex gap-3">
                            <Button variant="outline">Editar Perfil</Button>
                            <Button variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive">Remover</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
