import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import findOneUser from '../users/find-one-user.js';
import findUsers from '../users/find-user.js';
import updateUser from '../users/update-user.js';
import deleteUser from '../users/delete-user.js';

const router = Router();

// Todas as rotas de usuário exigem autenticação
router.use(requireAuth);

/**
 * GET /users
 * Lista todos os usuários (sem senha).
 */
router.get('/', async (req, res) => {
  try {
    const users = await findUsers();
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

/**
 * GET /users/profile
 * Retorna o perfil do usuário autenticado.
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await findOneUser(req.session.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

/**
 * GET /users/:id
 * Retorna um usuário pelo ID.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await findOneUser(id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

/**
 * PUT /users/:id
 * Atualiza dados do usuário.
 * Usuário só pode editar o próprio perfil.
 * Body: { name?, email?, password?, age? }
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;

  // Garante que o usuário só edite o próprio perfil
  if (id !== req.session.userId) {
    return res.status(403).json({ error: 'Você não tem permissão para editar este perfil.' });
  }

  const dto = req.body;
  if (!dto || Object.keys(dto).length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar foi enviado.' });
  }

  // Converte age para número se enviado
  if (dto.age !== undefined) dto.age = Number(dto.age);

  try {
    const result = await updateUser(id, dto);
    if (!result) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // Atualiza nome na sessão se foi alterado
    if (dto.name) req.session.userName = dto.name;
    if (dto.email) req.session.userEmail = dto.email;

    return res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
  } catch (err) {
    if (err.message.includes('inválid') || err.message.includes('obrigatório')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

/**
 * DELETE /users/:id
 * Remove o usuário.
 * Usuário só pode excluir a própria conta.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (id !== req.session.userId) {
    return res.status(403).json({ error: 'Você não tem permissão para excluir este usuário.' });
  }

  try {
    const result = await deleteUser(id);
    if (!result) return res.status(404).json({ error: 'Usuário não encontrado.' });

    // Encerra a sessão após excluir conta
    req.session.destroy(() => {});
    return res.status(200).json({ message: 'Conta excluída com sucesso.' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

export default router;
