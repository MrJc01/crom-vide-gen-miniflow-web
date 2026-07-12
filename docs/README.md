# Documentação do Projeto — Crom Vide Gen Miniflow 🎬

Bem-vindo à documentação oficial do **Crom Vide Gen Miniflow**. Esta pasta centraliza as explicações sobre a concepção, arquitetura, fluxos de dados e guias de uso do ecossistema de geração automática de vídeos.

---

## 📖 Índice da Documentação

Para compreender a fundo o projeto, explore os seguintes documentos:

1. **[Visão Geral e Conceito](concept.md)** — A ideia do projeto, o problema que ele resolve, seus objetivos e conceitos centrais (como cenas estruturadas em "cards").
2. **[Arquitetura do Sistema](architecture.md)** — O design arquitetural das três camadas (Estúdio Web, CLI Renderizador e API Server) e como elas se comunicam.
3. **[Fluxo de Dados e Integração](data_flow.md)** — Como os dados gerados na interface do usuário se convertem em especificações técnicas (JSON) e se transformam em arquivos de vídeo MP4 através do motor de renderização.

---

## 🛠️ O Ecossistema Num Relance

O projeto é dividido em três componentes complementares:

* **Estúdio Web (Frontend)**: Interface gráfica amigável (`index.html`) para montagem visual do roteiro, upload de mídias locais e definição de parâmetros de áudio e vídeo por cena.
* **CLI `videogen` (Core/Renderer)**: Binário de alta performance escrito em **Go** que consome um esquema JSON estruturado e orquestra o **FFmpeg** para gerar o arquivo de vídeo compilado.
* **API `videogen-server` (Backend)**: Servidor HTTP que expõe endpoints REST para gerenciamento de mídia, renderizações assíncronas de múltiplos vídeos em lote (jobs) e geração rápida de pré-visualizações (previews).

---

> [!NOTE]
> Para guias rápidos de integração dos binários e referências específicas de comando, consulte a pasta [build/](../build/).
