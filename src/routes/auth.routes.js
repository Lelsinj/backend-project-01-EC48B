import { Router } from 'express';
import insertUser from '../users/insert-user.js';
import loginFn from '../login/login.js';

const router = Router();

/**
 * POST /auth/register
 * Cadastra um novo usuário.
 * Body: { name, email, password, age }
 */
router.post('/register', async (req, res) => {
  const { name, email, password, age } = req.body;

  // Validação de campos obrigatórios
  if (!name) return res.status(400).json({ error: 'Campo obrigatório ausente: name' });
  if (!email) return res.status(400).json({ error: 'Campo obrigatório ausente: email' });
  if (!password) return res.status(400).json({ error: 'Campo obrigatório ausente: password' });
  if (age === undefined || age === null || age === '')
    return res.status(400).json({ error: 'Campo obrigatório ausente: age' });

  try {
    const result = await insertUser({ name, email, password, age: Number(age) });
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      userId: result.insertedId,
    });
  } catch (err) {
    if (err.message.includes('Email já cadastrado')) {
      return res.status(409).json({ error: err.message });
    }
    if (
      err.message.includes('inválid') ||
      err.message.includes('obrigatório') ||
      err.message.includes('Idade')
    ) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/**
 * POST /auth/login
 * Autentica o usuário e cria uma sessão.
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ error: 'Campo obrigatório ausente: email' });
  if (!password) return res.status(400).json({ error: 'Campo obrigatório ausente: password' });

  try {
    const user = await loginFn({ email, password });

    // Cria a sessão do usuário
    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    return res.status(200).json({
      message: `Bem-vindo, ${user.name}!`,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (
      err.message.includes('Email ou senha inválidos') ||
      err.message.includes('inválid') ||
      err.message.includes('obrigatório')
    ) {
      return res.status(401).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

/**
 * POST /auth/logout
 * Encerra a sessão do usuário.
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao encerrar sessão.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logout realizado com sucesso.' });
  });
});

/**
 * GET /auth/me
 * Retorna os dados da sessão atual (usuário logado).
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Nenhuma sessão ativa.' });
  }
  return res.status(200).json({
    userId: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail,
  });
});

export default router;
