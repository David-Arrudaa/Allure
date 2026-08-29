export async function getTenantConfig(hostname) {
  // Simulação: em produção, aqui seria supabase.from('tenants').eq('subdomain', subdomain)
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'cliente-b') {
    return {
      id: 'tenant-2',
      name: 'Salão Cliente B',
      logoUrl: 'https://placehold.co/150x50?text=Cliente+B',
      theme: {
        primary: '#ef4444',
        secondary: '#f87171'
      }
    };
  }

  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'LUZZ - Gestão de Beleza',
    logoUrl: 'https://placehold.co/150x50?text=LUZZ',
    theme: {
      primary: '#7c3aed',
      secondary: '#ede9fe'
    }
  };
}
