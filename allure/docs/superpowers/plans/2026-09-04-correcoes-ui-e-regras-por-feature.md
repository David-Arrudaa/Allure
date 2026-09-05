# Plano de Correções de UI e Regras de Negócio por Feature

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir inconsistências de espaçamento/padding, sobreposição de ícone de busca, alinhamento e scroll inicial na Agenda, dimensão do modal de produtos, exibição de vendas sem cliente no Financeiro e bloqueio de autoexclusão de admin na Equipe.

**Architecture:** Padronização visual com base na tela de referência `src/pages/Financeiro/` (`padding: 1.5rem; background: #ffffff; border-radius: var(--raio-borda, 12px); min-height: calc(100vh - 3rem); display: flex; flex-direction: column`). Correção das classes `.busca-container` e posicionamento da lupa. Ajustes nas páginas `Servicos.jsx`, `Clientes.jsx`, `Agenda.jsx`, `Produtos.jsx`, `Financeiro.jsx`, `Equipe.jsx`.

**Tech Stack:** React 19, Vite, Lucide React, Tailwind CSS / Vanilla CSS módulos, Supabase.

**Spec:** Base visual extraída de `Financeiro.css` / `Financeiro.jsx`.

## Global Constraints

- Padrão de container principal de tela: `padding: 1.5rem; background: #fff; border-radius: var(--raio-borda, 12px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); min-height: calc(100vh - 3rem); display: flex; flex-direction: column;`
- Barra de busca padronizada com a do Financeiro: container relativo com ícone à esquerda (`left: 12px` ou `left: 1rem`), input com padding-left de no mínimo `2.5rem` / `2.8rem` garantindo que o placeholder nunca sobreponha a lupa.
- Nomes de domínio e UI em português (pt-BR).
- Sempre verificar build (`npm run build`) ao finalizar cada task.

---

### Task 1: [Feature Serviços] Correção de Padding do Container e Sobreposição da Lupa de Busca

**Files:**
- Modify: `src/pages/Servicos.css:1-77`
- Modify: `src/pages/Servicos.jsx:72-108`

**Interfaces:**
- Consumes: Estrutura HTML/CSS atual de `Servicos.jsx` e `Servicos.css`
- Produces: Layout padronizado conforme `Financeiro.css` com espaçamento e padding corretos, e campo de busca sem sobreposição de ícone.

- [ ] **Step 1: Inspecionar e ajustar padding do container e input no `Servicos.css`**

Aplicar a mesma estrutura do `financeiro-container`:
```css
.servicos-container {
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: var(--raio-borda, 12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  min-height: calc(100vh - 3rem);
  color: var(--cor-texto, #334155);
  display: flex;
  flex-direction: column;
}

/* Busca padronizada sem sobreposição */
.busca-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.busca-container svg {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.busca-container input {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.8rem;
  border: 1px solid var(--cor-borda, #e2e8f0);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--cor-texto);
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s;
}
```

- [ ] **Step 2: Verificar e ajustar `Servicos.jsx` para consistência**

Garantir que a estrutura dos elementos e classes bata com o CSS atualizado.

- [ ] **Step 3: Testar e verificar no navegador/Playwright**

Verificar se o padding externo é de `1.5rem` em desktop e se o texto "Buscar serviço por nome..." não colide com o ícone de lupa.

- [ ] **Step 4: Commit das alterações**

```bash
git add src/pages/Servicos.css src/pages/Servicos.jsx
git commit -m "fix(servicos): corrigir padding da tela e sobreposição da lupa na busca"
```

---

### Task 2: [Feature Clientes] Correção de Padding do Container e Sobreposição da Lupa de Busca

**Files:**
- Modify: `src/pages/Clientes.css:1-75`
- Modify: `src/pages/Clientes.jsx:42-81`

**Interfaces:**
- Consumes: Estrutura HTML/CSS atual de `Clientes.jsx` e `Clientes.css`
- Produces: Layout padronizado conforme `Financeiro.css` com `min-height: calc(100vh - 3rem)` e `padding: 1.5rem`, além de busca alinhada.

- [ ] **Step 1: Ajustar `Clientes.css`**

Corrigir `.clientes-container` e `.busca-container input`:
```css
.clientes-container {
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: var(--raio-borda, 12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  min-height: calc(100vh - 3rem);
  color: var(--cor-texto, #334155);
  display: flex;
  flex-direction: column;
}

.busca-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 400px;
}

.busca-container svg {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.busca-container input {
  width: 100%;
  padding: 0.7rem 1rem 0.7rem 2.8rem;
  border: 1px solid var(--cor-borda, #e2e8f0);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--cor-texto);
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s;
}
```

- [ ] **Step 2: Verificar `Clientes.jsx`**

