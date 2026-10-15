require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Controle de Quilometragem e Rotas - Correios</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
    theme: {
        extend: {
            colors: {
                correiosAmarelo: '#FFCC00',
                correiosAzul: '#002F6C',
                correiosAmareloHover: '#E5B800',
                correiosAzulEscuro: '#001D42'
            }
        }
    }
}
</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body class="bg-gray-100 font-sans leading-normal tracking-normal text-gray-800">

<!-- TELA DE AUTENTICAÇÃO (LOGIN / REGISTRO) -->
<div id="auth-container" class="min-h-screen flex items-center justify-center p-4 bg-correiosAzul">
<div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-8 border-correiosAmarelo">
<div class="text-center mb-6">
<div class="bg-correiosAmarelo text-correiosAzul font-black text-2xl py-2 px-4 rounded inline-block shadow mb-2 tracking-wider">CORREIOS</div>
<h1 id="auth-titulo" class="text-xl font-bold text-correiosAzul">Controle de Frota e Percursos</h1>
</div>

<div id="auth-erro" class="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm hidden"></div>

<form id="form-auth" onsubmit="processarAuth(event)" class="space-y-4">
<div>
<label class="block text-sm font-semibold text-gray-700">E-mail Institucional:</label>
<input type="email" id="auth-email" required class="mt-1 block w-full border border-gray-300 rounded p-2.5 focus:ring-2 focus:ring-correiosAzul focus:outline-none">
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Senha:</label>
<input type="password" id="auth-senha" required class="mt-1 block w-full border border-gray-300 rounded p-2.5 focus:ring-2 focus:ring-correiosAzul focus:outline-none">
</div>
<button type="submit" id="btn-submit-auth" class="w-full bg-correiosAmarelo text-correiosAzul font-bold p-3 rounded shadow hover:bg-correiosAmareloHover transition">Acessar Sistema</button>
</form>

<div class="mt-4 text-center">
<button type="button" onclick="alternarModoAuth()" id="btn-alternar" class="text-sm text-correiosAzul font-medium hover:underline">Não possui conta? Cadastre-se</button>
</div>
</div>
</div>

<!-- PAINEL PRINCIPAL DO SISTEMA -->
<div id="app-container" class="container mx-auto p-4 max-w-6xl hidden">
<header class="bg-correiosAzul text-white p-6 rounded-lg shadow-md mb-6 flex flex-col md:flex-row justify-between items-center border-b-4 border-correiosAmarelo">
<div class="flex items-center space-x-4 mb-4 md:mb-0">
<div class="bg-correiosAmarelo text-correiosAzul font-black text-xl py-1.5 px-3 rounded shadow">CORREIOS</div>
<div>
<h1 class="text-2xl font-bold">Gestão de Quilometragem e Odômetro</h1>
<p class="text-blue-200 text-sm mt-0.5">Operador: <span id="user-email-display" class="font-semibold underline"></span></p>
</div>
</div>
<button onclick="fazerLogout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm shadow transition">Encerrar Sessão</button>
</header>

<!-- Navegação por Abas -->
<div class="flex flex-wrap gap-2 mb-6 border-b-2 border-gray-300 pb-3">
<button onclick="mudarAba('tab-viagem')" class="tab-btn bg-correiosAzul text-white px-5 py-2.5 rounded-md font-bold shadow-sm transition">Registrar Viagem</button>
<button onclick="mudarAba('tab-rotas')" class="tab-btn bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md font-bold hover:bg-gray-50 transition">Cadastrar Rotas</button>
<button onclick="mudarAba('tab-cadastros')" class="tab-btn bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md font-bold hover:bg-gray-50 transition">Veículos/Motoristas</button>
<button onclick="mudarAba('tab-relatorio')" class="tab-btn bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-md font-bold hover:bg-gray-50 transition">Relatório de Percursos</button>
</div>

