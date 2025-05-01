require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173', // Local development
  'https://papelaria.nebulaweb.com.br' // Deployed frontend
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Ensure POST is allowed
  allowedHeaders: 'Content-Type,Authorization', // Allow necessary headers
  credentials: false // Keep as false if not using cookies/sessions across domains
}));

// Inicializa o cliente Supabase usando variáveis de ambiente
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/', (req, res) => {
  res.json({ message: 'API está rodando!' });
});

// Middleware para proteger rotas com JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Rota de login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN] Tentativa de login para:`, email);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    console.log(`[LOGIN] Falha para:`, email, error?.message);
    return res.status(401).json({ error: error?.message || 'Credenciais inválidas' });
  }
  const accessToken = jwt.sign({ id: data.user.id, email: data.user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: data.user.id, email: data.user.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  console.log(`[LOGIN] Sucesso para:`, email);
  res.json({ accessToken, refreshToken, user: { id: data.user.id, email: data.user.email } });
});

// Rota de cadastro
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[SIGNUP] Tentativa de cadastro para:`, email);
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error || !data.user) {
    console.log(`[SIGNUP] Falha para:`, email, error?.message);
    return res.status(400).json({ error: error?.message || 'Erro ao cadastrar' });
  }
  const accessToken = jwt.sign({ id: data.user.id, email: data.user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: data.user.id, email: data.user.email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  console.log(`[SIGNUP] Sucesso para:`, email);
  res.status(201).json({ accessToken, refreshToken, user: { id: data.user.id, email: data.user.email } });
});

// Rota de refresh token
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  console.log(`[REFRESH] Tentativa de refresh`);
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token não fornecido' });
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      console.log(`[REFRESH] Falha: refresh token inválido`);
      return res.status(403).json({ error: 'Refresh token inválido' });
    }
    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    console.log(`[REFRESH] Sucesso para:`, user.email);
    res.json({ accessToken });
  });
});

// --- ROTAS INSUMOS ---
app.get('/insumos', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('insumos').select('*').eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/insumos', authenticateToken, async (req, res) => {
  const { nome, quantidade, valor_unitario } = req.body;
  const { data, error } = await supabase.from('insumos').insert([{ nome, quantidade, valor_unitario, user_id: req.user.id }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/insumos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nome, quantidade, valor_unitario } = req.body;
  const { data, error } = await supabase.from('insumos').update({ nome, quantidade, valor_unitario }).eq('id', id).eq('user_id', req.user.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/insumos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('insumos').delete().eq('id', id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// --- NOVAS ROTAS PRODUTOS COM RELAÇÃO INSUMOS ---
app.get('/produtos', authenticateToken, async (req, res) => {
  // Busca produtos do usuário
  const { data: produtos, error: prodError } = await supabase.from('produtos').select('*').eq('user_id', req.user.id);
  if (prodError) return res.status(500).json({ error: prodError.message });
  // Para cada produto, busca os insumos relacionados
  const produtosComInsumos = await Promise.all(produtos.map(async (produto) => {
    const { data: rels, error: relError } = await supabase
      .from('produto_insumo')
      .select('id, quantidade, insumo:insumo_id (id, nome, valor_unitario)')
      .eq('produto_id', produto.id);
    if (relError) return { ...produto, insumos: [] };
    // Formata insumos
    const insumos = rels.map(rel => ({
      id: rel.insumo.id,
      nome: rel.insumo.nome,
      valor_unitario: rel.insumo.valor_unitario,
      quantidade: rel.quantidade,
      rel_id: rel.id
    }));
    return { ...produto, insumos };
  }));
  res.json(produtosComInsumos);
});

app.post('/produtos', authenticateToken, async (req, res) => {
  const { nome, preco_venda, custo_total, insumos } = req.body;
  // Cria produto
  const { data: prodData, error: prodError } = await supabase.from('produtos').insert([
    { nome, preco_venda, custo_total, user_id: req.user.id }
  ]).select();
  if (prodError) return res.status(500).json({ error: prodError.message });
  const produto = prodData[0];
  // Cria relações produto_insumo
  if (Array.isArray(insumos)) {
    for (const insumo of insumos) {
      await supabase.from('produto_insumo').insert({
        produto_id: produto.id,
        insumo_id: insumo.id,
        quantidade: insumo.quantidade
      });
    }
  }
  res.status(201).json(produto);
});

app.put('/produtos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { nome, preco_venda, custo_total, insumos } = req.body;
  // Atualiza produto
  const { data: prodData, error: prodError } = await supabase.from('produtos')
    .update({ nome, preco_venda, custo_total })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();
  if (prodError) return res.status(500).json({ error: prodError.message });
  // Remove relações antigas
  await supabase.from('produto_insumo').delete().eq('produto_id', id);
  // Cria novas relações
  if (Array.isArray(insumos)) {
    for (const insumo of insumos) {
      await supabase.from('produto_insumo').insert({
        produto_id: id,
        insumo_id: insumo.id,
        quantidade: insumo.quantidade
      });
    }
  }
  res.json(prodData[0]);
});

app.delete('/produtos/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Verify the product belongs to the user before doing anything
    const { data: productData, error: productError } = await supabase
      .from('produtos')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single(); // Use single to get one record or null

    if (productError || !productData) {
      // Handle cases where the product doesn't exist or doesn't belong to the user
      console.error(`[DELETE /produtos/${id}] Produto não encontrado ou não pertence ao usuário ${userId}. Erro:`, productError?.message);
      return res.status(404).json({ error: 'Produto não encontrado ou acesso negado.' });
    }

    // 2. Delete related entries from produto_insumo first
    console.log(`[DELETE /produtos/${id}] Deletando relações de produto_insumo para produto ${id}`);
    const { error: deleteRelError } = await supabase
      .from('produto_insumo')
      .delete()
      .eq('produto_id', id);

    if (deleteRelError) {
      // If deleting relations fails, stop and report error
      console.error(`[DELETE /produtos/${id}] Erro ao deletar relações de produto_insumo:`, deleteRelError.message);
      return res.status(500).json({ error: `Erro ao remover associações do produto: ${deleteRelError.message}` });
    }
    console.log(`[DELETE /produtos/${id}] Relações de produto_insumo deletadas com sucesso.`);

    // 3. Now delete the product itself
    console.log(`[DELETE /produtos/${id}] Deletando produto ${id}`);
    const { error: deleteProdError } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Redundant check, but safe

    if (deleteProdError) {
      // If deleting the product fails (unexpected after checks)
      console.error(`[DELETE /produtos/${id}] Erro ao deletar produto:`, deleteProdError.message);
      return res.status(500).json({ error: `Erro ao remover o produto: ${deleteProdError.message}` });
    }

    console.log(`[DELETE /produtos/${id}] Produto ${id} deletado com sucesso.`);
    // Send 204 No Content on successful deletion
    res.status(204).send();

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error(`[DELETE /produtos/${id}] Erro inesperado:`, error);
    res.status(500).json({ error: 'Erro interno no servidor ao tentar remover o produto.' });
  }
});

// --- NOVAS ROTAS VENDAS COM RELAÇÃO PRODUTOS ---
app.get('/vendas', authenticateToken, async (req, res) => {
  // Busca vendas do usuário
  const { data: vendas, error: vendaError } = await supabase.from('vendas').select('*').eq('user_id', req.user.id);
  if (vendaError) return res.status(500).json({ error: vendaError.message });
  // Para cada venda, busca os produtos relacionados
  const vendasComProdutos = await Promise.all(vendas.map(async (venda) => {
    const { data: rels, error: relError } = await supabase
      .from('venda_produto')
      .select('id, quantidade, produto:produto_id (id, nome, preco_venda)')
      .eq('venda_id', venda.id);
    if (relError) return { ...venda, produtos: [] };
    // Formata produtos
    const produtos = rels.map(rel => ({
      id: rel.produto.id,
      nome: rel.produto.nome,
      preco_venda: rel.produto.preco_venda,
      quantidade: rel.quantidade,
      rel_id: rel.id
    }));
    return { ...venda, produtos };
  }));
  res.json(vendasComProdutos);
});

app.post('/vendas', authenticateToken, async (req, res) => {
  const { produtos, total, data: dataVenda } = req.body;
  // Cria venda (NÃO inclui produtos no insert)
  const { data: vendaData, error: vendaError } = await supabase.from('vendas').insert([
    { total, data: dataVenda, user_id: req.user.id }
  ]).select();
  if (vendaError) return res.status(500).json({ error: vendaError.message });
  const venda = vendaData[0];
  // Cria relações venda_produto
  if (Array.isArray(produtos)) {
    for (const produto of produtos) {
      const { data: vpData, error: vpError } = await supabase.from('venda_produto').insert({
        venda_id: venda.id,
        produto_id: produto.id,
        quantidade: produto.quantidade,
        preco_unitario: produto.preco_unitario || produto.preco_venda || 0
      });
      if (vpError) {
        console.error('Erro ao inserir em venda_produto:', vpError.message);
      } else {
        console.log('Venda_produto inserido:', vpData);
      }
      // Busca insumos do produto
      const { data: insumosProd } = await supabase
        .from('produto_insumo')
        .select('insumo_id, quantidade')
        .eq('produto_id', produto.id);
      for (const insumoRel of insumosProd || []) {
        const quantidadeTotal = (insumoRel.quantidade || 0) * (produto.quantidade || 0);
        const { data: insumoAtualArr } = await supabase
          .from('insumos')
          .select('quantidade')
          .eq('id', insumoRel.insumo_id)
          .eq('user_id', req.user.id);
        const insumoAtual = insumoAtualArr && insumoAtualArr[0];
        if (insumoAtual) {
          const novaQuantidade = Math.max(0, (insumoAtual.quantidade || 0) - quantidadeTotal);
          await supabase.from('insumos').update({ quantidade: novaQuantidade }).eq('id', insumoRel.insumo_id).eq('user_id', req.user.id);
        }
      }
    }
  }
  res.status(201).json(venda);
});

app.put('/vendas/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { produtos, total, data: dataVenda } = req.body;
  // Atualiza venda
  const { data: vendaData, error: vendaError } = await supabase.from('vendas')
    .update({ total, data: dataVenda })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();
  if (vendaError) return res.status(500).json({ error: vendaError.message });
  // Remove relações antigas
  await supabase.from('venda_produto').delete().eq('venda_id', id);
  // Cria novas relações
  if (Array.isArray(produtos)) {
    for (const produto of produtos) {
      await supabase.from('venda_produto').insert({
        venda_id: id,
        produto_id: produto.id,
        quantidade: produto.quantidade,
        preco_unitario: produto.preco_unitario || produto.preco_venda || 0
      });
    }
  }
  res.json(vendaData[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

// Rota para solicitar redefinição de senha
app.post('/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  console.log(`[RESET PASSWORD] Tentativa de redefinição de senha para:`, email);
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.REDIRECT_URL || 'http://localhost:5173'}/reset-password` });
  
  if (error) {
    console.log(`[RESET PASSWORD] Falha para:`, email, error?.message);
    return res.json({ message: 'Se o email estiver cadastrado, um link de recuperação foi enviado.' });
  }
  console.log(`[RESET PASSWORD] Sucesso para:`, email);
  res.json({ message: 'Se o email estiver cadastrado, um link de recuperação foi enviado.' });
});
