# 📦 Sistema de Gestão de Frota e Quilometragem — Correios

Sistema web institucional desenvolvido para o controle de quilometragem, hodômetros, rotas e frotas, inspirado na identidade visual e nos padrões operacionais dos Correios.

---

## 🚀 Tecnologias Utilizadas

* **Backend:** Node.js com Express
* **Frontend:** Single Page Application (SPA) em arquivo único, utilizando **Tailwind CSS** para estilização responsiva e JavaScript Vanilla.
* **Banco de Dados & Autenticação:** Supabase (PostgreSQL + Supabase Auth) com armazenamento flexível em formato `JSONB`.
* **Identidade Visual:** Padrão oficial dos Correios (Amarelo institucional `#FFCC00` e Azul `#002F6C`).

---

## 👥 Perfis de Acesso e Regras

O sistema conta com dois níveis de permissão gerenciados via autenticação segura:

1. **Supervisor (Gestor):**
   * Acesso completo às abas de cadastro.
   * Cadastra novas **Rotas Antecipadas** (com paradas intermediárias, origem e destino).
   * Gerencia o cadastro de **Veículos** (Modelo e Placa) e **Motoristas** (Nome e CNH).
   * Realiza a **Atribuição de Escala** (vincula diretamente um motorista a um veículo e a uma rota específica).
   * Visualiza o **Relatório Geral** consolidado de todas as viagens realizadas pela frota.

2. **Motorista:**
   * Acesso restrito à execução de viagens.
   * Visualiza exclusivamente a **Rota e o Veículo** que foram designados a ele pelo supervisor.
   * Preenche o odômetro inicial, horários e os dados de odômetro/horário de cada parada intermediária até a chegada final.
   * Consulta o histórico de percursos realizados.

---

## ⚙️ Pré-requisitos e Instalação Local

1. Tenha o **Node.js** instalado na sua máquina.
2. Clone este repositório ou baixe os arquivos do projeto.
3. Instale as dependências executando no terminal:
   ```bash
   npm install
