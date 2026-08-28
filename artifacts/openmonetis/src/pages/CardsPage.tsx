import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api, money } from "@/lib/api";

type Account = { id: string; name: string };
type CreditCard = { id: string; name: string; limit: string; brand: string | null };
type Invoice = {
  card: CreditCard;
  transactions: Array<{ id: string; name: string; amount: string; purchaseDate: string }>;
  total: number;
};

export function CardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const [cardRows, accountRows] = await Promise.all([api<CreditCard[]>("/cards"), api<Account[]>("/accounts")]);
      setCards(cardRows);
      setAccounts(accountRows);
      setAccountId((value) => value || accountRows[0]?.id || "");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);
  const add = async () => {
    try {
      await api("/cards", { method: "POST", body: JSON.stringify({ name, accountId, closingDay: "25", dueDay: "2", limit: 0 }) });
      setName("");
      await load();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };
  return <DashboardLayout><div className="space-y-6">
    <h1 className="text-3xl font-semibold">Cartões de Crédito</h1>
    <div className="flex gap-2">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do cartão" />
      <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select>
      <Button disabled={!name || !accountId} onClick={() => void add()}>Novo Cartão</Button>
    </div>
    {!accounts.length && !loading && <p className="text-muted-foreground">Cadastre uma conta antes de criar um cartão.</p>}
    {error && <p className="text-destructive">{error}</p>}
    {loading ? <p>Carregando...</p> : cards.length === 0 ? <p className="text-muted-foreground">Nenhum cartão cadastrado.</p> : <div className="grid md:grid-cols-3 gap-4">{cards.map((card) => <Card key={card.id}><CardContent className="p-5">
      <b>{card.name}</b><p>{card.brand || "Cartão"}</p><p className="my-3">Limite: {money(card.limit)}</p>
      <div className="flex gap-2"><Button asChild size="sm"><Link href={`/cards/${card.id}/invoice`}>Ver fatura</Link></Button><Button variant="destructive" size="sm" onClick={async () => { await api(`/cards/${card.id}`, { method: "DELETE" }); await load(); }}>Excluir</Button></div>
    </CardContent></Card>)}</div>}
  </div></DashboardLayout>;
}

export function CardInvoicePage() {
  const [, params] = useRoute("/cards/:cardId/invoice");
  const [data, setData] = useState<Invoice>();
  const [error, setError] = useState("");
  useEffect(() => {
    if (params?.cardId) api<Invoice>(`/cards/${params.cardId}/invoice`).then(setData).catch((cause) => setError((cause as Error).message));
  }, [params?.cardId]);
  return <DashboardLayout><div className="space-y-4">
    <h1 className="text-3xl font-semibold">Fatura do Cartão</h1>
    {error ? <p className="text-destructive">{error}</p> : !data ? <p>Carregando...</p> : <Card><CardContent className="p-5">
      <div className="flex justify-between"><b>{data.card.name}</b><strong>Total: {money(data.total)}</strong></div>
      {data.transactions.length ? data.transactions.map((transaction) => <div className="border-b py-3 flex justify-between" key={transaction.id}><span>{transaction.purchaseDate} — {transaction.name}</span><b>{money(transaction.amount)}</b></div>) : <p className="text-muted-foreground mt-4">Nenhum lançamento nesta fatura.</p>}
    </CardContent></Card>}
  </div></DashboardLayout>;
}