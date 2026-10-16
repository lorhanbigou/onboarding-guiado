/* =========================================================================
   CONFIGURAÇÃO DO ANALYTICS (Supabase)
   Preencha depois de criar o projeto no Supabase (passo a passo no README).
   - url:       Project Settings → API → Project URL
   - anonKey:   Project Settings → API → anon public  (é pública por natureza;
                a segurança vem das regras RLS do supabase/schema.sql)
   - adminEmail: e-mail do usuário admin criado em Authentication → Users
   Enquanto estiver vazio, o treinamento funciona normalmente (eventos ficam
   numa fila no aparelho) e o painel abre em modo demonstração.
   ========================================================================= */
window.TREINO_ANALYTICS = {
  url: 'https://pfgkzdrbluelvphtveiq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZ2t6ZHJibHVlbHZwaHR2ZWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMDg5MTgsImV4cCI6MjEwNjc4NDkxOH0.bKGAAAGobVhBH_GbIgdMpJBpECqD6MLcC8G7jDZDTP4',
  adminEmail: 'admin@bigou.app',
};
