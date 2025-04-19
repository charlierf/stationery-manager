import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiGet, apiPost } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function VendasManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [vendas, setVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [novaVenda, setNovaVenda] = useState({
    produtos: [],
    total: 0,
    data: new Date()
  });
  const [selectedProduto, setSelectedProduto] = useState("");
  const [quantidade, setQuantidade] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchVendas = async () => {
      try {
        const data = await apiGet('/vendas');
        setVendas(data || []);
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    };
    const fetchProdutos = async () => {
      try {
        const data = await apiGet('/produtos');
        setProdutos(data || []);
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    };
    fetchVendas();
    fetchProdutos();
  }, [user]);

  const handleAddProdutoVenda = () => {
    if (!selectedProduto || !quantidade) {
      toast({
        title: "Erro",
        description: "Selecione um produto e especifique a quantidade",
        variant: "destructive"
      });
      return;
    }
    const produto = produtos.find(p => String(p.id) === String(selectedProduto));
    if (!produto || typeof produto.preco_venda !== 'number') {
      toast({
        title: "Erro",
        description: "Produto inválido ou sem preço definido",
        variant: "destructive"
      });
      return;
    }
    setNovaVenda(prev => {
      const produtoExistente = prev.produtos.find(p => p.id === produto.id);
      if (produtoExistente) {
        return {
          ...prev,
          produtos: prev.produtos.map(p =>
            p.id === produto.id
              ? { ...p, quantidade: p.quantidade + Number(quantidade) }
              : p
          ),
          total: prev.total + (produto.preco_venda * Number(quantidade))
        };
      }
      return {
        ...prev,
        produtos: [...prev.produtos, {
          id: String(produto.id),
          nome: produto.nome,
          preco_venda: produto.preco_venda,
          quantidade: Number(quantidade)
        }],
        total: prev.total + (produto.preco_venda * Number(quantidade))
      };
    });
    setSelectedProduto("");
    setQuantidade("");
  };

  const handleFinalizarVenda = async () => {
    if (novaVenda.produtos.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto à venda",
        variant: "destructive"
      });
      return;
    }
    try {
      const data = await apiPost('/vendas', {
        produtos: novaVenda.produtos.map(p => ({
          id: p.id,
          quantidade: p.quantidade,
          preco_unitario: p.preco_venda // garante envio do preço
        })),
        total: novaVenda.total,
        data: new Date().toISOString()
      });
      setVendas(prev => [...prev, { ...data, produtos: novaVenda.produtos }]);
      setNovaVenda({ produtos: [], total: 0, data: new Date() });
      toast({ title: "Sucesso", description: "Venda finalizada com sucesso!" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="produtoSelect">Selecionar Produto</Label>
            <select
              id="produtoSelect"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedProduto}
              onChange={e => setSelectedProduto(e.target.value)}
            >
              <option value="">Selecione um produto</option>
              {produtos.map(produto => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} - R$ {(Number(produto.preco_venda) || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddProdutoVenda} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Adicionar à Venda
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Produtos da Venda Atual:</h3>
          <ul className="space-y-2">
            {novaVenda.produtos.map((produto, index) => (
              <li key={index} className="flex items-center justify-between bg-secondary p-2 rounded">
                <span>{produto.nome} - {produto.quantidade} unidades</span>
                <span>R$ {(produto.preco_venda * produto.quantidade).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {novaVenda.produtos.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <span className="text-lg font-bold">Total: R$ {novaVenda.total.toFixed(2)}</span>
              <Button onClick={handleFinalizarVenda}>
                Finalizar Venda
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Histórico de Vendas</h3>
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.map(venda => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      {format(new Date(venda.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{(venda.produtos || []).length} itens</TableCell>
                    <TableCell>R$ {(Number(venda.total) || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalhes da Venda</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Data:</h4>
                              <p>{format(new Date(venda.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Produtos:</h4>
                              <ul className="space-y-2">
                                {(venda.produtos || []).map((produto, index) => (
                                  <li key={index} className="flex justify-between p-2 bg-secondary rounded">
                                    <span>{produto.nome}</span>
                                    <span>{produto.quantidade} x R$ {(Number(produto.preco_venda) || 0).toFixed(2)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t">
                              <span className="font-semibold">Total:</span>
                              <span className="text-lg font-bold">R$ {venda.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

export default VendasManager;
