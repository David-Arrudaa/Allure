import React, { useState } from "react";
import {
  UserPlus,
  Search,
  Trash2,
  Briefcase,
  X,
  AlertTriangle,
  Edit,
  Camera,
} from "lucide-react";
import "./Equipe.css";

export function Equipe() {
  const [busca, setBusca] = useState("");

  // Controle do modal principal (Cadastro/Edição)
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = Criando; número = Editando
  const [formFunc, setFormFunc] = useState({
    nome: "",
    especialidade: "",
    telefone: "",
    foto: "",
  });

  // Controles do modal de exclusão
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [profParaExcluir, setProfParaExcluir] = useState(null);

  // Lista de equipe (Com fotos vazias no início para testar)
  const [equipe, setEquipe] = useState([
    {
      id: 1,
      nome: "Ana Silva",
      especialidade: "Nail Designer",
      telefone: "(11) 99999-1111",
      foto: "",
    },
    {
      id: 2,
      nome: "Beatriz Santos",
      especialidade: "Manicure Clássica",
      telefone: "(11) 99999-2222",
      foto: "",
    },
    {
      id: 3,
      nome: "Carla Dias",
      especialidade: "Pedicure e Spa",
      telefone: "(11) 99999-3333",
      foto: "",
    },
  ]);

  // Abre modal para NOVA profissional
  const abrirModalCadastro = () => {
    setEditandoId(null);
    setFormFunc({ nome: "", especialidade: "", telefone: "", foto: "" });
    setModalAberto(true);
  };

  // Abre modal para EDITAR profissional
  const abrirModalEdicao = (prof) => {
    setEditandoId(prof.id);
    setFormFunc(prof);
    setModalAberto(true);
  };

  // Lida com o upload da imagem e converte para preview
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormFunc({ ...formFunc, foto: reader.result }); // Salva a imagem em formato base64
      };
      reader.readAsDataURL(file);
    }
  };

  // Salvar (Serve para criar ou atualizar)
  const handleSalvar = (e) => {
    e.preventDefault();
    if (!formFunc.nome || !formFunc.especialidade) return;

    if (editandoId) {
      // Atualizando existente
      setEquipe(
        equipe.map((f) => (f.id === editandoId ? { ...f, ...formFunc } : f)),
      );
    } else {
      // Criando nova
      const novaId =
        equipe.length > 0 ? Math.max(...equipe.map((f) => f.id)) + 1 : 1;
      setEquipe([...equipe, { id: novaId, ...formFunc }]);
    }

    setModalAberto(false);
  };

  // Modal de Exclusão
  const abrirModalExcluir = (id) => {
    setProfParaExcluir(id);
    setModalExcluirAberto(true);
  };

  const confirmarExclusao = () => {
    if (profParaExcluir !== null) {
      setEquipe(equipe.filter((f) => f.id !== profParaExcluir));
      setModalExcluirAberto(false);
      setProfParaExcluir(null);
    }
  };

  const cancelarExclusao = () => {
    setModalExcluirAberto(false);
    setProfParaExcluir(null);
  };

  const equipeFiltrada = equipe.filter((f) =>
    f.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="equipe-container">
      <div className="equipe-header">
        <div>
          <h2>Equipe</h2>
          <p>Gerencie as profissionais do seu negócio</p>
        </div>
        <div className="equipe-header-acoes">
          <div className="filtro-busca-container">
            <Search size={16} className="icone-busca" />
            <input
              type="text"
              placeholder="Buscar profissional..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-busca"
            />
          </div>
          <button className="btn-acao-primaria" onClick={abrirModalCadastro}>
            <UserPlus size={18} />
            <span>Nova Profissional</span>
          </button>
        </div>
      </div>

      <div className="equipe-grid">
        {equipeFiltrada.map((prof) => (
          <div key={prof.id} className="equipe-card">
            <div className="equipe-card-info">
              {/* Se a profissional tem foto, exibe. Se não, exibe a letra do nome */}
              {prof.foto ? (
                <img
                  src={prof.foto}
                  alt={prof.nome}
                  className="avatar-img-card"
                />
              ) : (
                <div className="avatar-placeholder">{prof.nome.charAt(0)}</div>
              )}

              <div className="info-textos">
                <h3>{prof.nome}</h3>
                <span className="especialidade">
                  <Briefcase size={14} /> {prof.especialidade}
                </span>
                <span className="telefone">{prof.telefone}</span>
              </div>
            </div>

            <div className="equipe-card-acoes">
              <button
                className="btn-editar"
                onClick={() => abrirModalEdicao(prof)}
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                className="btn-excluir"
                onClick={() => abrirModalExcluir(prof.id)}
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {equipeFiltrada.length === 0 && (
          <div className="estado-vazio-equipe">
            Nenhuma profissional encontrada.
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editandoId ? "Editar Profissional" : "Cadastrar Profissional"}
              </h3>
              <button
                className="btn-fechar"
                onClick={() => setModalAberto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="modal-form">
              {/* Seção de Upload da Foto */}
              <div className="upload-foto-container">
                <div className="avatar-preview">
                  {formFunc.foto ? (
                    <img src={formFunc.foto} alt="Preview" />
                  ) : (
                    <Camera size={24} color="#94a3b8" />
                  )}
                </div>
                <div className="upload-foto-textos">
                  <label className="btn-secundario upload-label">
                    Escolher Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <span className="upload-dica">JPG, PNG. Max 2MB.</span>
                </div>
              </div>

              <div className="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Lima"
                  value={formFunc.nome}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, nome: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Especialidade *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nail Designer"
                  value={formFunc.especialidade}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, especialidade: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={formFunc.telefone}
                  onChange={(e) =>
                    setFormFunc({ ...formFunc, telefone: e.target.value })
                  }
                />
              </div>

              <div className="modal-acoes">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-acao-primaria">
                  {editandoId ? "Salvar Alterações" : "Salvar Profissional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalExcluirAberto && (
        <div className="modal-overlay">
          <div className="modal-content modal-pequeno">
            <div className="modal-header">
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle size={20} />
                Excluir Profissional
              </h3>
              <button className="btn-fechar" onClick={cancelarExclusao}>
                <X size={20} />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ marginBottom: "1.5rem", color: "#475569" }}
            >
              <p>
                Tem certeza que deseja excluir esta profissional? Esta ação não
                poderá ser desfeita.
              </p>
            </div>
            <div className="modal-acoes">
              <button className="btn-secundario" onClick={cancelarExclusao}>
                Cancelar
              </button>
              <button className="btn-acao-perigo" onClick={confirmarExclusao}>
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
