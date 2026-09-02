SELECT 
  id, 
  servico, 
  data_horario, 
  valor, 
  status, 
  pagamento, 
  duracao, 
  produto_id, 
  quantidade 
FROM appointments 
ORDER BY created_at DESC 
LIMIT 1;
