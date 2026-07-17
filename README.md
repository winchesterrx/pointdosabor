# 🍦 Point do Sabor — Sorveteria e Lanchonete

Cardápio digital para o **Point do Sabor**, sorveteria e lanchonete em Álvares Florence, SP.

## 📍 Informações
- **Endereço**: Rua Padre Diderico Michels, Álvares Florence - SP, 15540-000
- **Horário**: Segunda a Domingo, 13h às 22h
- **WhatsApp**: +55 17 99759-0846

## 🛠️ Tecnologias
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express
- **Banco de Dados**: MySQL (UH Server)

## 🚀 Como rodar

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
node server.js
```

### Banco de Dados
1. O banco `pointdosorvete` já está criado no UH Server
2. Execute o SQL para criar as tabelas:
   ```bash
   # Importe o arquivo pointdosabor.sql no phpMyAdmin ou MySQL CLI
   mysql -h pointdosorvete.mysql.uhserver.com -u pointdosorvete -p pointdosorvete < pointdosabor.sql
   ```
3. Ou rode o seed via Node.js (após as tabelas existirem):
   ```bash
   cd backend
   node seed-pointdosabor.js
   ```

## 📁 Estrutura
```
├── src/
│   ├── assets/          # Imagens (logo, backgrounds, produtos)
│   ├── components/menu/ # Componentes do cardápio
│   ├── data/menuData.ts # Dados e API helpers
│   ├── pages/           # Páginas (Index, Admin, Pedidos, Fidelidade)
│   └── contexts/        # Cart context
├── backend/
│   ├── server.js        # API Express
│   ├── db.js            # Conexão MySQL
│   ├── .env             # Credenciais do banco
│   └── seed-pointdosabor.js  # Script de seed
├── pointdosabor.sql     # Schema completo com dados iniciais
└── index.html           # Entry point
```
