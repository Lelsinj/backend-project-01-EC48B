import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import videosRoutes from './routes/videos.routes.js';
import playlistsRoutes from './routes/playlists.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globais ───────────────────────────────────────────────────────

// Parse de JSON no body das requisições
app.use(express.json());

// Parse de form-data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// ─── Sessões ──────────────────────────────────────────────────────────────────

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'segredo_padrao_projeto2',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.MONGO_DB_NAME,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24, // 1 dia em segundos
    }),
    cookie: {
      httpOnly: true,
      secure: false,          // Mude para true em produção com HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 dia em ms
    },
  })
);

// ─── Rotas ────────────────────────────────────────────────────────────────────

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.use('/videos', videosRoutes);
app.use('/playlists', playlistsRoutes);
app.use('/favorites', favoritesRoutes);

// Rota raiz — informações da API
app.get('/', (req, res) => {
  res.json({
    app: 'EC48B — Streaming de Vídeos (Projeto 2)',
    versao: '1.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Cadastrar usuário',
        'POST /auth/login': 'Fazer login',
        'POST /auth/logout': 'Fazer logout',
        'GET /auth/me': 'Dados da sessão atual',
      },
      users: {
        'GET /users': 'Listar usuários (autenticado)',
        'GET /users/profile': 'Meu perfil (autenticado)',
        'GET /users/:id': 'Buscar usuário por ID (autenticado)',
        'PUT /users/:id': 'Atualizar perfil (autenticado, somente o próprio)',
        'DELETE /users/:id': 'Excluir conta (autenticado, somente o próprio)',
      },
      videos: {
        'GET /videos': 'Listar vídeos (público)',
        'GET /videos/:id': 'Buscar vídeo por ID (público)',
        'POST /videos': 'Cadastrar vídeo (autenticado)',
        'PUT /videos/:id': 'Atualizar vídeo (autenticado)',
        'PATCH /videos/:id/like': 'Curtir vídeo (autenticado)',
        'PATCH /videos/:id/dislike': 'Descurtir vídeo (autenticado)',
        'DELETE /videos/:id': 'Excluir vídeo (autenticado, somente o dono)',
      },
      playlists: {
        'GET /playlists': 'Listar minhas playlists (autenticado)',
        'GET /playlists/:id': 'Buscar playlist por ID (autenticado)',
        'POST /playlists': 'Criar playlist (autenticado)',
        'PUT /playlists/:id': 'Renomear playlist (autenticado)',
        'POST /playlists/:id/videos': 'Adicionar vídeo à playlist (autenticado)',
        'DELETE /playlists/:id/videos': 'Remover vídeo da playlist (autenticado)',
        'DELETE /playlists/:id': 'Excluir playlist (autenticado)',
      },
      favorites: {
        'GET /favorites': 'Listar favoritos (autenticado)',
        'POST /favorites': 'Adicionar favorito (autenticado)',
        'DELETE /favorites/:videoId': 'Remover favorito (autenticado)',
      },
    },
  });
});

// ─── Tratamento de erros 404 ──────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// ─── Tratamento global de erros ───────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('[ERRO GLOBAL]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ─── Inicialização ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`   Acesse / para ver todos os endpoints disponíveis.\n`);
});

export default app;
