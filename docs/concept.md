# Conceito e Visão Geral do Projeto

O **Crom Vide Gen Miniflow** foi concebido com uma premissa simples, porém poderosa: **tornar a criação e edição de vídeos tão fácil quanto preencher um formulário ou editar um documento de texto.**

Ele combina a facilidade de uso de uma interface web interativa com o poder de renderização automatizada e de alta performance de um motor nativo escrito em Go + FFmpeg.

---

## ⚠️ O Problema

A edição de vídeo tradicional é um processo trabalhoso que envolve:
1. **Curva de aprendizado íngreme** em softwares de edição profissional (Adobe Premiere, DaVinci Resolve, CapCut).
2. **Processamento manual repetitivo** para aplicar cortes de mídia, adicionar legendas sincronizadas, gerenciar trilhas de áudio e ajustar resoluções.
3. **Alto consumo de recursos locais** e tempo de renderização ocioso na máquina do editor.
4. **Dificuldade de escala**: Criar dezenas de variações de um mesmo vídeo (para testes A/B, múltiplos produtos ou diferentes idiomas) exige refazer o trabalho manualmente várias vezes.

---

## 💡 A Solução

O projeto propõe a **Geração de Vídeos Baseada em Dados (Data-Driven Video Generation)**. Em vez de editar trilhas de vídeo visualmente num canvas de tempo livre, o usuário estrutura o conteúdo em blocos lógicos sequenciais chamados **Cards** ou **Cenas**.

Cada Card possui:
* **Mídias associadas** (Imagens ou Vídeos de fundo).
* **Roteiro de narração** (que serve para estimar o tempo de áudio ou alimentar sistemas de Text-to-Speech).
* **Configurações de tempo** (tempo de tela daquele take).
* **Estilos e parâmetros visuais** (posição de elementos, legendas e mixagem de som).

Essa estrutura simplificada é empacotada em uma estrutura de dados **JSON**. O motor de renderização (escrito em Go) recebe esse arquivo de dados e reconstrói o vídeo do zero, quadro a quadro, de forma totalmente autônoma.

---

## 🔑 Conceitos Centrais

### 1. Storyboard Baseado em Cards (Cenas)
O vídeo final é uma colagem linear de cenas. Cada cena (Card) é isolada e auto-suficiente. Isso significa que você pode reordenar, duplicar ou remover partes do vídeo sem quebrar a sincronia das outras partes.

### 2. Desacoplamento entre Criação e Renderização
* **A Criação** ocorre no navegador ou através de qualquer sistema que consiga produzir um JSON. É leve, rápida e não exige poder gráfico.
* **A Renderização** ocorre no backend (servidor ou máquina local) usando processamento concorrente multi-core. Isso permite que a renderização seja delegada para servidores em nuvem dedicados.

### 3. Sincronização Inteligente de Tempos
Uma das maiores dificuldades de automatizar vídeos é casar o tempo da fala com o tempo que a imagem fica na tela. A interface calcula automaticamente o tempo estimado que uma pessoa levaria para ler o roteiro de narração de cada cena (baseando-se em uma média de ~140 palavras por minuto) e alerta o usuário para ajustar o tempo de tela do take condizente com a narração.

### 4. Templates Dinâmicos
O motor suporta layouts predefinidos (ex: Reels Dinâmico, Stories de Vendas, Documentário) que formatam automaticamente as proporções de tela, estilos de legendas e posicionamento de elementos gráficos sem que o usuário precise programar CSS ou ajustar posições manualmente.

---

## 🎯 Casos de Uso

* **Automação de Conteúdo para Redes Sociais**: Criação em massa de Reels, TikToks, Shorts a partir de planilhas ou roteiros gerados por inteligência artificial (ChatGPT, Gemini).
* **Notícias Rápidas (Breaking News)**: Geração instantânea de vídeos de notícias com base em artigos de texto e fotos do repositório.
* **Vídeos de Vendas e E-commerce**: Criação automática de vídeos promocionais dinâmicos injetando fotos dos produtos e preços diretamente em um template de ofertas.
* **Sistemas de Visualização de Dados**: Criação automática de relatórios animados em vídeo a partir de métricas de negócios mensais de uma empresa.