Verificar se o input e classes estão idênticos aos de Serviços e Financeiro.

- [ ] **Step 3: Testar visualmente**

Confirmar que a lupa e o texto do input de busca não colidem e que a página mantém padding de 1.5rem e bordas arredondadas.

- [ ] **Step 4: Commit das alterações**

```bash
git add src/pages/Clientes.css src/pages/Clientes.jsx
git commit -m "fix(clientes): alinhar padding da tela e espaçamento da busca com o financeiro"
```

---

### Task 3: [Feature Agenda] Alinhamento do Topbar e Foco Automático às 8h da Manhã

**Files:**
- Modify: `src/pages/Agenda.jsx:418-433, 525-580`
- Modify: `src/pages/Agenda.css:18-138`

**Interfaces:**
- Consumes: `.agenda-topbar`, `.agenda-header-esquerda`, `.agenda-header-direita`, `.agenda-wrapper`
- Produces: Header alinhado horizontalmente com baseline centralizada entre títulos, badges e botões de navegação (`Anterior`, `Hoje`, `Próxima`). Scroll inicial focado às 08:00 (posição útil) caso não seja o dia atual com linha do tempo ou quando a página carrega.

- [ ] **Step 1: Ajustar alinhamento da topbar no `Agenda.css` e `Agenda.jsx`**

No `Agenda.css`:
```css
.agenda-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--cor-borda, #e2e8f0);
  gap: 1rem;
}

.agenda-header-esquerda {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.agenda-titulo-linha {
  display: flex;
  align-items: center;
  gap: 10px;
}
```
Garantir que "Agenda Inteligente", o badge "0 agendamentos" e os botões "Anterior", "Hoje", "Próxima" fiquem nivelados verticalmente (`align-items: center`).

- [ ] **Step 2: Implementar foco padrão às 08:00 (horário útil) no `Agenda.jsx`**

Na grade da agenda, cada hora tem 60px (ou 120px para escala de 2px por minuto, topo de 74px de header). Às 08:00:
`posicao8h = (8 * 60 * 2) + 74 = 1034px` (ou cálculo proporcional da grade):
```javascript
useEffect(() => {
  const container = document.querySelector(".agenda-wrapper");
  if (!container) return;

  if (mostrarLinhaTempo && linhaTempoRef.current) {
    container.scrollTo({
      top: linhaTempoRef.current.offsetTop - container.clientHeight / 2,
      left: 0,
      behavior: "smooth",
    });
  } else {
    // Foca às 08:00 (8h * 60min * 2px/min = 960px + offset cabeçalho)
    const topo8Horas = (8 * 60 * 2) + 74;
    container.scrollTo({
      top: topo8Horas - 20,
      left: 0,
      behavior: "smooth",
    });
  }
}, [dataSelecionada, mostrarLinhaTempo]);
```

- [ ] **Step 3: Testar navegação de dias e scroll**

Verificar que ao abrir a agenda ou navegar entre dias diferentes, o scroll inicial para às 08:00 da manhã. Conferir o alinhamento visual dos textos e botões na barra superior.

- [ ] **Step 4: Commit das alterações**

```bash
git add src/pages/Agenda.jsx src/pages/Agenda.css
git commit -m "fix(agenda): alinhar elementos da topbar e focar grade às 08:00"
```

---

### Task 4: [Feature Produtos] Aumento e Espaçamento do Modal de Edição/Criação de Produto

**Files:**
- Modify: `src/pages/Produtos/Produtos.jsx:312-435`
- Modify: `src/pages/Produtos/Produtos.css`

**Interfaces:**
- Consumes: Modal de criação/edição em `Produtos.jsx`
- Produces: Modal amplo, com `max-width: 540px` (ou `580px`), padding interno de `2rem`, gap espaçado entre campos e inputs com altura e padding confortáveis.

- [ ] **Step 1: Ajustar estilos do modal em `Produtos.css` e inline no `Produtos.jsx`**

Em `Produtos.jsx`, remover `maxWidth: "450px"` hardcoded e criar/utilizar classe `.modal-produto-box` em `Produtos.css`:
```css
.modal-produto-box {
  max-width: 560px;
  width: 95%;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-produto-box .modal-header {
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-produto-box .form-grupo {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.modal-produto-box .form-grupo label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.modal-produto-box .form-grupo input {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
}

.modal-produto-box .form-grupo input:focus {
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}
```

- [ ] **Step 2: Atualizar `Produtos.jsx` para usar a classe `.modal-produto-box`**

Substituir o `style={{ maxWidth: "450px" }}` pela classe CSS com espaçamento e padding adequados.

- [ ] **Step 3: Testar abertura do modal de cadastro e edição**

