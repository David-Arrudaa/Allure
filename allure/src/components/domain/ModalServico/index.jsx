import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { maskCurrencyInput, parseCurrencyToNumber, formatCurrency } from "../../../utils/masks";
import { FORM_STYLES } from "../../../config/theme";

const servicoSchema = z.object({
  nome: z.string().trim().min(4, "O nome do serviço deve ter no mínimo 4 caracteres"),
  preco: z.string().refine((val) => {
    const num = parseCurrencyToNumber(val);
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
    control,
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
          preco: servico.preco ? formatCurrency(servico.preco) : "",
        });
      } else {
        reset({
          nome: "",
          preco: "",
        });
      }
    }
  }, [servico, isOpen, reset]);

  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const onSubmit = async (dadosServico) => {
    setCarregando(true);
    try {
      const precoNumerico = parseCurrencyToNumber(dadosServico.preco);

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
        toast.success("Serviço atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("servicos")
          .insert([payload]);
        if (error) throw error;
        toast.success("Serviço cadastrado com sucesso!");
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error.message);
      toast.error(`Erro ao salvar serviço: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={servico ? "Editar Serviço" : "Novo Serviço"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Nome do Serviço *</label>
          <input
            type="text"
            placeholder="Ex: Escova Modeladora"
            className={FORM_STYLES.input}
            {...register("nome")}
            onChange={(e) => {
              e.target.value = formatarNome(e.target.value);
              register("nome").onChange(e);
            }}
          />
          {errors.nome && <span className={FORM_STYLES.error}>{errors.nome.message}</span>}
        </div>

        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Valor (R$) *</label>
          <Controller
            name="preco"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="R$ 0,00"
                className={FORM_STYLES.input}
                onChange={(e) => {
                  const masked = maskCurrencyInput(e.target.value);
                  field.onChange(masked);
                }}
              />
            )}
          />
          {errors.preco && <span className={FORM_STYLES.error}>{errors.preco.message}</span>}
        </div>

        <div className={FORM_STYLES.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={carregando}>
            {carregando
              ? "Salvando..."
              : servico
                ? "Salvar Alterações"
                : "Salvar Serviço"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
