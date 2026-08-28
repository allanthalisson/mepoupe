import { Router, type Request } from "express";
import { and, attachments, budgets, cards, categories, db, desc, eq, financialAccounts, inboxItems, notes, payers, savedInsights, sql, transactions } from "@workspace/db";
import { auth } from "../lib/auth";
import { isTrustedOrigin } from "../lib/origins";

const router = Router();
type User = { id: string; name: string; email: string };
async function currentUser(req: Request): Promise<User | null> {
  const result = await auth.api.getSession({ headers: new Headers(Object.entries(req.headers).flatMap(([key, value]) => value === undefined ? [] : [[key, Array.isArray(value) ? value.join(",") : value]])) });
  return result?.user as User ?? null;
}
router.use(async (req, res, next) => {
  try { const user = await currentUser(req); if (!user) { res.status(401).json({ message: "Não autenticado." }); return; } res.locals.user = user; next(); }
  catch (error) { next(error); }
});
router.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }
  if (!isTrustedOrigin(req.get("origin"))) {
    res.status(403).json({ message: "Origem não permitida." });
    return;
  }
  next();
});
const userId = (res: any) => res.locals.user.id as string;
const valid = (res: any, condition: unknown, message: string) => { if (!condition) { res.status(400).json({ message }); return false; } return true; };
const periodFor = (date: string) => date.slice(0, 7);
const dateFor = (date: string) => new Date(`${date}T00:00:00.000Z`);

