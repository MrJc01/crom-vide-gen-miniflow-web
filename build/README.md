# Crom Vide Gen Miniflow - Standalone Build 🎬

Esta pasta contém os binários compilados e a documentação necessária para integrar o motor de geração de vídeos em outros projetos.

## 📦 Conteúdo do Build

Esta pasta possui os seguintes componentes:

1. **Binários**:
   - `videogen` — Ferramenta de linha de comando (CLI) para renderização direta de templates JSON.
   - `videogen-server` — Servidor de API REST HTTP que fornece endpoints para uploads, controle de jobs de renderização, salvamento de templates e visualização em tempo real (portas `:8080`).

2. **Documentação**:
   - [Guia da CLI (CLI.md)](file:///home/j/Documentos/GitHub/crom-vide-gen-miniflow/build/CLI.md) — Como rodar a ferramenta por linha de comando.
   - [Guia da API REST (API.md)](file:///home/j/Documentos/GitHub/crom-vide-gen-miniflow/build/API.md) — Referência de todos os endpoints HTTP do servidor.
   - [Estrutura do JSON (TEMPLATES.md)](file:///home/j/Documentos/GitHub/crom-vide-gen-miniflow/build/TEMPLATES.md) — Referência completa dos campos suportados no template JSON.

---

## ⚙️ Pré-requisitos do Sistema

Os binários são portáteis, compilados de forma estática e realizam o **bootstrapping automático** (extraem fontes e templates embutidos no primeiro uso).

Graças ao motor de engenharia de mídia **CroMedia** embutido, os binários rodam de forma 100% nativa em Go e **não necessitam de FFmpeg ou FFprobe instalados** no sistema operacional.

---

## 🚀 Como Executar

### 1. Renderização Direta via CLI (`videogen`)

Se você quer gerar um vídeo de forma programática ou via script bash/Python em outro projeto:

```bash
./videogen -json=caminho/do/template.json -out=video_final.mp4
```

### 2. Servidor Backend HTTP (`videogen-server`)

Se você deseja expor uma API para que outro backend ou frontend interaja com o motor de vídeo:

```bash
./videogen-server
```

O servidor iniciará por padrão na porta `:8080`.
Você pode enviar requisições HTTP para gerenciar o fluxo de mídias, criação de templates e renderização concorrente.

---

## 📁 Estrutura de Diretórios Gerada

Ao executar os binários pela primeira vez, a seguinte estrutura de arquivos será criada no diretório atual:

```text
.
├── assets/
│   └── fonts/          # Fontes usadas na renderização de textos (extraídas automaticamente)
├── templates/
│   └── examples/       # Exemplos de templates JSON (extraídos automaticamente)
├── tmp/
│   └── uploads/        # Pasta temporária para upload de mídias
└── outputs/            # Pasta onde são salvos os vídeos MP4 gerados pelo servidor
```

> **Dica**: Certifique-se de que o usuário que executa os binários tem permissão de escrita no diretório para criar essas pastas.
