import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api, money } from "@/lib/api";

type Ref = { id: string; name: string };
type Transaction = { id: string; name: string; amount: string; purchaseDate: string; transactionType: string };

export function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try {
      const [rows, accountRows, categoryRows] = await Promise.all([api<Transaction[]>("/transactions"), api<Ref[]>("/accounts"), api<Ref[]>("/categories")]);
      setItems(rows); setAccounts(accountRows); setCategories(categoryRows);
    } catch (cause) { setError((cause as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const add = async () => {
    try {
      await api("/transactions", { method: "POST", body: JSON.stringify({ name, amount, accountId: accounts[0]?.id, categoryId: categories[0]?.id, purchaseDate: new Date().toISOString().slice(0, 10), transactionType: "despesa" }) });
      setName(""); setAmount(""); await load();
    } catch (cause) { setError((cause as Error).message); }
  };
  return <DashboardLayout><div className="space-y-6">
    <h1 className="text-3xl font-semibold">Lançamentos</h1>
    <div className="flex gap-2"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Descrição" /><Input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" placeholder="Valor" /><Button disabled={!name || !amount || !accounts.length || !categories.length} onClick={() => void add()}>Novo</Button></div>
    {(!accounts.length || !categories.length) && !loading && <p className="text-muted-foreground">Cadastre uma conta e uma categoria antes de lançar.</p>}
    {error && <p className="text-destructive">{error}</p>}
    {loading ? <p>Carregando...</p> : items.length === 0 ? <p className="text-muted-foreground">Nenhum lançamento cadastrado.</p> : <Card><CardContent className="p-0">{items.map((item) => <div className="p-4 border-b flex justify-between" key={item.id}><span><b>{item.name}</b><small className="block">{item.purchaseDate}</small></span><span>{money(item.amount)} <Button variant="destructive" size="sm" onClick={async () => { await api(`/transactions/${item.id}`, { method: "DELETE" }); await load(); }}>Excluir</Button></span></div>)}</CardContent></Card>}
  </div></DashboardLayout>;
}

export function TransactionsImportPage() {
  const [accounts, setAccounts] = useState<Ref[]>([]);
  const [categories, setCategories] = useState<Ref[]>([]);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [csv, setCsv] = useState("data,descricao,valor,tipo\n");
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number }>();
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api<Ref[]>("/accounts"), api<Ref[]>("/categories")]).then(([a, c]) => { setAccounts(a); setCategories(c); setAccountId(a[0]?.id || ""); setCategoryId(c[0]?.id || ""); }).catch((cause) => setError((cause as Error).message)); }, []);
  const importRows = async () => {
    try {
      const lines = csv.trim().split(/\r?\n/).slice(1);
      const rows = lines.filter(Boolean).map((line) => {
        const [purchaseDate, name, amount, transactionType = "despesa"] = line.split(",").map((value) => value.trim());
        return { purchaseDate, name, amount: Number(amount.replace(",", ".")), transactionType, accountId, categoryId };
      });
      setResult(await api("/transactions/import", { method: "POST", body: JSON.stringify({ rows }) }));
      setError("");
    } catch (cause) { setError((cause as Error).message); }
  };
  return <DashboardLayout><div className="space-y-5">
    <h1 className="text-3xl font-semibold">Importar Lançamentos</h1>
    <p className="text-muted-foreground">Cole um CSV com as colunas data, descrição, valor e tipo.</p>
    <div className="grid md:grid-cols-2 gap-3"><select value={accountId} onChange={(event) => setAccountId(event.target.value)}>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
    <textarea className="w-full min-h-52 rounded-md border bg-background p-3 font-mono text-sm" value={csv} onChange={(event) => setCsv(event.target.value)} />
    <Button disabled={!accountId || !categoryId || csv.trim().split(/\r?\n/).length < 2} onClick={() => void importRows()}>Importar CSV</Button>
    {error && <p className="text-destructive">{error}</p>}
    {result && <Card><CardContent className="p-4">Importados: <b>{result.imported}</b> · Ignorados: <b>{result.skipped}</b> · Erros: <b>{result.errors}</b></CardContent></Card>}
  </div></DashboardLayout>;
}