<!-- ABA 1: REGISTRAR VIAGEM -->
<div id="tab-viagem" class="tab-content bg-white p-6 rounded-lg shadow-md border border-gray-200">
<h2 class="text-xl font-bold mb-4 text-correiosAzul border-b pb-2">Execução de Rota Planejada</h2>
<form id="form-viagem" onsubmit="salvarViagem(event)" class="space-y-4">
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<div>
<label class="block text-sm font-semibold text-gray-700">Selecione a Rota:</label>
<select id="v-rota" required onchange="carregarEstruturaRota()" class="mt-1 block w-full border border-gray-300 rounded p-2.5 bg-gray-50 focus:ring-2 focus:ring-correiosAzul focus:outline-none"></select>
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Veículo:</label>
<select id="v-veiculo" required class="mt-1 block w-full border border-gray-300 rounded p-2.5 bg-gray-50 focus:ring-2 focus:ring-correiosAzul focus:outline-none"></select>
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Motorista (CNH):</label>
<select id="v-motorista" required class="mt-1 block w-full border border-gray-300 rounded p-2.5 bg-gray-50 focus:ring-2 focus:ring-correiosAzul focus:outline-none"></select>
</div>
</div>

<div class="bg-blue-50 p-4 rounded-md border border-blue-200 mt-4">
<h3 class="font-bold text-correiosAzul mb-2" id="label-origem">Ponto de Saída (Origem)</h3>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block text-sm font-semibold text-gray-700">Odômetro Inicial (km):</label>
<input type="number" id="v-odometro-inicial" required class="mt-1 block w-full border border-gray-300 rounded p-2 bg-white">
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Hora de Saída:</label>
<input type="datetime-local" id="v-hora-saida" required class="mt-1 block w-full border border-gray-300 rounded p-2 bg-white">
</div>
</div>
</div>

<div class="border-t pt-4 mt-4">
<h3 class="text-lg font-bold text-correiosAzul mb-2">Preenchimento das Paradas da Rota</h3>
<div id="container-paradas-execucao" class="space-y-4">
<p class="text-sm text-gray-500 italic">Selecione uma rota acima para carregar as paradas planejadas.</p>
</div>
</div>

<div class="bg-amber-50 p-4 rounded-md border border-amber-200 mt-4">
<h3 class="font-bold text-amber-900 mb-2" id="label-destino">Ponto Final (Destino)</h3>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label class="block text-sm font-semibold text-gray-700">Odômetro Final (Chegada):</label>
<input type="number" id="v-odometro-final" required class="mt-1 block w-full border border-gray-300 rounded p-2 bg-white">
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Hora de Chegada Final:</label>
<input type="datetime-local" id="v-hora-chegada" required class="mt-1 block w-full border border-gray-300 rounded p-2 bg-white">
</div>
</div>
</div>

<button type="submit" class="w-full bg-correiosAmarelo text-correiosAzul font-bold p-3 rounded shadow hover:bg-correiosAmareloHover transition mt-6 text-base">Salvar Execução da Viagem</button>
</form>
</div>

<!-- ABA 2: CADASTRAR ROTAS -->
<div id="tab-rotas" class="tab-content hidden bg-white p-6 rounded-lg shadow-md border border-gray-200">
<h2 class="text-xl font-bold mb-4 text-correiosAzul border-b pb-2">Cadastrar Nova Rota Antecipada</h2>
<form onsubmit="salvarRota(event)" class="space-y-4">
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
<div>
<label class="block text-sm font-semibold text-gray-700">Nome da Rota:</label>
<input type="text" id="r-nome" required placeholder="Ex: Rota Umarizal - Pau dos Ferros" class="mt-1 block w-full border border-gray-300 rounded p-2.5">
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Local de Saída (Origem):</label>
<input type="text" id="r-origem" required placeholder="Ex: AC Umarizal" class="mt-1 block w-full border border-gray-300 rounded p-2.5">
</div>
<div>
<label class="block text-sm font-semibold text-gray-700">Local de Chegada (Destino):</label>
<input type="text" id="r-destino" required placeholder="Ex: AC Pau dos Ferros" class="mt-1 block w-full border border-gray-300 rounded p-2.5">
</div>
</div>

<div class="border-t pt-4">
<div class="flex justify-between items-center mb-2">
<h3 class="text-lg font-bold text-correiosAzul">Paradas Intermediárias</h3>
<button type="button" onclick="adicionarParadaRota()" class="bg-correiosAzul text-correiosAmarelo font-bold px-3 py-1.5 text-sm rounded shadow hover:bg-blue-900 transition">+ Adicionar Parada</button>
</div>
<div id="lista-paradas-rota" class="space-y-2"></div>
</div>

<button type="submit" class="bg-correiosAmarelo text-correiosAzul font-bold px-6 py-2.5 rounded shadow hover:bg-correiosAmareloHover transition mt-2">Salvar Rota</button>
</form>

