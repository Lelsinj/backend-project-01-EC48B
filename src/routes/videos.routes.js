import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import insertVideo from '../videos/insert-video.js';
import findVideos from '../videos/find-video.js';
import findOneVideo from '../videos/find-one-video.js';
import updateVideo from '../videos/update-video.js';
import deleteVideo from '../videos/delete-video.js';

const router = Router();

/**
 * GET /videos
 * Lista todos os vídeos. Suporta filtro por categoria: ?category=...
 * Rota pública (não exige login para visualizar).
 */
router.get('/', async (req, res) => {
  const { category, userId } = req.query;
  const filtro = {};
  if (category) filtro.category = category;
  if (userId) filtro.userId = userId;

  try {
    const videos = await findVideos(filtro);
    return res.status(200).json(videos);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar vídeos.' });
  }
});

/**
 * GET /videos/:id
 * Retorna um vídeo pelo ID.
 * Rota pública.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const video = await findOneVideo(id);
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });
    return res.status(200).json(video);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar vídeo.' });
  }
});

// A partir daqui, todas as rotas exigem autenticação
router.use(requireAuth);

/**
 * POST /videos
 * Cadastra um novo vídeo.
 * Body: { name, url, category, duration }
 */
router.post('/', async (req, res) => {
  const { name, url, category, duration } = req.body;
  const userId = req.session.userId;

  // Validação de campos obrigatórios
  if (!name) return res.status(400).json({ error: 'Campo obrigatório ausente: name' });
  if (!url) return res.status(400).json({ error: 'Campo obrigatório ausente: url' });
  if (!category) return res.status(400).json({ error: 'Campo obrigatório ausente: category' });
  if (duration === undefined || duration === null || duration === '')
    return res.status(400).json({ error: 'Campo obrigatório ausente: duration' });

  try {
    const result = await insertVideo({
      name,
      url,
      category,
      duration: Number(duration),
      userId,
    });
    return res.status(201).json({
      message: 'Vídeo cadastrado com sucesso.',
      videoId: result.insertedId,
    });
  } catch (err) {
    if (err.message.includes('inválid') || err.message.includes('obrigatório')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao cadastrar vídeo.' });
  }
});

/**
 * PUT /videos/:id
 * Atualiza um vídeo existente.
 * Somente o dono do vídeo pode editar.
 * Body: { name?, url?, category?, duration?, like?, dislike? }
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  const dto = { ...req.body };
  if (!dto || Object.keys(dto).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar foi enviado.' });
  }

  if (dto.duration !== undefined) dto.duration = Number(dto.duration);

  try {
    // Verifica se o vídeo existe e pertence ao usuário
    const video = await findOneVideo(id);
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

    // like e dislike podem ser feitos por qualquer usuário logado
    // edição de dados do vídeo é restrita ao dono
    const isOwner = video.userId === userId;
    const hasNonReactionFields = Object.keys(dto).some(
      (k) => k !== 'like' && k !== 'dislike'
    );
    if (hasNonReactionFields && !isOwner) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar este vídeo.',
      });
    }

    const result = await updateVideo(id, dto);
    if (!result) return res.status(404).json({ error: 'Vídeo não encontrado.' });
    return res.status(200).json({ message: 'Vídeo atualizado com sucesso.' });
  } catch (err) {
    if (err.message.includes('inválid') || err.message.includes('obrigatório')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao atualizar vídeo.' });
  }
});

/**
 * PATCH /videos/:id/like
 * Adiciona um like ao vídeo.
 */
router.patch('/:id/like', async (req, res) => {
  const { id } = req.params;
  try {
    const video = await findOneVideo(id);
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

    await updateVideo(id, { like: true });
    return res.status(200).json({ message: 'Like registrado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao registrar like.' });
  }
});

/**
 * PATCH /videos/:id/dislike
 * Adiciona um dislike ao vídeo.
 */
router.patch('/:id/dislike', async (req, res) => {
  const { id } = req.params;
  try {
    const video = await findOneVideo(id);
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });

    await updateVideo(id, { dislike: true });
    return res.status(200).json({ message: 'Dislike registrado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao registrar dislike.' });
  }
});

/**
 * DELETE /videos/:id
 * Remove um vídeo. Apenas o dono pode excluir.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  try {
    const video = await findOneVideo(id);
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado.' });
    if (video.userId !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para excluir este vídeo.',
      });
    }

    await deleteVideo(id);
    return res.status(200).json({ message: 'Vídeo excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir vídeo.' });
  }
});

export default router;
