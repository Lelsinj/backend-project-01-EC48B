import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import insertPlaylist from '../playlists/insert-playlist.js';
import findPlaylists from '../playlists/find-playlist.js';
import findOnePlaylist from '../playlists/find-one-playlist.js';
import updatePlaylist from '../playlists/update-playlist.js';
import deletePlaylist from '../playlists/delete-playlist.js';

const router = Router();

// Todas as rotas de playlist exigem autenticação
router.use(requireAuth);

/**
 * GET /playlists
 * Lista as playlists do usuário logado.
 */
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  try {
    const playlists = await findPlaylists({ userId });
    return res.status(200).json(playlists);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar playlists.' });
  }
});

/**
 * GET /playlists/:id
 * Retorna uma playlist pelo ID.
 * Apenas o dono pode visualizar.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const playlist = await findOnePlaylist(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Acesso negado a esta playlist.' });
    }
    return res.status(200).json(playlist);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar playlist.' });
  }
});

/**
 * POST /playlists
 * Cria uma nova playlist.
 * Body: { name }
 */
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = req.session.userId;

  if (!name) return res.status(400).json({ error: 'Campo obrigatório ausente: name' });

  try {
    const result = await insertPlaylist({ userId, name });
    return res.status(201).json({
      message: 'Playlist criada com sucesso.',
      playlistId: result.insertedId,
    });
  } catch (err) {
    if (err.message.includes('obrigatório')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao criar playlist.' });
  }
});

/**
 * PUT /playlists/:id
 * Atualiza o nome da playlist.
 * Body: { name }
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  const dto = { ...req.body };
  if (!dto || Object.keys(dto).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar foi enviado.' });
  }

  // Remove campos de vídeo — use os endpoints específicos
  delete dto.adicionarVideo;
  delete dto.removerVideo;

  if (!dto.name) {
    return res.status(400).json({ error: 'Campo obrigatório ausente: name' });
  }

  try {
    const playlist = await findOnePlaylist(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta playlist.' });
    }

    await updatePlaylist(id, dto);
    return res.status(200).json({ message: 'Playlist atualizada com sucesso.' });
  } catch (err) {
    if (err.message.includes('obrigatório')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao atualizar playlist.' });
  }
});

/**
 * POST /playlists/:id/videos
 * Adiciona um vídeo à playlist.
 * Body: { videoId }
 */
router.post('/:id/videos', async (req, res) => {
  const { id } = req.params;
  const { videoId } = req.body;
  const userId = req.session.userId;

  if (!videoId) return res.status(400).json({ error: 'Campo obrigatório ausente: videoId' });

  try {
    const playlist = await findOnePlaylist(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta playlist.' });
    }

    await updatePlaylist(id, { adicionarVideo: videoId });
    return res.status(200).json({ message: 'Vídeo adicionado à playlist com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao adicionar vídeo à playlist.' });
  }
});

/**
 * DELETE /playlists/:id/videos
 * Remove um vídeo da playlist.
 * Body: { videoId }
 */
router.delete('/:id/videos', async (req, res) => {
  const { id } = req.params;
  const { videoId } = req.body;
  const userId = req.session.userId;

  if (!videoId) return res.status(400).json({ error: 'Campo obrigatório ausente: videoId' });

  try {
    const playlist = await findOnePlaylist(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta playlist.' });
    }

    await updatePlaylist(id, { removerVideo: videoId });
    return res.status(200).json({ message: 'Vídeo removido da playlist com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover vídeo da playlist.' });
  }
});

/**
 * DELETE /playlists/:id
 * Exclui uma playlist. Apenas o dono pode excluir.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const playlist = await findOnePlaylist(id);
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada.' });
    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir esta playlist.' });
    }

    await deletePlaylist(id);
    return res.status(200).json({ message: 'Playlist excluída com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir playlist.' });
  }
});

export default router;