<div class="mt-8 border-t pt-4">
<h3 class="font-bold text-correiosAzul mb-2">Rotas Já Cadastradas:</h3>
<div id="ul-rotas" class="space-y-2 text-sm text-gray-700"></div>
</div>
</div>

<!-- ABA 3: CADASTROS -->
<div id="tab-cadastros" class="tab-content hidden grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
<h2 class="text-xl font-bold mb-4 text-correiosAzul border-b pb-2">Cadastrar Veículo</h2>
<form onsubmit="salvarVeiculo(event)" class="space-y-4">
<div><label class="block text-sm font-semibold text-gray-700">Modelo:</label><input type="text" id="cad-modelo" required class="mt-1 block w-full border border-gray-300 rounded p-2.5"></div>
<div><label class="block text-sm font-semibold text-gray-700">Placa:</label><input type="text" id="cad-placa" required class="mt-1 block w-full border border-gray-300 rounded p-2.5"></div>
<button type="submit" class="bg-correiosAmarelo text-correiosAzul font-bold px-4 py-2 rounded shadow hover:bg-correiosAmareloHover transition">Salvar Veículo</button>
</form>
<div class="mt-4"><h3 class="font-bold text-correiosAzul mb-2">Veículos:</h3><ul id="ul-veiculos" class="list-disc pl-5 text-sm text-gray-700"></ul></div>
</div>

<div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
<h2 class="text-xl font-bold mb-4 text-correiosAzul border-b pb-2">Cadastrar Motorista</h2>
<form onsubmit="salvarMotorista(event)" class="space-y-4">
<div><label class="block text-sm font-semibold text-gray-700">Nome:</label><input type="text" id="cad-nome" required class="mt-1 block w-full border border-gray-300 rounded p-2.5"></div>
<div><label class="block text-sm font-semibold text-gray-700">CNH:</label><input type="text" id="cad-cnh" required class="mt-1 block w-full border border-gray-300 rounded p-2.5"></div>
<button type="submit" class="bg-correiosAmarelo text-correiosAzul font-bold px-4 py-2 rounded shadow hover:bg-correiosAmareloHover transition">Salvar Motorista</button>
</form>
<div class="mt-4"><h3 class="font-bold text-correiosAzul mb-2">Motoristas:</h3><ul id="ul-motoristas" class="list-disc pl-5 text-sm text-gray-700"></ul></div>
</div>
</div>

<!-- ABA 4: RELATÓRIO -->
<div id="tab-relatorio" class="tab-content hidden bg-white p-6 rounded-lg shadow-md border border-gray-200">
<h2 class="text-xl font-bold mb-4 text-correiosAzul border-b pb-2">Relatório de Viagens e Percursos</h2>
<div class="overflow-x-auto">
<table class="min-w-full divide-y divide-gray-200 border">
<thead class="bg-correiosAzul text-white">
<tr>
<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID / Rota</th>
<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Veículo / Motorista</th>
<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Saída / Chegada</th>
<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Km Rodados</th>
<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Tempo Gasto</th>
<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Paradas</th>
</tr>
</thead>
<tbody id="tabela-relatorio" class="bg-white divide-y divide-gray-200 text-sm"></tbody>
</table>
</div>
</div>
</div>

<script>
const supabaseClient = supabase.createClient('${SUPABASE_URL}', '${process.env.SUPABASE_KEY}');
let modoCadastro = false;
let contadorParadasRota = 0;
let rotasGlobais = [];

function alternarModoAuth() {
    modoCadastro = !modoCadastro;
    document.getElementById('auth-titulo').innerText = modoCadastro ? 'Criar Nova Conta - Correios' : 'Controle de Frota e Percursos';
    document.getElementById('btn-submit-auth').innerText = modoCadastro ? 'Cadastrar Usuário' : 'Acessar Sistema';
    document.getElementById('btn-alternar').innerText = modoCadastro ? 'Já possui conta? Faça login' : 'Não possui conta? Cadastre-se';
    document.getElementById('auth-erro').classList.add('hidden');
}

