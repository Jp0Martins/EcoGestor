-- Tabela empresas
create table public.empresas (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    cnpj varchar(18) not null unique,
    email text,
    telefone text,
    endereco text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tabela setores
create table public.setores (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    descricao text,
    empresa_id uuid references public.empresas(id) on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Tabela usuarios (relacionada ao auth.users!)
create table public.usuarios (
    id uuid primary key, -- deve ser igual ao id do auth.users
    nome text not null,
    email text not null,
    empresa_id uuid references public.empresas(id),
    setor_id uuid references public.setores(id),
    tipo_perfil text not null default 'usuario',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);


-- Habilite RLS
alter table empresas enable row level security;
alter table setores enable row level security;
alter table usuarios enable row level security;

-- Política: usuários só veem a própria empresa
create policy "Usuarios só veem sua empresa"
    on empresas
    for select
    using (id = (select empresa_id from usuarios where usuarios.id = auth.uid()));

-- Política: usuários só veem setores da sua empresa
create policy "Setores da empresa do usuário"
    on setores
    for select
    using (empresa_id = (select empresa_id from usuarios where usuarios.id = auth.uid()));

-- Política: usuário só vê o próprio usuário
create policy "Usuário só vê a si mesmo"
    on usuarios
    for select
    using (id = auth.uid());

    -- Empresas (já existe, mas para referência)
CREATE TABLE IF NOT EXISTS empresas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(20),
    email VARCHAR(100),
    telefone VARCHAR(20),
    endereco VARCHAR(200),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Setores (já existe, mas para referência)
CREATE TABLE IF NOT EXISTS setores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(200),
    empresa_id uuid NOT NULL REFERENCES empresas(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Usuários (já existe, mas para referência)
CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY, -- igual ao UID do Supabase Auth
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    tipo_perfil VARCHAR(20),
    empresa_id uuid REFERENCES empresas(id),
    setor_id uuid REFERENCES setores(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Consumos (KPI de Água e Energia)
CREATE TABLE IF NOT EXISTS consumos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    empresa_id uuid NOT NULL REFERENCES empresas(id),
    setor_id uuid REFERENCES setores(id),
    fonte VARCHAR(10) NOT NULL CHECK (fonte IN ('agua', 'energia')),
    data DATE NOT NULL,
    valor DECIMAL NOT NULL,
    custo DECIMAL NOT NULL,
    observacoes VARCHAR(100),
    created_at TIMESTAMP DEFAULT now()
);

-- Índices para performance (opcional, mas recomendado)
CREATE INDEX IF NOT EXISTS idx_consumos_empresa ON consumos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_consumos_setor ON consumos(setor_id);
CREATE INDEX IF NOT EXISTS idx_consumos_usuario ON consumos(usuario_id);