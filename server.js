require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function buscarDadosPorTipo(tipo) {
    const { data, error } = await supabase.from('dados_sistema').select('conteudo').eq('tipo', tipo);
    if (error) {
        console.error('Erro ao buscar do Supabase:', error.message);
        return [];
    }
    return data.map(item => item.conteudo);
}

async function salvarDadoSupabase(tipo, conteudo) {
    const id = conteudo.id ? conteudo.id.toString() : Date.now().toString();
    const { error } = await supabase.from('dados_sistema').upsert({
        id: `${tipo}_${id}`,
        tipo: tipo,
        conteudo: conteudo
    });
    if (error) console.error('Erro ao salvar no Supabase:', error.message);
}

async function deletarDadoSupabase(idSupabase) {
    const { error } = await supabase.from('dados_sistema').delete().eq('id', idSupabase);
    if (error) console.error('Erro ao deletar do Supabase:', error.message);
}

async function inicializarAdminPadrao() {
    const usuarios = await buscarDadosPorTipo('usuario_sistema');
    const adminExiste = usuarios.find(u => u.identificador === 'jpkardozo');
    if (!adminExiste) {
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
        await salvarDadoSupabase('usuario_sistema', adminMaster);
        console.log('Administrador padrão (jpkardozo) criado com sucesso!');
    }
}
inicializarAdminPadrao();

app.get('/api/usuarios', async (req, res) => res.json(await buscarDadosPorTipo('usuario_sistema')));
app.post('/api/usuarios', async (req, res) => {
    const novo = { id: Date.now(), ...req.body };
    await salvarDadoSupabase('usuario_sistema', novo);
    res.status(201).json(novo);
});

app.get('/api/veiculos', async (req, res) => res.json(await buscarDadosPorTipo('veiculo')));
app.post('/api/veiculos', async (req, res) => { const novo = { id: Date.now(), ...req.body }; await salvarDadoSupabase('veiculo', novo); res.status(201).json(novo); });

app.get('/api/motoristas', async (req, res) => res.json(await buscarDadosPorTipo('motorista')));
app.post('/api/motoristas', async (req, res) => { const novo = { id: Date.now(), ...req.body }; await salvarDadoSupabase('motorista', novo); res.status(201).json(novo); });

app.get('/api/rotas', async (req, res) => res.json(await buscarDadosPorTipo('rota')));
app.post('/api/rotas', async (req, res) => { const novo = { id: Date.now(), ...req.body }; await salvarDadoSupabase('rota', novo); res.status(201).json(novo); });

app.get('/api/atribuicoes', async (req, res) => res.json(await buscarDadosPorTipo('atribuicao')));
app.post('/api/atribuicoes', async (req, res) => { const novo = { id: Date.now(), ...req.body }; await salvarDadoSupabase('atribuicao', novo); res.status(201).json(novo); });

app.get('/api/alertas', async (req, res) => res.json(await buscarDadosPorTipo('alerta_sistema')));
app.post('/api/alertas', async (req, res) => {
    const novo = { id: Date.now(), ...req.body };
    await salvarDadoSupabase('alerta_sistema', novo);
    res.status(201).json(novo);
});

app.get('/api/viagens', async (req, res) => {
    const veiculos = await buscarDadosPorTipo('veiculo');
    const motoristas = await buscarDadosPorTipo('motorista');
    const rotas = await buscarDadosPorTipo('rota');
    const viagens = await buscarDadosPorTipo('viagem');

    res.json(viagens.map(v => {
        const veiculo = veiculos.find(ve => ve.id == v.veiculoId) || {};
        const motorista = motoristas.find(m => m.id == v.motoristaId) || {};
        const rota = rotas.find(r => r.id == v.rotaId) || {};
        const diffMs = new Date(v.horaChegada) - new Date(v.horaSaida);
        const horas = Math.floor(diffMs / 3600000);
        const minutos = Math.floor((diffMs % 3600000) / 60000);
        return {
            ...v,
            rotaNome: rota.nome || 'Rota',
            veiculoModelo: veiculo.modelo || '-',
            veiculoPlaca: veiculo.placa || '-',
            motoristaNome: motorista.nome || '-',
            kmRodados: (v.odometroFinal - v.odometroInicial),
                         tempoGasto: `${horas}h ${minutos}m`
        };
    }));
});

app.post('/api/viagens', async (req, res) => {
    const nova = { ...req.body };
    await salvarDadoSupabase('viagem', nova);
    res.status(201).json(nova);
});

app.delete('/api/viagens/:id', async (req, res) => {
    await deletarDadoSupabase('viagem_' + req.params.id);
    res.json({ success: true });
});

app.listen(PORT, () => { console.log(`Sistema Correios (Ficha Oficial & Painel Master) em http://localhost:${PORT}`); });
