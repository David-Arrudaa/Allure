import { Settings, MessageCircle, Save } from "lucide-react";

export function Configuracoes() {
  return (
    <div className="flex-1 overflow-auto">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            Configurações
          </h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-medium text-gray-900">Integração WhatsApp</h2>
          </div>
          <div className="p-6">
            <form className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700">Instância ID (Evolution API)</label>
                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border p-2" placeholder="Ex: allure-instance-123" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key</label>
                <input type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm border p-2" placeholder="Sua chave de API" />
              </div>
              
              <div className="flex items-center">
                <input id="auto-feedback" name="auto-feedback" type="checkbox" className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                <label htmlFor="auto-feedback" className="ml-2 block text-sm text-gray-900">
                  Disparar pesquisa de satisfação automaticamente ao concluir atendimento
                </label>
              </div>

              <div className="pt-4">
                <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </section>
        
        <section className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">Pesquisas de Satisfação</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Nenhuma avaliação recebida ainda.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
