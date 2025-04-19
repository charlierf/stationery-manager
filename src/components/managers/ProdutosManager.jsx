import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiGet, apiPost, apiDelete } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

console.log('ProdutosManager loaded');

function ProdutosManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [novoProduto, setNovoProduto] = useState({
    nome: "",
    insumos: [],
    precoVenda: ""
  });
  const [selectedInsumo, setSelectedInsumo] = useState("");
  const [quantidadeInsumo, setQuantidadeInsumo] = useState("");
  const [editingProduto, setEditingProduto] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProdutos = async () => {
      try {
        const data = await apiGet('/produtos');
        setProdutos(data || []);
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    };
    const fetchInsumos = async () => {
      try {
        const data = await apiGet('/insumos');
        setInsumos(data || []);
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    };
    fetchProdutos();
    fetchInsumos();
  }, [user]);

  const formatNumber = (value) => {
    const number = Number(value);
    return isNaN(number) ? "0.00" : number.toFixed(2);
  };

  const handleAddInsumoProduto = () => {
    if (!selectedInsumo || !quantidadeInsumo) {
      toast({
        title: "Erro",
        description: "Selecione um insumo e especifique a quantidade",
        variant: "destructive"
      });
      return;
    }
    // Garante que selectedInsumo é sempre string (UUID)
    const insumo = insumos.find(i => String(i.id) === String(selectedInsumo));
    if (!insumo) {
      toast({
        title: "Erro",
        description: "Insumo não encontrado",
        variant: "destructive"
      });
      return;
    }
    const novoInsumo = {
      id: String(insumo.id), // sempre UUID string
      nome: insumo.nome,
      valor_unitario: insumo.valor_unitario,
      quantidade: Number(quantidadeInsumo)
    };
    if (editingProduto) {
      setEditingProduto(prev => ({
        ...prev,
        insumos: [...(prev.insumos || []).filter(i => String(i.id).length === 36), novoInsumo]
      }));
    } else {
      setNovoProduto(prev => ({
        ...prev,
        insumos: [...(prev.insumos || []).filter(i => String(i.id).length === 36), novoInsumo]
      }));
    }
    setSelectedInsumo("");
    setQuantidadeInsumo("");
  };

  const handleAddProduto = async () => {
    if (!novoProduto.nome || novoProduto.insumos.length === 0 || !novoProduto.precoVenda) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos e adicione pelo menos um insumo",
        variant: "destructive"
      });
      return;
    }
    try {
      const custo_total = novoProduto.insumos.reduce((acc, curr) => acc + ((Number(curr.quantidade) || 0) * (Number(curr.valor_unitario) || 0)), 0);
      const data = await apiPost('/produtos', {
        nome: novoProduto.nome,
        preco_venda: Number(novoProduto.precoVenda),
        custo_total,
        insumos: novoProduto.insumos.map(i => ({ id: i.id, quantidade: i.quantidade }))
      });
      setProdutos(prev => [...prev, { ...data, insumos: novoProduto.insumos }]);
      setNovoProduto({ nome: "", insumos: [], precoVenda: "" });
      toast({ title: "Sucesso", description: "Produto adicionado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleEditProduto = async () => {
    if (!editingProduto?.nome || !editingProduto?.insumos?.length || !editingProduto?.precoVenda) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos e adicione pelo menos um insumo",
        variant: "destructive"
      });
      return;
    }
    try {
      const custo_total = editingProduto.insumos.reduce((acc, curr) => acc + ((Number(curr.quantidade) || 0) * (Number(curr.valor_unitario) || 0)), 0);
      const data = await apiPost(`/produtos/${editingProduto.id}`, {
        nome: editingProduto.nome,
        preco_venda: Number(editingProduto.precoVenda),
        custo_total,
        insumos: editingProduto.insumos.map(i => ({ id: i.id, quantidade: i.quantidade }))
      }, "PUT");
      setProdutos(prev => prev.map(produto => produto.id === editingProduto.id ? { ...data, insumos: editingProduto.insumos } : produto));
      setIsEditDialogOpen(false);
      toast({ title: "Sucesso", description: "Produto atualizado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const removeProduto = async (id) => {
    try {
      await apiDelete(`/produtos/${id}`);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast({ title: "Sucesso", description: "Produto removido com sucesso!" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const calcularMargem = (precoVenda, custoTotal) => {
    const preco = Number(precoVenda) || 0;
    const custo = Number(custoTotal) || 1; // Evita divisão por zero
    return ((preco - custo) / custo * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="nomeProduto">Nome do Produto</Label>
            <Input
              id="nomeProduto"
              value={novoProduto.nome}
              onChange={e => setNovoProduto(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="precoVenda">Preço de Venda (R$)</Label>
            <Input
              id="precoVenda"
              type="number"
              step="0.01"
              min="0"
              value={novoProduto.precoVenda}
              onChange={e => setNovoProduto(prev => ({ ...prev, precoVenda: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="insumoSelect">Selecionar Insumo</Label>
            <select
              id="insumoSelect"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedInsumo}
              onChange={e => setSelectedInsumo(e.target.value)}
            >
              <option value="">Selecione um insumo</option>
              {insumos.map(insumo => (
                <option key={insumo.id} value={insumo.id}>
                  {insumo.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="quantidadeInsumo">Quantidade</Label>
            <div className="flex gap-2">
              <Input
                id="quantidadeInsumo"
                type="number"
                min="0"
                value={quantidadeInsumo}
                onChange={e => setQuantidadeInsumo(e.target.value)}
              />
              <Button onClick={handleAddInsumoProduto}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Insumos Selecionados:</h3>
          <ul className="space-y-2">
            {(novoProduto.insumos || []).map((insumo, index) => (
              <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                <span>{insumo.nome} - {insumo.quantidade} unidades</span>
                <span>R$ {formatNumber(insumo.quantidade * insumo.valor_unitario)}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={handleAddProduto} className="w-full mb-4">
          <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
        </Button>

        <ScrollArea className="h-[400px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Insumos</TableHead>
                <TableHead>Custo Total</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map(produto => (
                <TableRow key={produto.id}>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Ver Insumos</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Insumos de {produto.nome}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          {(produto.insumos || []).map((insumo, index) => (
                            <div key={index} className="flex justify-between p-2 bg-secondary rounded">
                              <span>{insumo.nome}</span>
                              <span>{insumo.quantidade} unidades</span>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>R$ {(Number(produto.custo_total) || 0).toFixed(2)}</TableCell>
                  <TableCell>R$ {(Number(produto.preco_venda) || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {formatNumber(calcularMargem(produto.preco_venda, produto.custo_total))}%
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProduto(produto)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Produto</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-nome">Nome</Label>
                              <Input
                                id="edit-nome"
                                value={editingProduto?.nome || ""}
                                onChange={e => setEditingProduto(prev => ({
                                  ...prev,
                                  nome: e.target.value
                                }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-preco">Preço de Venda (R$)</Label>
                              <Input
                                id="edit-preco"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingProduto?.precoVenda || ""}
                                onChange={e => setEditingProduto(prev => ({
                                  ...prev,
                                  precoVenda: e.target.value
                                }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Insumos Atuais</Label>
                              {editingProduto?.insumos?.map((insumo, index) => (
                                <div key={index} className="flex justify-between p-2 bg-secondary rounded">
                                  <span>{insumo.nome}</span>
                                  <span>{insumo.quantidade} unidades</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleEditProduto}>Salvar Alterações</Button>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduto(produto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ProdutosManager;
