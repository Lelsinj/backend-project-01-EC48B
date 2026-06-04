import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import insertFavorite from '../favorites/insert-favorite.js';
import findFavorites from '../favorites/find-favorite.js';
import deleteFavorite from '../favorites/delete-favorite.js';

const router = Router();

// Todas as rotas de favoritos exigem autenticação
router.use(requireAuth);

/**
 * GET /favorites
 * Lista os favoritos do usuário logado.
 */
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  try {
    const favorites = await findFavorites(userId);
    return res.status(200).json(favorites);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar favoritos.' });
  }
});

/**
 * POST /favorites
 * Adiciona um vídeo aos favoritos do usuário logado.
 * Body: { videoId }
 */
router.post('/', async (req, res) => {
  const { videoId } = req.body;
  const userId = req.session.userId;

  if (!videoId) return res.status(400).json({ error: 'Campo obrigatório ausente: videoId' });

  try {
    const result = await insertFavorite({ userId, videoId });
    if (!result) {
      return res.status(409).json({ error: 'Vídeo já está nos favoritos.' });
    }
    return res.status(201).json({ message: 'Vídeo adicionado aos favoritos com sucesso.' });
  } catch (err) {
    if (err.message.includes('obrigatório')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao adicionar favorito.' });
  }
});

/**
 * DELETE /favorites/:videoId
 * Remove um vídeo dos favoritos do usuário logado.
 */
router.delete('/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const userId = req.session.userId;

  try {
    const result = await deleteFavorite({ userId, videoId });
    if (!result) return res.status(404).json({ error: 'Favorito não encontrado.' });
    return res.status(200).json({ message: 'Vídeo removido dos favoritos com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
});

export default router;
