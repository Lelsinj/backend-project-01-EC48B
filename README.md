# Projeto 2 — EC48B Programação Web Back-End
## Streaming de Vídeos (YouTube) — API REST com Express.js

**Disciplina:** EC48B-C71 — Programação Web Back-End  
**Professores:** Prof. Monique Emídio de Oliveira | Prof. Willian Massami Watanabe

---

## Descrição

Aplicação web back-end desenvolvida com **Express.js**, utilizando as classes (módulos) implementadas no Projeto 1. Implementa as regras de negócio de uma plataforma de streaming de vídeos, com:

- Rotas REST para todos os recursos (usuários, vídeos, playlists, favoritos)
- Recebimento de parâmetros via GET (query string) e POST (body JSON)
- Sessões com `express-session` + `connect-mongo` para autenticar usuários
- Validação de campos obrigatórios com mensagens de erro claras
- Retorno de dados no formato **JSON**

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) e Docker Compose (para o MongoDB)

---

## Instalação e execução

### 1. Suba o banco de dados MongoDB

```bash
docker-compose up -d
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o servidor

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start
```

O servidor estará disponível em: **http://localhost:3000**

---

## Endpoints da API

> Acesse `GET /` para ver a lista completa de endpoints.

### Autenticação (`/auth`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/auth/register` | Cadastrar novo usuário | ❌ Não requer |
| POST | `/auth/login` | Fazer login (cria sessão) | ❌ Não requer |
| POST | `/auth/logout` | Fazer logout (encerra sessão) | ✅ Requer |
| GET | `/auth/me` | Dados do usuário logado | ✅ Requer |

### Usuários (`/users`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/users` | Listar todos os usuários | ✅ Requer |
| GET | `/users/profile` | Ver meu perfil | ✅ Requer |
| GET | `/users/:id` | Buscar usuário por ID | ✅ Requer |
| PUT | `/users/:id` | Atualizar perfil (somente o próprio) | ✅ Requer |
| DELETE | `/users/:id` | Excluir conta (somente o próprio) | ✅ Requer |

### Vídeos (`/videos`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/videos` | Listar vídeos (filtrável por `?category=` e `?userId=`) | ❌ Público |
| GET | `/videos/:id` | Buscar vídeo por ID | ❌ Público |
| POST | `/videos` | Cadastrar vídeo | ✅ Requer |
| PUT | `/videos/:id` | Atualizar vídeo (somente o dono) | ✅ Requer |
| PATCH | `/videos/:id/like` | Curtir vídeo | ✅ Requer |
| PATCH | `/videos/:id/dislike` | Descurtir vídeo | ✅ Requer |
| DELETE | `/videos/:id` | Excluir vídeo (somente o dono) | ✅ Requer |

### Playlists (`/playlists`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/playlists` | Listar minhas playlists | ✅ Requer |
| GET | `/playlists/:id` | Buscar playlist por ID | ✅ Requer |
| POST | `/playlists` | Criar playlist | ✅ Requer |
| PUT | `/playlists/:id` | Renomear playlist | ✅ Requer |
| POST | `/playlists/:id/videos` | Adicionar vídeo à playlist | ✅ Requer |
| DELETE | `/playlists/:id/videos` | Remover vídeo da playlist | ✅ Requer |
| DELETE | `/playlists/:id` | Excluir playlist | ✅ Requer |

### Favoritos (`/favorites`)

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/favorites` | Listar meus favoritos | ✅ Requer |
| POST | `/favorites` | Adicionar vídeo aos favoritos | ✅ Requer |
| DELETE | `/favorites/:videoId` | Remover vídeo dos favoritos | ✅ Requer |

---

## Exemplos de uso (com curl)

### Cadastrar usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","email":"joao@email.com","password":"senha123","age":25}'
```

### Login
```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"senha123"}'
```

### Listar vídeos (público)
```bash
curl http://localhost:3000/videos
```

### Cadastrar vídeo (autenticado)
```bash
curl -b cookies.txt -X POST http://localhost:3000/videos \
  -H "Content-Type: application/json" \
  -d '{"name":"Meu Vídeo","url":"https://exemplo.com/video.mp4","category":"Tecnologia","duration":300}'
```

### Criar playlist (autenticado)
```bash
curl -b cookies.txt -X POST http://localhost:3000/playlists \
  -H "Content-Type: application/json" \
  -d '{"name":"Minha Playlist"}'
```

### Adicionar favorito (autenticado)
```bash
curl -b cookies.txt -X POST http://localhost:3000/favorites \
  -H "Content-Type: application/json" \
  -d '{"videoId":"<id-do-video>"}'
```

---

## Mensagens de erro

Todos os erros retornam JSON com a chave `error`:

```json
{ "error": "Campo obrigatório ausente: email" }
```

Códigos HTTP utilizados:

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Campos inválidos ou ausentes |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Recurso não encontrado |
| 409 | Conflito (ex: email já cadastrado) |
| 500 | Erro interno do servidor |

---

## Tecnologias utilizadas

- **Node.js** + **Express.js** — Framework web
- **MongoDB** — Banco de dados (via driver oficial)
- **express-session** + **connect-mongo** — Gerenciamento de sessões
- **bcrypt** — Hash de senhas
- **uuid** — Geração de IDs únicos
- **dotenv** — Variáveis de ambiente
- **nodemon** — Hot-reload em desenvolvimento

---

## Estrutura do projeto

```
projeto2/
├── src/
│   ├── app.js                    # Ponto de entrada — Express e rotas
│   ├── login.js                  # Lógica de autenticação (Projeto 1)
│   ├── db/
│   │   └── connect.js            # Conexão com MongoDB
│   ├── middleware/
│   │   └── auth.js               # Middleware de verificação de sessão
│   ├── routes/
│   │   ├── auth.routes.js        # Rotas de autenticação
│   │   ├── users.routes.js       # Rotas de usuários
│   │   ├── videos.routes.js      # Rotas de vídeos
│   │   ├── playlists.routes.js   # Rotas de playlists
│   │   └── favorites.routes.js   # Rotas de favoritos
│   ├── users/                    # CRUD de usuários (Projeto 1)
│   ├── videos/                   # CRUD de vídeos (Projeto 1)
│   ├── playlists/                # CRUD de playlists (Projeto 1)
│   ├── favorites/                # CRUD de favoritos (Projeto 1)
│   ├── validators/               # Validadores (Projeto 1)
│   └── logger/                   # Logger (Projeto 1)
├── .env                          # Variáveis de ambiente
├── .env.example                  # Exemplo de configuração
├── docker-compose.yml            # MongoDB via Docker
└── package.json
```
