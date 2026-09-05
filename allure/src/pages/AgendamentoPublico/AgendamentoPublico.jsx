import { useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const agendamentoSchema = z.object({
  serviceId: z.string().min(1, "Selecione um serviço"),
  professionalId: z.string().min(1, "Selecione um profissional"),
  date: z.string().min(1, "Selecione uma data"),
  time: z.string().min(1, "Selecione um horário"),
  clientName: z.string().min(3, "Nome completo é obrigatório"),
  clientPhone: z.string().min(10, "Telefone inválido")
});

export function AgendamentoPublico() {
  const { tenant_id: _tenant_id } = useParams();
  const [step, setStep] = useState(1); // 1: Detalhes, 2: Dados Pessoais, 3: Confirmacao
  
  const { register, handleSubmit, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      serviceId: "",
      professionalId: "",
      date: "",
      time: "",
      clientName: "",
      clientPhone: ""
    }
  });

  const onSubmit = (data) => {
    console.log("Submitting appointment...", data);
    setStep(3); // Success page
  };

  const handleNext = async () => {
    const isStep1Valid = await trigger(["serviceId", "professionalId", "date", "time"]);
    if (isStep1Valid) {
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-purple-600 px-6 py-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">Agendamento Online</h2>
          <p className="mt-2 text-purple-200">Reserve seu horário de forma rápida e fácil.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serviço</label>
                  <select {...register("serviceId")} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md border">
                    <option value="">Selecione...</option>
                    <option value="1">Corte de Cabelo</option>
                    <option value="2">Manicure</option>
                  </select>
                  {errors.serviceId && <p className="mt-1 text-sm text-red-600">{errors.serviceId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Profissional</label>
                  <select {...register("professionalId")} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md border">
                    <option value="">Qualquer profissional</option>
                    <option value="1">João Silva</option>
                    <option value="2">Maria Oliveira</option>
                  </select>
                  {errors.professionalId && <p className="mt-1 text-sm text-red-600">{errors.professionalId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input type="date" {...register("date")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm border p-2" />
                    {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora</label>
                    <input type="time" {...register("time")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm border p-2" />
                    {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>}
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleNext}
                  className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Seu Nome</label>
                  <input type="text" {...register("clientName")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm border p-2" placeholder="Ex: Ana Silva" />
                  {errors.clientName && <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Seu Telefone (WhatsApp)</label>
                  <input type="text" {...register("clientPhone")} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm border p-2" placeholder="(00) 00000-0000" />
                  {errors.clientPhone && <p className="mt-1 text-sm text-red-600">{errors.clientPhone.message}</p>}
                </div>

                <div className="flex gap-4 mt-6">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Agendamento Solicitado!</h3>
                <p className="text-gray-500 mb-6">
                  Seu horário foi reservado e está pendente de confirmação.
                </p>
                <button 
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Fazer novo agendamento
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
