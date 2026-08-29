import { Package, Plus } from "lucide-react";
import Button from "../../components/ui/Button";

export function Pacotes() {
  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" />
            Gestão de Pacotes
          </h1>
          <Button variant="primary">
            <Plus className="w-5 h-5" />
            Novo Pacote
          </Button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum pacote cadastrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando um novo pacote de serviços para seus clientes.
            </p>
            <div className="mt-6 space-y-4">
              <p className="text-xs text-green-600 font-medium bg-green-50 p-3 rounded inline-block">
                Integração liberada! As funções RPC <strong>comprar_pacote</strong> e <strong>usar_sessao_pacote</strong> já estão disponíveis no Supabase.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
