Ficha D&D - Character Sheet Digital
[ [ [

📖 O que é
Ficha D&D é uma aplicação web offline-first para criar, editar e gerenciar fichas digitais completas de personagens para jogos de RPG de mesa no estilo D&D 5e. Funciona perfeitamente em celular e desktop, com foco em usabilidade durante sessões reais de jogo.

🎯 Para quem
Jogadores de RPG que querem fichas digitais práticas

Mesas que precisam de acesso rápido a stats durante combate

Quem quer criar personagens sem depender de internet

Mestres que precisam de visão rápida de vários personagens

✨ Funcionalidades
✅ Criação guiada de personagem (passo a passo)
✅ Persistência local (IndexedDB - seus dados ficam no seu dispositivo)
✅ Upload de retrato personalizado
✅ Galeria de avatares genéricos
✅ Cálculos automáticos (modificadores, proficiências, saves, etc.)
✅ Level up automatizado com escolhas guiadas
✅ Modo sessão otimizado para jogo
✅ Rolador de dados integrado
✅ Export/Import JSON (compartilhamento por arquivo)
✅ Responsivo mobile-first
✅ Tema claro/escuro
✅ Sem backend obrigatório

🛠️ Tecnologias
text
Frontend: React + Tailwind CSS
Persistência: IndexedDB + localStorage
Design: Mobile-first, PWA-ready
APIs: D&D 5e SRD (cache local)
Sem dependências externas obrigatórias
🚀 Como usar
1. Clone o projeto
bash
git clone https://github.com/SEU_USERNAME/dd-character-sheet.git
cd dd-character-sheet
2. Instalar dependências
bash
npm install
# ou
yarn install
3. Rodar localmente
bash
npm start
# ou
yarn start
4. Acessar
Abra http://localhost:3000 no navegador

📱 Funcionamento Offline
Dados ficam salvos no navegador (IndexedDB)

Cache local de compêndio (raças, classes, magias)

Funciona sem internet após primeiro uso

⚠️ Faça backup regular (Export → JSON)

📁 Estrutura do Projeto
text
src/
├── components/     # Componentes React reutilizáveis
├── hooks/          # Custom hooks (useCharacter, useIndexedDB)
├── data/           # Schemas e modelos locais
├── utils/          # Funções utilitárias (dice roller, calculations)
├── styles/         # Tailwind + CSS customizado
└── App.jsx         # Componente principal
🎮 Modos de Uso
Modo Edição Completa
Criação passo a passo

Edição detalhada de ficha

Level up guiado

Homebrew/customizações

Modo Sessão
HP, CA, iniciativa em destaque

Ações rápidas

Rolagem de dados

Rastreador de condições/recursos

📤 Backup e Compartilhamento
Exportar: Menu → Export → JSON

Compartilhar: Envie o arquivo para outro jogador

Importar: Menu → Import → selecione arquivo

Sem necessidade de conta ou servidor!

⚠️ Limitações Atuais
Dados presos ao dispositivo (faça backup!)

Conteúdo limitado ao SRD público

Multiclasse básica (sem regras avançadas)

Sem sincronização em nuvem (planejado)

🔮 Próximos Passos
Sincronização Supabase (multi-dispositivo)

Modo Mestre (visão múltiplas fichas)

PDF export melhorado

Validação avançada de regras

PWA completa (instalável)

🤝 Contribuições
Fork o projeto

Crie uma branch feat/nova-funcionalidade

Commit com mensagens claras

Push e abra Pull Request

📄 Licença
MIT License - veja LICENSE