async function processarAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const senha = document.getElementById('auth-senha').value;
    const erroDiv = document.getElementById('auth-erro');
    erroDiv.classList.add('hidden');

    if (modoCadastro) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password: senha });
        if (error) {
            erroDiv.innerText = error.message;
            erroDiv.classList.remove('hidden');
        } else {
            alert('Cadastro realizado com sucesso! Faça login.');
            alternarModoAuth();
        }
    } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
        if (error) {
            erroDiv.innerText = 'E-mail ou senha incorretos.';
            erroDiv.classList.remove('hidden');
        } else {
            verificarSessao();
        }
    }
}

async function verificarSessao() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-email-display').innerText = session.user.email;
        carregarDadosIniciais();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }
}

async function fazerLogout() {
    await supabaseClient.auth.signOut();
    verificarSessao();
}

function mudarAba(abaId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('bg-correiosAzul', 'text-white');
        el.classList.add('bg-white', 'text-gray-700', 'border');
    });
    document.getElementById(abaId).classList.remove('hidden');
    event.currentTarget.classList.remove('bg-white', 'text-gray-700', 'border');
    event.currentTarget.classList.add('bg-correiosAzul', 'text-white');
    if(abaId === 'tab-relatorio') carregarRelatorio();
    if(abaId === 'tab-viagem') carregarDadosIniciais();
    if(abaId === 'tab-rotas') carregarRotasNaTela();
}

