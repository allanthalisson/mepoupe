import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { RiGitCommitLine, RiArrowLeftLine } from "@remixicon/react";

export function SettingsChangelogPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="outline" size="sm" className="gap-2">
                            <RiArrowLeftLine className="size-4" />
                            Voltar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
                        <p className="text-muted-foreground text-sm">Histórico de atualizações do OpenMonetis.</p>
                    </div>
                </div>

                <div className="space-y-6 mt-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {[
                        { version: "v1.2.0", date: "24 de Maio, 2026", desc: "Novos relatórios e suporte a categorias aninhadas.", type: "feature" },
                        { version: "v1.1.4", date: "10 de Maio, 2026", desc: "Correção de bug na importação de OFX do Itaú.", type: "fix" },
                        { version: "v1.1.0", date: "02 de Abril, 2026", desc: "Lançamento do Companion App para Android e Inbox.", type: "major" },
                    ].map((log, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                <RiGitCommitLine className="size-5 text-muted-foreground" />
                            </div>
                            
                            <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] hover:border-primary/50 transition-colors">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-lg">{log.version}</span>
                                            {log.type === 'feature' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-green-500/10 text-green-600">Feature</span>}
                                            {log.type === 'major' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">Major</span>}
                                            {log.type === 'fix' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-orange-600">Fix</span>}
                                        </div>
                                    </div>
                                    <p className="text-muted-foreground">{log.desc}</p>
                                    <p className="text-xs text-muted-foreground/60 mt-3 font-medium">{log.date}</p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
