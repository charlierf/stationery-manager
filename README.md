# Papelaria Controle

Sistema de controle para papelaria, desenvolvido em React com Vite, TailwindCSS e backend Node.js (Express) com Supabase.

## Funcionalidades

- **Autenticação**: Login e cadastro de usuários
- **Gerenciamento de Insumos**: Adicione, edite e remova insumos do estoque
- **Gerenciamento de Produtos**: Crie produtos a partir de insumos, defina preço de venda e margem
- **Gestão de Vendas**: Realize vendas, controle estoque automaticamente e visualize histórico
- **Notificações**: Toasts para feedback de ações
- **Interface Moderna**: Utiliza Radix UI, TailwindCSS e componentes customizados
- **API RESTful**: Backend Express integrado ao Supabase
- **Pronto para Docker**: Deploy facilitado com Docker e Docker Compose

## Instalação

### Usando Docker (recomendado)

1. Certifique-se de ter o [Docker](https://www.docker.com/) instalado.
2. Na raiz do projeto, execute:
   ```sh
   docker-compose up --build
   ```
3. O frontend estará disponível em [http://localhost:5173](http://localhost:5173)
   e a API em [http://localhost:3000](http://localhost:3000)

### Instalação manual (sem Docker)

1. Clone o repositório:
   ```sh
   git clone <url-do-repo>
   cd paper-store-management-system
   ```
2. Instale as dependências:
   ```sh
   npm install
   cd api && npm install && cd ..
   ```
3. Rode o backend:
   ```sh
   cd api
   node index.js
   ```
4. Em outro terminal, rode o frontend:
   ```sh
   npm run dev
   ```
5. Acesse em [http://localhost:5173](http://localhost:5173)

## Scripts

- `npm run dev` — inicia o servidor de desenvolvimento do frontend
- `npm run build` — gera build de produção do frontend
- `npm run preview` — pré-visualiza o build do frontend

## Estrutura de Pastas

Veja a estrutura principal do projeto:
```
index.html
package.json
src/
  App.jsx
  main.jsx
  components/
    managers/
    ui/
  contexts/
  lib/
  pages/
api/
  index.js
  package.json
public/
```

## Tecnologias

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [date-fns](https://date-fns.org/)
- [Supabase](https://supabase.com/)
- [Docker](https://www.docker.com/)

## Licença

MIT

---

> Desenvolvido para controle de estoque e vendas em papelarias.