async function carregarDadosIniciais() {
    const resV = await fetch('/api/veiculos');
    const veiculos = await resV.json();
    document.getElementById('v-veiculo').innerHTML = veiculos.map(v => \`<option value="\${v.id}">\${v.modelo} (Placa: \${v.placa})</option>\`).join('');
    document.getElementById('ul-veiculos').innerHTML = veiculos.map(v => \`<li>\${v.modelo} (\${v.placa})</li>\`).join('');

    const resM = await fetch('/api/motoristas');
    const motoristas = await resM.json();
    document.getElementById('v-motorista').innerHTML = motoristas.map(m => \`<option value="\${m.id}">\${m.nome} (CNH: \${m.cnh})</option>\`).join('');
    document.getElementById('ul-motoristas').innerHTML = motoristas.map(m => \`<li>\${m.nome} - CNH: \${m.cnh}</li>\`).join('');

    const resR = await fetch('/api/rotas');
    rotasGlobais = await resR.json();
    const selectRota = document.getElementById('v-rota');
    selectRota.innerHTML = '<option value="">Selecione uma rota planejada...</option>' + rotasGlobais.map(r => \`<option value="\${r.id}">\${r.nome} (\${r.origem} ➔ \${r.destino})</option>\`).join('');
}

async function salvarVeiculo(e) {
    e.preventDefault();
    await fetch('/api/veiculos', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({modelo: document.getElementById('cad-modelo').value, placa: document.getElementById('cad-placa').value})
    });
    document.getElementById('cad-modelo').value = '';
    document.getElementById('cad-placa').value = '';
    carregarDadosIniciais();
    alert('Veículo cadastrado com sucesso!');
}

async function salvarMotorista(e) {
    e.preventDefault();
    await fetch('/api/motoristas', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nome: document.getElementById('cad-nome').value, cnh: document.getElementById('cad-cnh').value})
    });
    document.getElementById('cad-nome').value = '';
    document.getElementById('cad-cnh').value = '';
    carregarDadosIniciais();
    alert('Motorista cadastrado com sucesso!');
}

function adicionarParadaRota() {
    contadorParadasRota++;
    const div = document.createElement('div');
    div.className = "flex gap-2 items-center parada-rota-item bg-gray-50 p-2 rounded border";
    div.innerHTML = \`
    <span class="text-xs font-bold text-gray-600">Parada #\${contadorParadasRota}</span>
    <input type="text" name="localParada" placeholder="Nome do Local" required class="flex-1 border border-gray-300 rounded p-1.5 text-sm">
    <button type="button" onclick="this.parentElement.remove()" class="text-red-600 font-bold px-2">X</button>
    \`;
    document.getElementById('lista-paradas-rota').appendChild(div);
}

async function salvarRota(e) {
    e.preventDefault();
    const nome = document.getElementById('r-nome').value;
    const origem = document.getElementById('r-origem').value;
    const destino = document.getElementById('r-destino').value;
    const paradas = [];
    document.querySelectorAll('.parada-rota-item').forEach(el => {
        paradas.push(el.querySelector('input[name="localParada"]').value);
    });

    await fetch('/api/rotas', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nome, origem, destino, paradas})
    });

    document.getElementById('r-nome').value = '';
    document.getElementById('r-origem').value = '';
    document.getElementById('r-destino').value = '';
    document.getElementById('lista-paradas-rota').innerHTML = '';
    carregarRotasNaTela();
    alert('Rota salva com sucesso!');
}

async function carregarRotasNaTela() {
    const res = await fetch('/api/rotas');
    const rotas = await res.json();
    const container = document.getElementById('ul-rotas');
    if(rotas.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic">Nenhuma rota cadastrada.</p>';
        return;
    }
    container.innerHTML = rotas.map(r => \`
    <div class="p-3 border rounded bg-gray-50 border-l-4 border-l-correiosAmarelo">
    <b>\${r.nome}</b> ➔ Saída: \${r.origem} | Destino: \${r.destino}<br>
    <span class="text-xs text-gray-500">Paradas: \${r.paradas.length > 0 ? r.paradas.join(' ➔ ') : 'Nenhuma'}</span>
    </div>
    \`).join('');
}

function carregarEstruturaRota() {
    const rotaId = document.getElementById('v-rota').value;
    const container = document.getElementById('container-paradas-execucao');
    if(!rotaId) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic">Selecione uma rota acima.</p>';
        return;
    }
    const rota = rotasGlobais.find(r => r.id == rotaId);
    if(!rota) return;

    document.getElementById('label-origem').innerText = 'Saída (Origem): ' + rota.origem;
    document.getElementById('label-destino').innerText = 'Destino Final: ' + rota.destino;

    if(rota.paradas.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic">Sem paradas intermediárias.</p>';
        return;
    }

    container.innerHTML = rota.paradas.map((local, idx) => \`
    <div class="p-4 border rounded-md bg-gray-50 space-y-3 parada-execucao-item border-l-4 border-l-correiosAzul" data-local="\${local}">
    <h4 class="font-bold text-correiosAzul">Parada #\${idx+1}: \${local}</h4>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div><label class="block text-xs font-semibold text-gray-700">Hora Chegada:</label><input type="datetime-local" name="horaChegada" required class="mt-1 block w-full border border-gray-300 rounded p-1.5 text-sm bg-white"></div>
    <div><label class="block text-xs font-semibold text-gray-700">Hodômetro Chegada (km):</label><input type="number" name="odoChegada" required class="mt-1 block w-full border border-gray-300 rounded p-1.5 text-sm bg-white"></div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div><label class="block text-xs font-semibold text-gray-700">Hora Saída:</label><input type="datetime-local" name="horaSaida" required class="mt-1 block w-full border border-gray-300 rounded p-1.5 text-sm bg-white"></div>
    <div><label class="block text-xs font-semibold text-gray-700">Hodômetro Saída (km):</label><input type="number" name="odoSaida" required class="mt-1 block w-full border border-gray-300 rounded p-1.5 text-sm bg-white"></div>
    </div>
    </div>
    \`).join('');
}

async function salvarViagem(e) {
    e.preventDefault();
    const rotaId = document.getElementById('v-rota').value;
    const veiculoId = document.getElementById('v-veiculo').value;
    const motoristaId = document.getElementById('v-motorista').value;
    const odometroInicial = parseFloat(document.getElementById('v-odometro-inicial').value);
    const horaSaida = document.getElementById('v-hora-saida').value;
    const odometroFinal = parseFloat(document.getElementById('v-odometro-final').value);
    const horaChegada = document.getElementById('v-hora-chegada').value;

    const paradasExecutadas = [];
    document.querySelectorAll('.parada-execucao-item').forEach(el => {
        paradasExecutadas.push({
            local: el.getAttribute('data-local'),
                               horaChegada: el.querySelector('input[name="horaChegada"]').value,
                               odoChegada: parseFloat(el.querySelector('input[name="odoChegada"]').value),
                               horaSaida: el.querySelector('input[name="horaSaida"]').value,
                               odoSaida: parseFloat(el.querySelector('input[name="odoSaida"]').value)
        });
    });

    await fetch('/api/viagens', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ rotaId, veiculoId, motoristaId, odometroInicial, horaSaida, odometroFinal, horaChegada, paradas: paradasExecutadas })
    });

    alert('Execução de viagem salva com sucesso!');
    document.getElementById('form-viagem').reset();
    document.getElementById('container-paradas-execucao').innerHTML = '<p class="text-sm text-gray-500 italic">Selecione uma rota acima.</p>';
}

async function carregarRelatorio() {
    const res = await fetch('/api/viagens');
    const viagensList = await res.json();
    const tbody = document.getElementById('tabela-relatorio');

    if(viagensList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">Nenhuma viagem registrada.</td></tr>';
        return;
    }

    tbody.innerHTML = viagensList.map(v => {
        let htmlParadas = v.paradas.length > 0 ? v.paradas.map((p, idx) => \`
        <div class="text-xs bg-gray-50 p-1.5 rounded mb-1 border">
        <b>#\${idx+1} - \${p.local}</b><br>
        Chegada: \${new Date(p.horaChegada).toLocaleString()} (\${p.odoChegada} km)<br>
        Saída: \${new Date(p.horaSaida).toLocaleString()} (\${p.odoSaida} km)
        </div>
        \`).join('') : '<span class="text-gray-400">Sem paradas</span>';

        return \`
        <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 font-semibold text-gray-900">\${v.rotaNome}<br><span class="text-xs text-gray-500">\${new Date(v.horaSaida).toLocaleDateString()}</span></td>
        <td class="px-4 py-3"><b>\${v.veiculoModelo}</b> (\${v.veiculoPlaca})<br><span class="text-xs text-gray-600">\${v.motoristaNome}</span></td>
        <td class="px-4 py-3 text-xs">Saída: \${new Date(v.horaSaida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}<br>Chegada: \${new Date(v.horaChegada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
        <td class="px-4 py-3 font-bold text-correiosAzul">\${v.kmRodados} km</td>
        <td class="px-4 py-3 text-gray-700">\${v.tempoGasto}</td>
        <td class="px-4 py-3">\${htmlParadas}</td>
        </tr>
        \`;
    }).join('');
}

window.onload = verificarSessao;
</script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlTemplate));

app.get('/api/veiculos', async (req, res) => res.json(await buscarDadosPorTipo('veiculo')));
app.post('/api/veiculos', async (req, res) => {
    const novo = { id: Date.now(), ...req.body };
    await salvarDadoSupabase('veiculo', novo);
    res.status(201).json(novo);
});

app.get('/api/motoristas', async (req, res) => res.json(await buscarDadosPorTipo('motorista')));
app.post('/api/motoristas', async (req, res) => {
    const novo = { id: Date.now(), ...req.body };
    await salvarDadoSupabase('motorista', novo);
    res.status(201).json(novo);
});

app.get('/api/rotas', async (req, res) => res.json(await buscarDadosPorTipo('rota')));
app.post('/api/rotas', async (req, res) => {
    const novo = { id: Date.now(), ...req.body };
    await salvarDadoSupabase('rota', novo);
    res.status(201).json(novo);
});

app.get('/api/viagens', async (req, res) => {
    const veiculos = await buscarDadosPorTipo('veiculo');
    const motoristas = await buscarDadosPorTipo('motorista');
    const rotas = await buscarDadosPorTipo('rota');
    const viagens = await buscarDadosPorTipo('viagem');

    const formatadas = viagens.map(v => {
        const veiculo = veiculos.find(ve => ve.id == v.veiculoId) || {};
        const motorista = motoristas.find(m => m.id == v.motoristaId) || {};
        const rota = rotas.find(r => r.id == v.rotaId) || {};

        const kmRodados = v.odometroFinal - v.odometroInicial;
        const diffMs = new Date(v.horaChegada) - new Date(v.horaSaida);
        const horas = Math.floor(diffMs / (1000 * 60 * 60));
        const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const tempoGasto = `${horas}h ${minutos}m`;

        return {
            ...v,
            rotaNome: rota.nome || 'Rota Avulsa',
            veiculoModelo: veiculo.modelo || 'Desconhecido',
            veiculoPlaca: veiculo.placa || '---',
            motoristaNome: motorista.nome || 'Desconhecido',
            kmRodados,
            tempoGasto
        };
    });
    res.json(formatadas);
});

app.post('/api/viagens', async (req, res) => {
    const novaViagem = { id: Date.now(), ...req.body };
    await salvarDadoSupabase('viagem', novaViagem);
    res.status(201).json(novaViagem);
});

app.listen(PORT, () => {
    console.log(`Sistema com Identidade Visual dos Correios rodando em http://localhost:${PORT}`);
});
