const { Client } = require('pg');

// Cole aqui a String de Conexão Direta do PostgreSQL do novo cliente 
// (Você pega essa URI no painel do Supabase do novo cliente em: Project Settings > Database > Connection string > URI)
const connectionString = process.env.NOVO_CLIENTE_DB_URL;

async function configurarNovoCliente() {
    if (!connectionString) {
        console.error('ERRO: A variável NOVO_CLIENTE_DB_URL não foi informada.');
        return;
    }

    const client = new Client({ connectionString });

    try {
        console.log('Conectando ao banco de dados do novo cliente...');
        await client.connect();

        // 1. Criar a tabela dados_sistema caso não exista
        console.log('Criando tabela "dados_sistema"...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS dados_sistema (
                id TEXT PRIMARY KEY,
                tipo TEXT NOT NULL,
                conteudo JSONB NOT NULL
            );
        `);

        // 2. Desativar o RLS para permitir acesso livre pela API do Node.js
        console.log('Desativando RLS na tabela...');
        await client.query(`
            ALTER TABLE dados_sistema DISABLE ROW LEVEL SECURITY;
        `);

        // 3. Inserir o Administrador Padrão automaticamente (jpkardozo / Magna#25.13)
        console.log('Injetando usuário administrador padrão...');
        const adminMaster = {
            id: 'admin_master_1',
            identificador: 'jpkardozo',
            nome: 'João Paulo Cardoso (Admin)',
            senha: 'Magna#25.13',
            papel: 'admin',
            matricula: '000000-0',
            cpf: '000.000.000-00',
            celular: '84-99999-9999',
            rg: '0000000',
            cnh: '000000000'
        };

        await client.query(`
            INSERT INTO dados_sistema (id, tipo, conteudo)
            VALUES ($1, $2, $3)
            ON CONFLICT (id) DO UPDATE SET conteudo = EXCLUDED.conteudo;
        `, ['usuario_sistema_admin_master_1', 'usuario_sistema', adminMaster]);

        console.log('sucesso: Banco do novo cliente configurado e pronto para uso!');

    } catch (err) {
        console.error('Erro ao configurar o banco do cliente:', err.message);
    } finally {
        await client.end();
    }
}

configurarNovoCliente();