function crud(path: string, table: any, build: (body: any, uid: string) => any, required: (body: any) => boolean, message: string) {
  router.get(path, async (_req, res, next) => { try { res.json(await db.select().from(table).where(eq(table.userId, userId(res))).orderBy(desc(table.createdAt))); } catch (e) { next(e); } });
  router.post(path, async (req, res, next) => { try { if (!valid(res, required(req.body), message)) return; const result: any = await db.insert(table).values(build(req.body, userId(res))).returning(); res.status(201).json(result[0]); } catch (e) { next(e); } });
  router.patch(`${path}/:id`, async (req, res, next) => { try { if (!valid(res, required(req.body), message)) return; const [row] = await db.update(table).set(build(req.body, userId(res))).where(and(eq(table.id, req.params.id), eq(table.userId, userId(res)))).returning(); if (!row) return void res.status(404).json({ message: "Registro não encontrado." }); res.json(row); } catch (e) { next(e); } });
  router.delete(`${path}/:id`, async (req, res, next) => { try { const result: any = await db.delete(table).where(and(eq(table.id, req.params.id), eq(table.userId, userId(res)))).returning(); if (!result[0]) return void res.status(404).json({ message: "Registro não encontrado." }); res.status(204).end(); } catch (e) { next(e); } });
}
crud("/accounts", financialAccounts, (b, uid) => ({ userId: uid, name: b.name, accountType: b.accountType || "Conta", initialBalance: String(b.initialBalance ?? 0), status: b.status || "ativa", logo: b.logo || "", note: b.note || null }), b => Boolean(b.name), "Nome da conta é obrigatório.");
crud("/categories", categories, (b, uid) => ({ userId: uid, name: b.name, type: b.type, icon: b.icon || null }), b => Boolean(b.name && ["receita", "despesa"].includes(b.type)), "Informe nome e tipo (receita ou despesa).");
crud("/payers", payers, (b, uid) => ({ userId: uid, name: b.name, email: b.email || null, note: b.note || null, status: b.status || "ativo", shareCode: b.shareCode || "" }), b => Boolean(b.name), "Nome do pagador é obrigatório.");
crud("/notes", notes, (b, uid) => ({ userId: uid, title: b.title || null, description: b.description || null, type: b.type || "nota", tasks: b.tasks || null, archived: Boolean(b.archived) }), b => Boolean(b.title || b.description), "Informe um título ou descrição.");
crud("/insights", savedInsights, (b, uid) => ({ userId: uid, period: b.period || new Date().toISOString().slice(0, 7), modelId: b.modelId || "manual", data: JSON.stringify(b.data ?? {}) }), b => Boolean(b.data), "Dados do insight são obrigatórios.");
crud("/inbox", inboxItems, (b, uid) => ({ userId: uid, sourceApp: b.sourceApp || "manual", originalText: b.originalText, originalTitle: b.originalTitle || null, sourceAppName: b.sourceAppName || null, notificationTimestamp: new Date(b.notificationTimestamp || Date.now()), parsedName: b.parsedName || null, parsedAmount: b.parsedAmount ? String(b.parsedAmount) : null, status: b.status || "pending" }), b => Boolean(b.originalText), "Texto da entrada é obrigatório.");
router.get("/budgets", async (_req,res,next)=>{try{const uid=userId(res);const result=await db.select().from(budgets).where(eq(budgets.userId,uid));res.json(result)}catch(e){next(e)}});
router.post("/budgets", async(req,res,next)=>{try{const b=req.body;if(!valid(res,b.categoryId&&b.period&&Number(b.amount)>=0,"Informe categoria, período e valor."))return;const category=await db.select({id:categories.id}).from(categories).where(and(eq(categories.id,b.categoryId),eq(categories.userId,userId(res))));if(!category.length)return void res.status(400).json({message:"Categoria inválida."});const[row]=await db.insert(budgets).values({userId:userId(res),categoryId:b.categoryId,period:b.period,amount:String(b.amount)}).returning();res.status(201).json(row)}catch(e){next(e)}});
router.delete("/budgets/:id",async(req,res,next)=>{try{const[row]=await db.delete(budgets).where(and(eq(budgets.id,req.params.id),eq(budgets.userId,userId(res)))).returning();if(!row)return void res.status(404).json({message:"Registro não encontrado."});res.status(204).end()}catch(e){next(e)}});
router.get("/accounts/:id/statement",async(req,res,next)=>{try{const uid=userId(res);const accountRows=await db.select().from(financialAccounts).where(and(eq(financialAccounts.id,req.params.id),eq(financialAccounts.userId,uid)));if(!accountRows[0])return void res.status(404).json({message:"Conta não encontrada."});const rows=await db.select().from(transactions).where(and(eq(transactions.accountId,req.params.id),eq(transactions.userId,uid))).orderBy(desc(transactions.purchaseDate));res.json({account:accountRows[0],transactions:rows})}catch(e){next(e)}});
router.get("/cards/:id/invoice",async(req,res,next)=>{try{const uid=userId(res);const card=await db.select().from(cards).where(and(eq(cards.id,req.params.id),eq(cards.userId,uid)));if(!card[0])return void res.status(404).json({message:"Cartão não encontrado."});const rows=await db.select().from(transactions).where(and(eq(transactions.cardId,req.params.id),eq(transactions.userId,uid)));res.json({card:card[0],transactions:rows,total:rows.reduce((s,x)=>s+Math.abs(Number(x.amount)),0)})}catch(e){next(e)}});
router.get("/calendar",async(_req,res,next)=>{try{const rows=await db.select().from(transactions).where(eq(transactions.userId,userId(res))).orderBy(desc(transactions.purchaseDate));res.json(rows)}catch(e){next(e)}});
router.get("/reports/:kind",async(req,res,next)=>{try{const rows=await db.select().from(transactions).where(eq(transactions.userId,userId(res)));const totals=rows.reduce((acc:Record<string,number>,x)=>{const key=req.params.kind==="establishments"?x.name:x.period;acc[key]=(acc[key]||0)+Number(x.amount);return acc},{});res.json({kind:req.params.kind,items:Object.entries(totals).map(([label,amount])=>({label,amount}))})}catch(e){next(e)}});
router.get("/attachments",async(_req,res,next)=>{try{res.json(await db.select({id:attachments.id,fileName:attachments.fileName,fileSize:attachments.fileSize,mimeType:attachments.mimeType,createdAt:attachments.createdAt}).from(attachments).where(eq(attachments.userId,userId(res))))}catch(e){next(e)}});
router.post("/attachments",async(req,res,next)=>{try{const b=req.body;if(!valid(res,b.fileName&&b.content,"Informe arquivo e conteúdo."))return;const content=String(b.content);const[row]=await db.insert(attachments).values({userId:userId(res),fileKey:crypto.randomUUID(),fileName:b.fileName,mimeType:b.mimeType||"text/plain",fileSize:Buffer.byteLength(content),content}).returning();res.status(201).json(row)}catch(e){next(e)}});
router.get("/attachments/:id/download",async(req,res,next)=>{try{const[row]=await db.select().from(attachments).where(and(eq(attachments.id,req.params.id),eq(attachments.userId,userId(res))));if(!row)return void res.status(404).json({message:"Arquivo não encontrado."});res.type(row.mimeType).send(row.content||"")}catch(e){next(e)}});
router.delete("/attachments/:id",async(req,res,next)=>{try{const[row]=await db.delete(attachments).where(and(eq(attachments.id,req.params.id),eq(attachments.userId,userId(res)))).returning();if(!row)return void res.status(404).json({message:"Arquivo não encontrado."});res.status(204).end()}catch(e){next(e)}});
router.get("/cards", async (_req, res, next) => { try { res.json(await db.select().from(cards).where(eq(cards.userId, userId(res))).orderBy(desc(cards.createdAt))); } catch(e){next(e)} });
router.post("/cards", async (req,res,next) => { try { const b=req.body; if(!valid(res,b.name&&b.accountId&&b.closingDay&&b.dueDay,"Informe nome, conta, fechamento e vencimento.")) return; const account=await db.select({id:financialAccounts.id}).from(financialAccounts).where(and(eq(financialAccounts.id,b.accountId),eq(financialAccounts.userId,userId(res)))); if(!account.length) return void res.status(400).json({message:"Conta inválida."}); const [row]=await db.insert(cards).values({userId:userId(res),name:b.name,accountId:b.accountId,closingDay:String(b.closingDay),dueDay:String(b.dueDay),limit:String(b.limit??0),status:"ativo",brand:b.brand||null,logo:b.logo||null,note:b.note||null}).returning();res.status(201).json(row);}catch(e){next(e)} });
router.patch("/cards/:id", async(req,res,next)=>{try{const b=req.body;if(!valid(res,b.name&&b.closingDay&&b.dueDay,"Informe nome, fechamento e vencimento."))return;const [row]=await db.update(cards).set({name:b.name,closingDay:String(b.closingDay),dueDay:String(b.dueDay),limit:String(b.limit??0),brand:b.brand||null,note:b.note||null}).where(and(eq(cards.id,req.params.id),eq(cards.userId,userId(res)))).returning();if(!row)return void res.status(404).json({message:"Registro não encontrado."});res.json(row)}catch(e){next(e)}});
router.delete("/cards/:id", async(req,res,next)=>{try{const [row]=await db.delete(cards).where(and(eq(cards.id,req.params.id),eq(cards.userId,userId(res)))).returning();if(!row)return void res.status(404).json({message:"Registro não encontrado."});res.status(204).end()}catch(e){next(e)}});
router.get("/transactions", async (_req,res,next)=>{try{res.json(await db.select().from(transactions).where(eq(transactions.userId,userId(res))).orderBy(desc(transactions.purchaseDate)));}catch(e){next(e)}});
router.post("/transactions", async (req, res, next) => {
  try {
    const body = req.body;
    if (!valid(res, body.name && body.accountId && body.categoryId && body.purchaseDate && Number.isFinite(Number(body.amount)) && Number(body.amount) !== 0, "Informe descrição, conta, categoria, data e valor.")) return;
    const uid = userId(res);
    const [accountRows, categoryRows, cardRows] = await Promise.all([
      db.select({ id: financialAccounts.id }).from(financialAccounts).where(and(eq(financialAccounts.id, body.accountId), eq(financialAccounts.userId, uid))),
      db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, body.categoryId), eq(categories.userId, uid))),
      body.cardId
        ? db.select({ id: cards.id }).from(cards).where(and(eq(cards.id, body.cardId), eq(cards.userId, uid)))
        : Promise.resolve([{ id: null }]),
    ]);
    if (!accountRows.length || !categoryRows.length || !cardRows.length) {
      res.status(400).json({ message: "Conta, categoria ou cartão inválido." });
      return;
    }
    const amount = Math.abs(Number(body.amount)) * (body.transactionType === "receita" ? 1 : -1);
    const [row] = await db.insert(transactions).values({
      userId: uid,
      name: body.name,
      accountId: body.accountId,
      categoryId: body.categoryId,
      cardId: body.cardId || null,
      amount: String(amount),
      purchaseDate: dateFor(body.purchaseDate),
      period: periodFor(body.purchaseDate),
      transactionType: body.transactionType || "despesa",
      condition: "realizado",
      paymentMethod: body.paymentMethod || (body.cardId ? "cartao" : "conta"),
      note: body.note || null,
    }).returning();
    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
});
router.patch("/transactions/:id",async(req,res,next)=>{try{const b=req.body;if(!valid(res,b.name&&b.purchaseDate&&Number.isFinite(Number(b.amount)),"Informe descrição, data e valor."))return;const amount=Math.abs(Number(b.amount))*(b.transactionType==="receita"?1:-1);const[row]=await db.update(transactions).set({name:b.name,amount:String(amount),purchaseDate:dateFor(b.purchaseDate),period:periodFor(b.purchaseDate),transactionType:b.transactionType||"despesa",note:b.note||null}).where(and(eq(transactions.id,req.params.id),eq(transactions.userId,userId(res)))).returning();if(!row)return void res.status(404).json({message:"Registro não encontrado."});res.json(row)}catch(e){next(e)}});
router.post("/transactions/import", async (req, res, next) => {
  try {
    const rows = req.body.rows;
    if (!valid(res, Array.isArray(rows) && rows.length, "Envie ao menos uma linha CSV analisada.")) return;
    const uid = userId(res);
    const accountIds = [...new Set<string>(rows.map((row: any) => row.accountId).filter(Boolean))];
    const categoryIds = [...new Set<string>(rows.map((row: any) => row.categoryId).filter(Boolean))];
    const [ownedAccounts, ownedCategories] = await Promise.all([
      Promise.all(accountIds.map((id) => db.select({ id: financialAccounts.id }).from(financialAccounts).where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, uid))))),
      Promise.all(categoryIds.map((id) => db.select({ id: categories.id }).from(categories).where(and(eq(categories.id, id), eq(categories.userId, uid))))),
    ]);
    if (ownedAccounts.some((result) => !result.length) || ownedCategories.some((result) => !result.length)) {
      res.status(400).json({ message: "Conta ou categoria de importação inválida." });
      return;
    }
    const batch = crypto.randomUUID();
    let imported = 0;
    let skipped = 0;
    await db.transaction(async (tx) => {
      for (const row of rows) {
        if (!row.name || !row.accountId || !row.categoryId || !row.purchaseDate || !Number.isFinite(Number(row.amount))) throw new Error("Linha de importação inválida.");
        const fingerprint = String(row.fingerprint || `${row.purchaseDate}|${row.name}|${row.amount}|${row.accountId}`);
        const exists = await tx.select({ id: transactions.id }).from(transactions).where(and(eq(transactions.userId, uid), eq(transactions.ofxImportFingerprint, fingerprint)));
        if (exists.length) {
          skipped++;
          continue;
        }
        const amount = Math.abs(Number(row.amount)) * (row.transactionType === "receita" ? 1 : -1);
        await tx.insert(transactions).values({
          userId: uid,
          name: row.name,
          accountId: row.accountId,
          categoryId: row.categoryId,
          purchaseDate: dateFor(row.purchaseDate),
          period: periodFor(row.purchaseDate),
          amount: String(amount),
          transactionType: row.transactionType || "despesa",
          condition: "realizado",
          paymentMethod: "importacao",
          ofxImportFingerprint: fingerprint,
          importBatchId: batch,
        });
        imported++;
      }
    });
    res.status(201).json({ imported, skipped, errors: 0, importBatchId: batch });
  } catch (error) {
    next(error);
  }
});
router.delete("/transactions/:id",async(req,res,next)=>{try{const [row]=await db.delete(transactions).where(and(eq(transactions.id,req.params.id),eq(transactions.userId,userId(res)))).returning();if(!row)return void res.status(404).json({message:"Registro não encontrado."});res.status(204).end()}catch(e){next(e)}});
router.get("/dashboard", async (_req,res,next)=>{try{const uid=userId(res);const rows=await db.select({income:sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,expenses:sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then ${transactions.amount} else 0 end), 0)`}).from(transactions).where(eq(transactions.userId,uid));const recent=await db.select().from(transactions).where(eq(transactions.userId,uid)).orderBy(desc(transactions.purchaseDate)).limit(5);const accounts=await db.select().from(financialAccounts).where(eq(financialAccounts.userId,uid));res.json({income:Number(rows[0]?.income??0),expenses:Number(rows[0]?.expenses??0),balance:Number(rows[0]?.income??0)+Number(rows[0]?.expenses??0),recent,accounts});}catch(e){next(e)}});
export default router;