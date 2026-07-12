# Guia do Usuário — BarFlow

Como usar o sistema no dia a dia. (Para instalar/Subir o sistema, veja `DEPLOY.md`.)

Acesse o endereço do site no navegador e entre com seu e-mail e senha.

```
Login de demonstração: dono@barflow.dev / SenhaForte@123
```

---

## Visão geral

O BarFlow tem 3 telas principais, no menu à esquerda:

1. **Dashboard** — números do negócio (faturamento, lucro, estoque baixo).
2. **Produtos** — seu estoque e cardápio (bebidas, insumos, ingredientes).
3. **Receitas** — pratos/drinks e o custo de cada um.

> Observação: nesta versão, o cadastro de produtos, receitas e vendas é feito
> pela API/integração. A tela web hoje **consulta** esses dados (visualiza
> custos, estoque e indicadores). O cadastro pelo próprio site entra no
> próximo módulo.

---

## Dashboard

Ao entrar, você vê os indicadores do mês:

- **Faturamento (mês)** — total de vendas no mês.
- **Lucro (mês)** — faturamento menos o custo dos produtos vendidos.
- **Ticket médio** — valor médio de cada venda.
- **Estoque baixo** — quantos produtos estão abaixo do mínimo configurado.

Embaixo:
- **Gráfico de faturamento** dos últimos 14 dias.
- **Produtos mais vendidos** (mês).
- **Top funcionários** por valor de vendas (mês).

---

## Produtos

Lista de tudo que está no seu estoque:

- Busque pelo nome ou código no campo no topo.
- Coluna **Estoque** mostra a quantidade atual; se estiver com pouco, aparece
  o selo **baixo** (vermelho) — sinal de comprar mais.
- **Custo** é quanto você paga; **Preço** é quanto vende.

---

## Receitas

Aqui você vê o custo real de cada drink/prato:

1. Clique em uma receita à esquerda.
2. À direita aparece:
   - **Custo total** — quanto custa produzir uma porção.
   - **Preço venda** — por quanto você vende.
   - **Lucro** e **Margem** — quanto sobra e a porcentagem de lucro.
   - **Insumos** — cada ingrediente e quanto custa na receita.

Use a margem para precificar: se estiver negativa (vermelho), o preço de venda
está abaixo do custo — aumente o preço ou reduza o desperdício.

---

## Segurança da conta

- Não compartilhe sua senha.
- Use "Sair" (canto inferior esquerdo) ao terminar, principalmente em computador
  compartilhado.
- Troque a senha periodicamente.

---

## Dúvidas / problemas

- Site não abre: confirme com quem hospeda se o sistema está rodando.
- Não consegue entrar: verifique e-mail/senha; peça ao administrador para
  redefinir.
- Dado errado (preço, estoque): avise quem administra o cadastro.
