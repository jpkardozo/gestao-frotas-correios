const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simulação de Banco de Dados em Memória
let db = {
  veiculos: [
    { id: 1, placa: 'ABC-1234', modelo: 'Fiat Uno 2020' },
    { id: 2, placa: 'XYZ-9876', modelo: 'Renault Logan 2022' }
  ],
  motoristas: [
    { id: 1, nome: 'João da Silva', cnh: '12345678900', categoria: 'B' },
    { id: 2, nome: 'Maria Oliveira', cnh: '98765432100', categoria: 'D' }
  ],
  viagens: []
};

// Rota Principal (Frontend HTML embutido)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Controle de Quilometragem - Logbook</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-50 text-gray-800 font-sans antialiased">
        <div class="max-w-6xl mx-auto p-6">
            <header class="mb-8 text-center">
                <h1 class="text-3xl font-bold text-indigo-600">🚗 Controle de Quilometragem e Frota</h1>
                <p class="text-gray-500 mt-1">Gerenciamento de veículos, motoristas, percursos e paradas</p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Cadastro de Veículo -->
                <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Cadastrar Veículo</h2>
                    <form id="form-veiculo" onsubmit="cadastrarVeiculo(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Placa</label>
                            <input type="text" id="placa" required placeholder="Ex: ABC-1234" class="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Modelo / Descrição</label>
                            <input type="text" id="modelo" required placeholder="Ex: Fiat Mobi 2023" class="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <button type="submit" class="w-full bg-indigo-600 text-white p-2 rounded-lg font-medium hover:bg-indigo-700 transition">Salvar Veículo</button>
                    </form>
                </div>

                <!-- Cadastro de Motorista -->
                <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 class="text-xl font-semibold mb-4 text-gray-700">Cadastrar Motorista</h2>
                    <form id="form-motorista" onsubmit="cadastrarMotorista(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Nome Completo</label>
                            <input type="text" id="nome-motorista" required placeholder="Ex: Carlos Silva" class="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Número da CNH</label>
                            <input type="text" id="cnh" required placeholder="Ex: 12345678900" class="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                        </div>
                        <button type="submit" class="w-full bg-emerald-600 text-white p-2 rounded-lg font-medium hover:bg-emerald-700 transition">Salvar Motorista</button>
                    </form>
                </div>
            </div>

            <!-- Iniciar Nova Viagem / Percurso -->
            <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
                <h2 class="text-xl font-semibold mb-4 text-gray-700">Registrar Nova Viagem / Percurso</h2>
                <form id="form-viagem" onsubmit="iniciarViagem(event)" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Veículo</label>
                            <select id="select-veiculo" required class="w-full mt-1 p-2 border rounded-lg bg-white"></select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Motorista</label>
                            <select id="select-motorista" required class="w-full mt-1 p-2 border rounded-lg bg-white"></select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Odômetro Inicial (km)</label>
                            <input type="number" id="odometro-inicial" required placeholder="Ex: 45000" class="w-full mt-1 p-2 border rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Hora de Saída</label>
                            <input type="datetime-local" id="hora-saida" required class="w-full mt-1 p-2 border rounded-lg">
                        </div>
                    </div>

                    <!-- Seção de Paradas Dinâmicas -->
                    <div class="border-t pt-4 mt-4">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-medium text-gray-700">Paradas do Percurso</h3>
                            <button type="button" onclick="adicionarParadaCampos()" class="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition">+ Adicionar Parada</button>
                        </div>
                        <div id="container-paradas" class="space-y-3">
                            <!-- Paradas inseridas via JS aparecerão aqui -->
                        </div>
                    </div>

                    <!-- Finalização da Viagem -->
                    <div class="border-t pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Odômetro Final (km)</label>
                            <input type="number" id="odometro-final" required placeholder="Ex: 45150" class="w-full mt-1 p-2 border rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Hora de Chegada Final</label>
                            <input type="datetime-local" id="hora-chegada" required class="w-full mt-1 p-2 border rounded-lg">
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition mt-4">Finalizar e Registrar Viagem</button>
                </form>
            </div>

            <!-- Relatório de Viagens -->
            <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 class="text-xl font-semibold mb-4 text-gray-700">Relatório de Viagens Realizadas</h2>
                <div class="overflow-x-auto">
                    <table class="w-auto min-w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-100 text-gray-600 text-sm">
                                <th class="p-3 border">ID</th>
                                <th class="p-3 border">Motorista / CNH</th>
                                <th class="p-3 border">Veículo</th>
                                <th class="p-3 border">Saída / Chegada</th>
                                <th class="p-3 border">Paradas Realizadas</th>
                                <th class="p-3 border">KM Rodados</th>
                                <th class="p-3 border">Tempo Gasto</th>
                            </tr>
                        </thead>
                        <tbody id="tabela-relatorio" class="text-sm text-gray-700">
                            <!-- Preenchido via JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            let contadorParadas = 0;

            async function carregarDados() {
                const res = await fetch('/api/dados');
                const data = await res.json();
                
                // Preencher Select Veículos
                const selVeiculo = document.getElementById('select-veiculo');
                selVeiculo.innerHTML = '<option value="">Selecione...</option>';
                data.veiculos.forEach(v => {
                    selVeiculo.innerHTML += \`<option value="\${v.id}">\${v.placa} - \${v.modelo}</option>\`;
                });

                // Preencher Select Motoristas
                const selMotorista = document.getElementById('select-motorista');
                selMotorista.innerHTML = '<option value="">Selecione...</option>';
                data.motoristas.forEach(m => {
                    selMotorista.innerHTML += \`<option value="\${m.id}">\${m.nome} (CNH: \${m.cnh})</option>\`;
                });

                // Preencher Tabela de Relatório
                const tbody = document.getElementById('tabela-relatorio');
                tbody.innerHTML = '';
                if(data.viagens.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gray-400">Nenhuma viagem registrada ainda.</td></tr>';
                } else {
                    data.viagens.forEach(v => {
                        let paradasHtml = v.paradas.length > 0 ? v.paradas.map((p, idx) => \`<div><strong>\${idx+1}ª Parada:</strong> Odômetro: \${p.odometro}km | Hora: \${new Date(p.hora).toLocaleString()}</div>\`).join('') : 'Nenhuma';
                        
                        tbody.innerHTML += \`
                            <tr class="border-b hover:bg-gray-50">
                                <td class="p-3 border">#\${v.id}</td>
                                <td class="p-3 border">\${v.motoristaNome}</td>
                                <td class="p-3 border">\${v.veiculoPlaca}</td>
                                <td class="p-3 border"><small>Saída: \${new Date(v.horaSaida).toLocaleString()}<br>Cheg: \${new Date(v.horaChegada).toLocaleString()}</small></td>
                                <td class="p-3 border">\${paradasHtml}</td>
                                <td class="p-3 border font-bold text-indigo-600">\${v.kmRodados} km</td>
                                <td class="p-3 border font-semibold text-emerald-600">\${v.tempoGasto}</td>
                            </tr>
                        \`;
                    });
                }
            }

            function adicionarParadaCampos() {
                contadorParadas++;
                const container = document.getElementById('container-paradas');
                const div = document.createElement('div');
                div.className = "flex gap-2 items-center bg-gray-50 p-3 rounded-lg border";
                div.id = \`parada-\${contadorParadas}\`;
                div.innerHTML = \`
                    <span class="font-medium text-sm text-gray-500">Parada \${contadorParadas}:</span>
                    <input type="number" placeholder="Odômetro (km)" class="p-1.5 border rounded w-1/3 parada-odometro" required>
                    <input type="datetime-local" class="p-1.5 border rounded w-1/2 parada-hora" required>
                    <button type="button" onclick="document.getElementById('parada-\${contadorParadas}').remove()" class="text-red-500 font-bold px-2">X</button>
                \`;
                container.appendChild(div);
            }

            async function cadastrarVeiculo(e) {
                e.preventDefault();
                const placa = document.getElementById('placa').value;
                const modelo = document.getElementById('modelo').value;
                await fetch('/api/veiculos', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ placa, modelo })
                });
                document.getElementById('form-veiculo').reset();
                carregarDados();
                alert('Veículo cadastrado com sucesso!');
            }

            async function cadastrarMotorista(e) {
                e.preventDefault();
                const nome = document.getElementById('nome-motorista').value;
                const cnh = document.getElementById('cnh').value;
                await fetch('/api/motoristas', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ nome, cnh })
                });
                document.getElementById('form-motorista').reset();
                carregarDados();
                alert('Motorista cadastrado com sucesso!');
            }

            async function iniciarViagem(e) {
                e.preventDefault();
                const veiculoId = document.getElementById('select-veiculo').value;
                const motoristaId = document.getElementById('select-motorista').value;
                const odometroInicial = parseFloat(document.getElementById('odometro-inicial').value);
                const horaSaida = document.getElementById('hora-saida').value;
                const odometroFinal = parseFloat(document.getElementById('odometro-final').value);
                const horaChegada = document.getElementById('hora-chegada').value;

                // Capturar paradas dinâmicas
                const paradasElements = document.querySelectorAll('#container-paradas > div');
                const paradas = [];
                paradasElements.forEach(el => {
                    const odometro = el.querySelector('.parada-odometro').value;
                    const hora = el.querySelector('.parada-hora').value;
                    paradas.push({ odometro: parseFloat(odometro), hora });
                });

                const dadosViagem = {
                    veiculoId: parseInt(veiculoId),
                    motoristaId: parseInt(motoristaId),
                    odometroInicial,
                    horaSaida,
                    odometroFinal,
                    horaChegada,
                    paradas
                };

                const res = await fetch('/api/viagens', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(dadosViagem)
                });

                if(res.ok) {
                    document.getElementById('form-viagem').reset();
                    document.getElementById('container-paradas').innerHTML = '';
                    carregarDados();
                    alert('Viagem registrada e calculada com sucesso!');
                } else {
                    const err = await res.json();
                    alert('Erro: ' + err.error);
                }
            }

            carregarDados();
        </script>
    </body>
    </html>
  `);
});

