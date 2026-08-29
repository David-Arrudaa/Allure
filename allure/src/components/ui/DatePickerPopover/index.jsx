import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Check,
} from "lucide-react";
import "./DatePickerPopover.css";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export function DatePickerPopover({
  dataSelecionada,
  onSelectData,
  isOpen,
  onClose,
}) {
  const popoverRef = useRef(null);

  // Mês e ano atualmente visualizados no calendário
  const [mesVisualizado, setMesVisualizado] = useState(
    dataSelecionada.getMonth(),
  );
  const [anoVisualizado, setAnoVisualizado] = useState(
    dataSelecionada.getFullYear(),
  );

  // Sincronizar com a data selecionada quando o popover abrir
  useEffect(() => {
    if (isOpen) {
      setMesVisualizado(dataSelecionada.getMonth());
      setAnoVisualizado(dataSelecionada.getFullYear());
    }
  }, [isOpen, dataSelecionada]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickFora);
    }
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mesAnterior = (e) => {
    e.stopPropagation();
    if (mesVisualizado === 0) {
      setMesVisualizado(11);
      setAnoVisualizado((prev) => prev - 1);
    } else {
      setMesVisualizado((prev) => prev - 1);
    }
  };

  const proximoMes = (e) => {
    e.stopPropagation();
    if (mesVisualizado === 11) {
      setMesVisualizado(0);
      setAnoVisualizado((prev) => prev + 1);
    } else {
      setMesVisualizado((prev) => prev + 1);
    }
  };

  const irParaHoje = (e) => {
    e.stopPropagation();
    const hoje = new Date();
    onSelectData(hoje);
    onClose();
  };

  const irParaAmanha = (e) => {
    e.stopPropagation();
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    onSelectData(amanha);
    onClose();
  };

  // Gerar os dias para a grade do calendário
  const gerarDiasDoMes = () => {
    const primeiroDiaMes = new Date(anoVisualizado, mesVisualizado, 1);
    const ultimoDiaMes = new Date(anoVisualizado, mesVisualizado + 1, 0);

    const diaSemanaInicio = primeiroDiaMes.getDay(); // 0 = Domingo
    const totalDiasMes = ultimoDiaMes.getDate();

    // Dias do mês anterior para preencher a primeira semana
    const ultimoDiaMesAnterior = new Date(anoVisualizado, mesVisualizado, 0).getDate();
    const diasMesAnterior = [];
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      diasMesAnterior.push({
        dia: ultimoDiaMesAnterior - i,
        mes: mesVisualizado - 1,
        ano: mesVisualizado === 0 ? anoVisualizado - 1 : anoVisualizado,
        isOutroMes: true,
      });
    }

    // Dias do mês atual
    const diasMesAtual = [];
    for (let i = 1; i <= totalDiasMes; i++) {
      diasMesAtual.push({
        dia: i,
        mes: mesVisualizado,
        ano: anoVisualizado,
        isOutroMes: false,
      });
    }

    // Dias do próximo mês para completar 35 ou 42 células
    const totalExibido = diasMesAnterior.length + diasMesAtual.length;
    const celulasTotais = totalExibido > 35 ? 42 : 35;
    const diasProximoMes = [];
    const restantes = celulasTotais - totalExibido;
    for (let i = 1; i <= restantes; i++) {
      diasProximoMes.push({
        dia: i,
        mes: mesVisualizado + 1,
        ano: mesVisualizado === 11 ? anoVisualizado + 1 : anoVisualizado,
        isOutroMes: true,
      });
    }

    return [...diasMesAnterior, ...diasMesAtual, ...diasProximoMes];
  };

  const dias = gerarDiasDoMes();
  const hoje = new Date();

  const handleCliqueDia = (item, e) => {
    e.stopPropagation();
    let mesFinal = item.mes;
    let anoFinal = item.ano;

    if (mesFinal < 0) {
      mesFinal = 11;
      anoFinal -= 1;
    } else if (mesFinal > 11) {
      mesFinal = 0;
      anoFinal += 1;
    }

    const novaData = new Date(anoFinal, mesFinal, item.dia);
    onSelectData(novaData);
    onClose();
  };

  return (
    <div
      className="datepicker-popover-container"
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
    >
      {/* CABEÇALHO COM NAVEGAÇÃO DE MÊS E ANO */}
      <div className="datepicker-header">
        <button
          type="button"
          className="datepicker-nav-btn"
          onClick={mesAnterior}
          title="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="datepicker-titulo-mes-ano">
          <span className="datepicker-mes">{MESES[mesVisualizado]}</span>
          <span className="datepicker-ano">{anoVisualizado}</span>
        </div>

        <button
          type="button"
          className="datepicker-nav-btn"
          onClick={proximoMes}
          title="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* DIAS DA SEMANA */}
      <div className="datepicker-semana-header">
        {DIAS_SEMANA.map((d, index) => (
          <span key={index} className="datepicker-dia-semana">
            {d}
          </span>
        ))}
      </div>

      {/* GRADE DE DIAS */}
      <div className="datepicker-grade-dias">
        {dias.map((item, index) => {
          let mesCorrigido = item.mes;
          let anoCorrigido = item.ano;
          if (mesCorrigido < 0) {
            mesCorrigido = 11;
            anoCorrigido -= 1;
          } else if (mesCorrigido > 11) {
            mesCorrigido = 0;
            anoCorrigido += 1;
          }

          const isHoje =
            hoje.getDate() === item.dia &&
            hoje.getMonth() === mesCorrigido &&
            hoje.getFullYear() === anoCorrigido;

          const isSelecionado =
            dataSelecionada.getDate() === item.dia &&
            dataSelecionada.getMonth() === mesCorrigido &&
            dataSelecionada.getFullYear() === anoCorrigido;

          return (
            <button
              key={index}
              type="button"
              className={`datepicker-dia-btn ${item.isOutroMes ? "outro-mes" : ""} ${isHoje ? "hoje" : ""} ${isSelecionado ? "selecionado" : ""}`}
              onClick={(e) => handleCliqueDia(item, e)}
            >
              <span>{item.dia}</span>
              {isHoje && !isSelecionado && <span className="bolinha-hoje" />}
            </button>
          );
        })}
      </div>

      {/* ATALHOS RÁPIDOS NO RODAPÉ */}
      <div className="datepicker-footer">
        <button
          type="button"
          className="datepicker-btn-atalho"
          onClick={irParaHoje}
        >
          Hoje
        </button>
        <button
          type="button"
          className="datepicker-btn-atalho"
          onClick={irParaAmanha}
        >
          Amanhã
        </button>
      </div>
    </div>
  );
}