Conferir se o modal respira adequadamente e não parece apertado em resoluções desktop e mobile.

- [ ] **Step 4: Commit das alterações**

```bash
git add src/pages/Produtos/Produtos.jsx src/pages/Produtos/Produtos.css
git commit -m "style(produtos): aumentar dimensões e espaçamento do modal de produto"
```

---

### Task 5: [Feature Financeiro] Tratamento para Venda sem Cliente Cadastrado

**Files:**
- Modify: `src/pages/Financeiro/Financeiro.jsx:145-149, 342-345`
- Modify: `src/components/domain/ModalRecebimentoAvulso/index.jsx`

**Interfaces:**
- Consumes: Query de appointments no Financeiro
- Produces: Exibição amigável como "Venda Balcão (Avulsa)" ou "Cliente não identificado" em vez de "Cliente Removido" quando a venda não possui `customer_id`.

- [ ] **Step 1: Identificar vendas avulsas sem cliente no `Financeiro.jsx`**

Linha 145-148 e 342-345:
```javascript
// Se o item for uma venda e não tiver customer vinculado:
const isVenda = item.duracao === 0 || String(item.servico || "").toLowerCase().startsWith("venda:");
const clienteNome = item.customers?.nome 
  ? item.customers.nome 
  : isVenda 
    ? "Venda Balcão (Avulsa)" 
    : (item.customer_id ? "Cliente Removido" : "Não informado");
```

- [ ] **Step 2: Ajustar a busca no `Financeiro.jsx`**

Garantir que a busca por texto filtre corretamente pelo nome exibido ("Venda Balcão" ou nome do cliente).

- [ ] **Step 3: Testar listagem do Financeiro**

Criar/verificar uma venda sem cliente selecionado no modal de venda avulsa e conferir se na tabela geral e no relatório PDF aparece "Venda Balcão (Avulsa)" em vez de "Cliente Removido".

- [ ] **Step 4: Commit das alterações**

```bash
git add src/pages/Financeiro/Financeiro.jsx
git commit -m "fix(financeiro): exibir 'Venda Balcão (Avulsa)' quando venda não tiver cliente cadastrado"
```

---

### Task 6: [Feature Equipe] Bloquear Autoexclusão do Administrador Logado

**Files:**
- Modify: `src/pages/Equipe/Equipe.jsx:460-478`

**Interfaces:**
- Consumes: `user` e `profile` de `useAuth()`
- Produces: Desabilitação ou ocultação do botão de excluir no card da própria profissional logada ou validação impedindo a ação com feedback visual claro.

- [ ] **Step 1: Condicionar a exibição/ação do botão de excluir no card de Equipe**

No mapeamento dos cards de equipe (`src/pages/Equipe/Equipe.jsx`):
```jsx
const isProprioUsuario = (profile?.id && prof.id === profile.id) || (user?.id && prof.user_id === user.id);

<div className="equipe-card-acoes">
  <button
    className="btn-editar"
    onClick={() => abrirModalEdicao(prof)}
    title="Editar"
  >
    <Edit size={18} />
  </button>
  {!isProprioUsuario && (
    <button
      className="btn-excluir"
      onClick={() => abrirModalExcluir(prof.id)}
      title="Excluir"
    >
      <Trash2 size={18} />
    </button>
  )}
</div>
```

- [ ] **Step 2: Adicionar trava de segurança no `handleConfirmarExclusao`**

Em `handleConfirmarExclusao`, caso `profParaExcluir === profile?.id`:
```javascript
if (profParaExcluir === profile?.id) {
  alert("Você não pode excluir o seu próprio usuário administrador.");
  setModalExcluirAberto(false);
  setProfParaExcluir(null);
  return;
}
```

- [ ] **Step 3: Testar na tela de Equipe**

Acessar `/equipe` com usuário admin logado e validar que o botão de exclusão não aparece no seu próprio card, e que tentar excluir outro admin/membro funciona normalmente.

- [ ] **Step 4: Commit das alterações**

```bash
git add src/pages/Equipe/Equipe.jsx
git commit -m "fix(equipe): impedir que o administrador logado exclua o próprio perfil"
```

---

### Task 7: [Verificação Final] Build e Testes de Regressão

**Files:**
- Check: Todas as rotas alteradas (`/servicos`, `/clientes`, `/agenda`, `/produtos`, `/financeiro`, `/equipe`)

- [ ] **Step 1: Rodar build do Vite**

```bash
npm run build
```
Esperado: Compilação limpa sem erros de CSS ou JS.

- [ ] **Step 2: Verificação visual no Playwright/navegador**

Acessar cada rota modificada para atestar alinhamentos, paddings e interações.

- [ ] **Step 3: Commit final se houver ajustes residuais**
