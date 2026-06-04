/**
 * Middleware de autenticação.
 * Garante que apenas usuários logados acessem rotas protegidas.
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Não autorizado. Faça login para continuar.',
    });
  }
  next();
}
