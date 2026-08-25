import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Edit2, Trash2, Plus, X, PackageOpen } from 'lucide-react';
import './Produtos.css';
import { Skeleton } from '../../components/ui/Skeleton';

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  preco: z.preprocess((val) => Number(val), z.number().min(0, 'O preço não pode ser negativo')),
  estoque: z.preprocess((val) => Number(val), z.number().min(0, 'O estoque não pode ser negativo')),
});

export function Produtos() {
  const { profile } = useAuth(); // Usando profile.tenant_id que é o UUID real
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(produtoSchema),
  });

  const fetchProdutos = async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar produtos:', error);
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProdutos();
  }, [profile]);

  const abrirModal = (produto = null) => {
    if (produto) {
      setProdutoEditando(produto);
      reset({ nome: produto.nome, preco: produto.preco, estoque: produto.estoque });
    } else {
      setProdutoEditando(null);
      reset({ nome: '', preco: '', estoque: '' });
    }
    setIsModalOpen(true);
  };

  const fecharModal = () => {
    setIsModalOpen(false);
    setProdutoEditando(null);
    reset();
  };

  const onSubmit = async (data) => {
    if (!profile?.tenant_id) return;

    if (produtoEditando) {
      const { error } = await supabase
        .from('produtos')
        .update({ nome: data.nome, preco: data.preco, estoque: data.estoque })
        .eq('id', produtoEditando.id)
        .eq('tenant_id', profile.tenant_id);

      if (!error) {
        fetchProdutos();
        fecharModal();
      } else {
        alert('Erro ao atualizar produto: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('produtos').insert([
        {
          nome: data.nome,
          preco: data.preco,
          estoque: data.estoque,
          tenant_id: profile.tenant_id,
        },
      ]);

      if (!error) {
        fetchProdutos();
        fecharModal();
      } else {
        alert('Erro ao criar produto: ' + error.message);
      }
    }
  };

  const excluirProduto = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile?.tenant_id);

    if (!error) {
      fetchProdutos();
    } else {
      alert('Erro ao excluir produto: ' + error.message);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="produtos-container">
      <div className="produtos-topbar">
        <div className="produtos-info">
          <h2><PackageOpen size={24} /> Catálogo de Produtos</h2>
          <p>Gerencie o estoque de produtos físicos do salão</p>
        </div>
        <button className="btn-novo" onClick={() => abrirModal()}>
          <Plus size={18} strokeWidth={2.5} />
          Novo Produto
        </button>
      </div>

      <div className="produtos-conteudo">
        <div className="tabela-container">
          <table className="tabela-clientes">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                    <Skeleton width="100%" height="20px" />
                  </td>
                </tr>
              ) : produtos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "3rem", color: "#94A3B8" }}>
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                produtos.map((produto) => (
                  <tr key={produto.id}>
                    <td><strong>{produto.nome}</strong></td>
                    <td>{formatarMoeda(produto.preco)}</td>
                    <td>
                      <span className={`estoque-badge ${produto.estoque > 0 ? 'estoque-positivo' : 'estoque-zerado'}`}>
                        {produto.estoque} un
                      </span>
                    </td>
                    <td>
                      <div className="acoes-tabela">
                        <button className="btn-acao editar" onClick={() => abrirModal(produto)} title="Editar">
                          <Edit2 size={18} />
                        </button>
                        <button className="btn-acao excluir" onClick={() => excluirProduto(produto.id)} title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{produtoEditando ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button className="btn-fechar" onClick={fecharModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
              <div className="form-group">
                <label>Nome do Produto *</label>
                <input type="text" {...register('nome')} placeholder="Ex: Shampoo Especial" />
                {errors.nome && <span className="erro-validacao">{errors.nome.message}</span>}
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Preço (R$) *</label>
                  <input type="number" step="0.01" {...register('preco')} placeholder="0.00" />
                  {errors.preco && <span className="erro-validacao">{errors.preco.message}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <label>Estoque *</label>
                  <input type="number" {...register('estoque')} placeholder="0" />
                  {errors.estoque && <span className="erro-validacao">{errors.estoque.message}</span>}
                </div>
              </div>
              <div className="modal-acoes">
                <button type="button" className="btn-secundario" onClick={fecharModal}>Cancelar</button>
                <button type="submit" className="btn-acao-primaria">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

