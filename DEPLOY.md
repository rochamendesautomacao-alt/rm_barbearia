# Guia de Deploy — RM Barbearia

## Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Projeto no [Supabase](https://supabase.com) (já configurado)
- Git instalado localmente
- Node.js 18+ instalado localmente

---

## 1. Preparar o repositório

```bash
cd rm_barbearia
git init
git add .
git commit -m "feat: projeto inicial SaaS barbearia"
```

Crie um repositório no GitHub e conecte:

```bash
git remote add origin https://github.com/SEU_USUARIO/rm-barbearia.git
git branch -M main
git push -u origin main
```

---

## 2. Rodar as migrations no Supabase

No painel do Supabase → **SQL Editor**, execute nesta ordem:

```
001_schema_inicial.sql
002_funcoes_disponibilidade.sql
003_auth_trigger.sql
004_rls_politicas_publicas.sql
005_planos_limites.sql
```

> Cada migration está em `supabase/migrations/`

---

## 3. Configurar Auth no Supabase

No painel: **Authentication → URL Configuration**

- **Site URL:** `https://SEU-PROJETO.vercel.app`
- **Redirect URLs:** `https://SEU-PROJETO.vercel.app/**`

---

## 4. Deploy na Vercel

### Via CLI (recomendado):

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Via GitHub (automático):

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório GitHub
3. Framework: **Next.js** (detectado automaticamente)
4. Adicione as variáveis de ambiente (passo abaixo)
5. Clique em **Deploy**

---

## 5. Variáveis de ambiente na Vercel

Em **Project → Settings → Environment Variables**, adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zywufysxagtffuougmgx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-PROJETO.vercel.app` | All |

> `NEXT_PUBLIC_*` são expostas no browser — use apenas anon key aqui.
> `SUPABASE_SERVICE_ROLE_KEY` é secret — nunca expor no browser.

---

## 6. Testar o deploy

Após deploy, acesse:

```
https://SEU-PROJETO.vercel.app/registro   ← criar primeira barbearia
https://SEU-PROJETO.vercel.app/login      ← entrar no painel
https://SEU-PROJETO.vercel.app/[slug]     ← página de agendamento do cliente
```

---

## 7. Domínio customizado (opcional)

Em **Project → Settings → Domains**:

```
barbearia.com.br       ← domínio principal
www.barbearia.com.br   ← redireciona para o principal
```

Configure o DNS no seu registrador:
```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

---

## Checklist de produção

- [ ] Migrations rodadas no Supabase
- [ ] Auth URLs configuradas no Supabase
- [ ] Variáveis de ambiente na Vercel
- [ ] `.env.local` está no `.gitignore`
- [ ] Deploy com status "Ready"
- [ ] `/registro` cria empresa e redireciona para `/agenda`
- [ ] `/[slug]` exibe a página de agendamento corretamente