// APIs para manipulação dos dados
app.get('/api/dados', (req, res) => {
  res.json(db);
});

app.post('/api/veiculos', (req, res) => {
  const { placa, modelo } = req.body;
  const novoVeiculo = { id: db.veiculos.length + 1, placa, modelo };
  db.veiculos.push(novoVeiculo);
  res.status(201).json(novoVeiculo);
});

app.post('/api/motoristas', (req, res) => {
  const { nome, cnh } = req.body;
  const novoMotorista = { id: db.motoristas.length + 1, nome, cnh };
  db.motoristas.push(novoMotorista);
  res.status(201).json(novoMotorista);
});

app.post('/api/viagens', (req, res) => {
  const { veiculoId, motoristaId, odometroInicial, horaSaida, odometroFinal, horaChegada, paradas } = req.body;

  if (odometroFinal < odometroInicial) {
    return res.status(400).json({ error: 'O odômetro final não pode ser menor que o inicial.' });
  }

  const veiculo = db.veiculos.find(v => v.id === veiculoId);
  const motorista = db.motoristas.find(m => m.id === motoristaId);

  // Cálculo de KM Rodados
  const kmRodados = odometroFinal - odometroInicial;

  // Cálculo de Tempo Gasto Total
  const inicio = new Date(horaSaida);
  const fim = new Date(horaChegada);
  const diffMs = fim - inicio;
  
  let tempoGasto = 'Inválido';
  if (diffMs > 0) {
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    tempoGasto = `${diffHrs}h ${diffMins}m`;
  }

  const novaViagem = {
    id: db.viagens.length + 1,
    veiculoPlaca: veiculo ? veiculo.placa : 'Desconhecido',
    motoristaNome: motorista ? `${motorista.nome} (CNH: ${motorista.cnh})` : 'Desconhecido',
    odometroInicial,
    horaSaida,
    odometroFinal,
    horaChegada,
    paradas,
    kmRodados,
    tempoGasto
  };

  db.viagens.push(novaViagem);
  res.status(201).json(novaViagem);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});