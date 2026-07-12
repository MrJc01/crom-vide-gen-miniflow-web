# Fluxo de Dados e Integração

Este documento detalha o ciclo de vida dos dados dentro do **Crom Vide Gen Miniflow**, desde a interface do usuário no navegador até a compilação final do arquivo MP4.

---

## 🔁 O Ciclo do Roteiro (UI para Vídeo)

A transformação ocorre em quatro etapas principais:

```text
[ Interface Web (index.html) ]
             │
             ▼ (Ação: Gerar Dados do Vídeo)
[ Objeto JSON Estruturado ]
             │
             ▼ (Ação: POST /api/render ou CLI -json)
[ Go Engine Parsing (videogen) ]
             │
             ▼ (Ação: Executar Pipeline FFmpeg)
[ Vídeo MP4 Renderizado ]
```

---

## 📊 Mapeamento: Estado da UI ➔ JSON do Template

Abaixo está o mapeamento detalhado de como os campos interativos do **Estúdio Web** são convertidos no payload JSON consumido pelo motor de renderização:

| Campo na Interface (index.html) | Propriedade no Estado JS (`scene`) | Estrutura Equivalente no JSON do Motor | Descrição / Transformação |
|:---|:---|:---|:---|
| **Número da Cena** | `index` (injetado no loop) | `"cards"[i].id` | Convertido em string identificadora (ex: `card_intro` ou `cena_01`). |
| **Seletor de Template** | `template` (valores `"1"`, `"2"`, `"3"`) | Mapeia para posições pré-definidas de layouts no motor | Define se o layout usará tela dividida, sobreposição de legenda ou zoom. |
| **Resolução** | `resolution` (ex: `"4K • 24fps"`) | `"resolution": { "width", "height" }` e `"fps"` | Traduzido em largura/altura física em pixels e taxa de quadros por segundo. |
| **Mídias do Take** | `mediaFiles` (Array de Blobs/URLs) | `"cards"[i].elements` com `type: "image"` ou `"video"` | Transforma a lista de arquivos enviados em elementos visuais posicionados. |
| **Texto de Narração** | `narration` (Textarea) | `"cards"[i].elements` com `type: "text"` | Injeta o texto como um elemento de legenda flutuante centralizado e formatado. |
| **Duração do Take** | `takeDuration` (Input número) | `"cards"[i].duration_ms` | O tempo em segundos (ex: `5.0`) é multiplicado por 1000 para virar milissegundos (`5000`). |
| **Volume do BG** | `bgVolume` (Range de 0 a 100) | `"audio_mixing".bgm_volume_percent` | Controla o ganho/atenuação da trilha de fundo global durante essa cena específica. |
| **Estilo das Legendas** | `subtitleStyle` (Select) | `"video_settings".subtitle_style` | Define a cor de realce (ex: Amarelo Destaque `#FFFF00` ou Branco Minimalista). |

---

## ⏱️ Regras de Sincronização de Tempo (Timing Engine)

Para garantir que o vídeo gerado seja dinâmico e agradável de assistir, o sistema utiliza duas métricas de tempo:

### 1. Duração Estimada da Narração (`audioDuration`)
Calculado dinamicamente enquanto o usuário digita a narração.
* **Fórmula**: 
  $$\text{Duração (segundos)} = \frac{\text{Quantidade de Palavras do Texto}}{2.3}$$
  *(Essa constante assume que uma locução natural em português tem uma cadência média de 140 palavras por minuto).*
* **Função**: Evita que o usuário configure um take rápido demais (ex: 2 segundos) para um roteiro longo de narração (ex: 30 palavras, que levariam ~13 segundos para ler), o que causaria o corte abrupto da voz sintetizada.

### 2. Duração Final do Take (`takeDuration`)
* Controla a duração visual do Card em tela.
* **Regra de Validação Automática**:
  Se `takeDuration` for menor do que a duração calculada para a narração (`audioDuration`), a interface web atualiza automaticamente a duração do take para `audioDuration + 1.0` segundo, garantindo uma folga de transição e impedindo o corte da fala.

---

## 🔗 Integração com o Backend

### Envio de Arquivos Locais
Quando mídias locais são adicionadas na interface, elas são criadas temporariamente como URLs locais em memória (`URL.createObjectURL`).
Para renderizar no backend real:
1. O frontend envia cada arquivo selecionado via multipart form para `POST /api/upload`.
2. A API responde com o caminho físico definitivo no disco do servidor (ex: `tmp/uploads/f47ac10b.mp4`).
3. O frontend atualiza o array de mídias substituindo as URLs de Blob pelo caminho retornado do servidor antes de gerar o payload final do template.
