import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

console.log('InsumosManager loaded');

function InsumosManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [insumos, setInsumos] = useState([]);
  const [novoInsumo, setNovoInsumo] = useState({
    nome: "",
    quantidade: "",
    valorUnitario: ""
  });
  const [editingInsumo, setEditingInsumo] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchInsumos = async () => {
      try {
        const data = await apiGet('/insumos');
        setInsumos(data || []);
      } catch (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    };
    fetchInsumos();
  }, [user]);

  const handleAddInsumo = async () => {
    console.log('handleAddInsumo chamado', novoInsumo);
    if (!novoInsumo.nome || !novoInsumo.quantidade || !novoInsumo.valorUnitario) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }
    try {
      const data = await apiPost('/insumos', {
        nome: novoInsumo.nome,
        quantidade: Number(novoInsumo.quantidade),
        valor_unitario: Number(novoInsumo.valorUnitario)
      });
      setInsumos(prev => [...prev, data]);
      setNovoInsumo({ nome: "", quantidade: "", valorUnitario: "" });
      toast({ title: "Sucesso", description: "Insumo adicionado com sucesso!" });
    } catch (error) {
      console.error('Erro ao adicionar insumo:', error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleEditInsumo = async () => {
    if (!editingInsumo.nome || !editingInsumo.quantidade || !editingInsumo.valor_unitario) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }
    try {
      const updated = await apiPost(`/insumos/${editingInsumo.id}`, {
        nome: editingInsumo.nome,
        quantidade: Number(editingInsumo.quantidade),
        valor_unitario: Number(editingInsumo.valor_unitario)
      }, "PUT");
      setInsumos(prev => prev.map(insumo =>
        insumo.id === editingInsumo.id ? updated : insumo
      ));
      setIsEditDialogOpen(false);
      toast({ title: "Sucesso", description: "Insumo atualizado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const removeInsumo = async (id) => {
    const { error } = await apiPost(`/insumos/${id}`, {}, "DELETE");
    if (!error) {
      setInsumos(prev => prev.filter(i => i.id !== id));
      toast({ title: "Sucesso", description: "Insumo removido com sucesso!" });
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Insumos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={novoInsumo.nome}
              onChange={e => setNovoInsumo(prev => ({ ...prev, nome: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              value={novoInsumo.quantidade}
              onChange={e => setNovoInsumo(prev => ({ ...prev, quantidade: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="valorUnitario">Valor Unitário (R$)</Label>
            <Input
              id="valorUnitario"
              type="number"
              step="0.01"
              value={novoInsumo.valorUnitario}
              onChange={e => setNovoInsumo(prev => ({ ...prev, valorUnitario: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
          <button onClick={handleAddInsumo} className="w-full bg-blue-500 text-white p-2 rounded">
            Adicionar Insumo
          </button>
          </div>
        </div>

        <ScrollArea className="h-[400px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumos.map(insumo => (
                <TableRow key={insumo.id}>
                  <TableCell>{insumo.nome}</TableCell>
                  <TableCell>{insumo.quantidade}</TableCell>
                  <TableCell>R$ {(Number(insumo.valor_unitario) || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingInsumo(insumo)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Insumo</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-nome">Nome</Label>
                              <Input
                                id="edit-nome"
                                value={editingInsumo?.nome || ""}
                                onChange={e => setEditingInsumo(prev => ({
                                  ...prev,
                                  nome: e.target.value
                                }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-quantidade">Quantidade</Label>
                              <Input
                                id="edit-quantidade"
                                type="number"
                                value={editingInsumo?.quantidade || ""}
                                onChange={e => setEditingInsumo(prev => ({
                                  ...prev,
                                  quantidade: e.target.value
                                }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-valor">Valor Unitário (R$)</Label>
                              <Input
                                id="edit-valor"
                                type="number"
                                step="0.01"
                                value={editingInsumo?.valor_unitario || ""}
                                onChange={e => setEditingInsumo(prev => ({
                                  ...prev,
                                  valor_unitario: e.target.value
                                }))}
                              />
                            </div>
                          </div>
                          <Button onClick={handleEditInsumo}>Salvar Alterações</Button>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeInsumo(insumo.id)}
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

export default InsumosManager;
