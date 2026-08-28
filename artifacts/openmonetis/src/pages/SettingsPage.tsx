import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
                    <p className="text-muted-foreground mt-1">Gerencie as preferências da sua conta e do aplicativo.</p>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="profile">Perfil</TabsTrigger>
                        <TabsTrigger value="preferences">Preferências</TabsTrigger>
                        <TabsTrigger value="security">Segurança</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Pessoais</CardTitle>
                                <CardDescription>Dados da sessão ativa.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome completo</Label>
                                    <Input id="name" value={user?.name ?? ""} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" type="email" value={user?.email ?? ""} disabled />
                                    <p className="text-xs text-muted-foreground">A edição do perfil ainda não está disponível nesta versão.</p>
                                </div>
                                <Button disabled>Edição de perfil indisponível</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Sistema</CardTitle>
                                <CardDescription>Informações sobre a versão atual do OpenMonetis.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                                    <div>
                                        <p className="font-medium">Versão 1.2.0</p>
                                        <p className="text-sm text-muted-foreground">Seu sistema está atualizado.</p>
                                    </div>
                                    <Link href="/settings/changelog">
                                        <Button variant="outline">Ver Changelog</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Aparência e Formatos</CardTitle>
                                <CardDescription>Como o OpenMonetis deve ser exibido para você.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Modo Privacidade</Label>
                                        <p className="text-sm text-muted-foreground">Ocultar valores monetários por padrão</p>
                                    </div>
                                    <Switch disabled />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Animações Reduzidas</Label>
                                        <p className="text-sm text-muted-foreground">Desabilitar efeitos de transição e movimento</p>
                                    </div>
                                    <Switch disabled />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Notificações por Email</Label>
                                        <p className="text-sm text-muted-foreground">Receber alertas de vencimento de faturas</p>
                                    </div>
                                    <Switch defaultChecked disabled />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Segurança</CardTitle>
                                <CardDescription>A alteração de senha ainda não está disponível nesta versão.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Senha atual</Label>
                                    <Input id="current-password" type="password" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nova senha</Label>
                                    <Input id="new-password" type="password" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                                    <Input id="confirm-password" type="password" disabled />
                                </div>
                                <Button disabled>Alteração de senha indisponível</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
