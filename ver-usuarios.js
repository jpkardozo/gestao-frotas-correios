require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verificarUsuarios() {
    const { data, error } = await supabase
    .from('dados_sistema')
    .select('conteudo')
    .eq('tipo', 'usuario_sistema');

    if (error) {
        console.error('Erro ao buscar usuários:', error.message);
        return;
    }

    console.log(`\n📦 Total de usuários cadastrados no sistema: ${data.length}`);
    data.forEach((item, index) => {
        const u = item.conteudo;
        console.log(`${index + 1}. Nome: ${u.nome} | Identificador: ${u.identificador} | Papel: ${u.papel}`);
    });
    console.log('');
}

verificarUsuarios();
