
import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsumosManager from "@/components/managers/InsumosManager";
import ProdutosManager from "@/components/managers/ProdutosManager";
import VendasManager from "@/components/managers/VendasManager";
import { LogOut } from "lucide-react";

console.log("Dashboard component loaded");

function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Sistema de Controle - Papelaria</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="insumos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insumos">Insumos</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="insumos">
          {console.log("TabsContent insumos renderizou")}
          <InsumosManager />
        </TabsContent>

        <TabsContent value="produtos">
          {console.log("TabsContent produtos renderizou")}
          <ProdutosManager />
        </TabsContent>

        <TabsContent value="vendas">
          {console.log("TabsContent vendas renderizou")}
          <VendasManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;
