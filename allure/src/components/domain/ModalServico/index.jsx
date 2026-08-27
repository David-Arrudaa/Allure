import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../../contexts/AuthContext";
import "../ModalAgendamento/ModalAgendamento.css";

const servicoSchema = z.object({
  nome: z.string().trim().min(4, "O nome do serviço deve ter no mínimo 4 caracteres"),
  preco: z.string().refine((val) => {
    const num = Number(val.replace(",", "."));
    return num > 1;
  }, "O valor deve ser acima de R$ 1,00")
});

export function ModalServico({ isOpen, onClose, servico }) {
  const { profile } = useAuth();
  const [carregando, setCarregando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: "",
      preco: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (servico) {
        reset({
          nome: servico.nome || "",
          preco: servico.preco ? String(servico.preco).replace(".", ",") : "",
        });
      } else {
        reset({
          nome: "",
          preco: "",
        });
      }
    }
  }, [servico, isOpen, reset]);

  if (!isOpen) return null;

  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const onSubmit = async (dadosServico) => {
    setCarregando(true);
    try {
      const precoNumerico = Number(dadosServico.preco.replace(",", "."));

      const payload = {
        nome: formatarNome(dadosServico.nome),
        preco: precoNumerico,
        tenant_id: profile?.tenant_id,
      };

      if (servico && servico.id) {
        const { error } = await supabase
          .from("servicos")
          .update(payload)
          .eq("id", servico.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("servicos")
          .insert([payload]);
        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error.message);
      alert(`Erro ao salvar serviço: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "450px" }}
      >
        <div
          className="modal-header"
          style={{
            marginBottom: "1.2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
            {servico ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form-agendamento">
          <div className="form-grupo">
            <label>Nome do Serviço *</label>
            <input
              type="text"
              placeholder="Ex: Escova Modeladora"
              {...register("nome")}
              onChange={(e) => {
                e.target.value = formatarNome(e.target.value);
                register("nome").onChange(e);
              }}
            />
            {errors.nome && <span className="erro" style={{ color: "red", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>{errors.nome.message}</span>}
          </div>

          <div className="form-grupo" style={{ marginTop: "1rem" }}>
            <label>Valor (R$) *</label>
            <input
              type="text"
              placeholder="Ex: 80,00"
              {...register("preco")}
            />
            {errors.preco && <span className="erro" style={{ color: "red", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>{errors.preco.message}</span>}
          </div>

          <button
            type="submit"
            className="btn-salvar"
            style={{ marginTop: "1.5rem" }}
            disabled={carregando}
          >
            {carregando
              ? "Salvando..."
              : servico
                ? "Salvar Alterações"
                : "Salvar Serviço"}
          </button>
        </form>
      </div>
    </div>
  );
}
