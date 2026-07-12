# Referência do Schema JSON de Template

O motor `videogen` compõe vídeos a partir de especificações estruturadas em arquivos JSON. Este documento descreve as chaves, tipos e recursos disponíveis.

---

## 🏛️ Estrutura Raiz

```json
{
  "template_id": "nome_do_projeto",
  "resolution": { "width": 1920, "height": 1080 },
  "fps": 30,
  "audio_url": "tmp/uploads/trilha_sonora.mp3",
  "hwaccel": false,
  "jpeg_quality": 2,
  "cards": [ ... ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `template_id` | `string` | ✅ | Nome ou ID único do template (usar alfanuméricos e underscores). |
| `resolution` | `object` | ✅ | Resolução do vídeo de saída contendo `width` e `height`. |
| `resolution.width` | `int` | ✅ | Largura em pixels (máximo recomendado: 3840, ou seja, 4K). |
| `resolution.height` | `int` | ✅ | Altura em pixels (máximo recomendado: 2160). |
| `fps` | `int` | ✅ | Quadros por segundo do vídeo gerado (Ex: 24, 30, 60). |
| `audio_url` | `string` | ❌ | Caminho de arquivo local ou URL para a música/trilha de fundo global. |
| `hwaccel` | `bool` | ❌ | Se `true`, tenta usar aceleração de GPU NVIDIA (NVENC). Se falhar ou não tiver, usa CPU de fallback automaticamente. |
| `jpeg_quality` | `int` | ❌ | Nível de qualidade das imagens JPEG intermediárias geradas (1 = melhor qualidade/maior arquivo, 31 = pior qualidade/menor arquivo). Padrão: `2`. |
| `cards` | `array` | ✅ | Lista de cenas cronológicas (cards) que compõem o vídeo. |

---

## 🎞️ Cenas (Objeto `Card`)

Cada cena (`card`) possui uma cor de fundo, duração em milissegundos e uma lista de elementos visuais sobrepostos.

```json
{
  "id": "card_intro",
  "duration_ms": 5000,
  "background_color": "#1A1A2E",
  "elements": [ ... ]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | `string` | ✅ | Identificador único da cena. Útil para referências internas. |
| `duration_ms` | `int` | ✅ | Tempo de duração da cena em milissegundos (Mínimo: 1, Máximo: 1.800.000 ou 30 min). |
| `background_color` | `string` | ✅ | Cor sólida hexadecimal de fundo da cena (Ex: `#FF0000` ou `#000`). |
| `elements` | `array` | ❌ | Lista de camadas/elementos visuais desenhados sobre o fundo, ordenados de trás para frente. |

---

## 🎨 Elementos Visuais (Objeto `Element`)

Os elementos geométricos, textos e mídias que compõem a cena.

### Tipos de Elementos Suportados (`type`)
* `text`: Renderização de textos com suporte a alinhamento automático. A fonte padrão do motor é a Roboto.
* `image`: Imagem estática (formatos PNG ou JPEG) sobreposta na cena.
* `video`: Vídeo embutido. O motor extrai e renderiza os quadros do vídeo automaticamente usando o motor do CroMedia.
* `rect`: Desenha um retângulo. Suporta gradientes lineares.
* `circle`: Desenha um círculo preenchido.
* `polygon`: Desenha uma forma com múltiplos pontos de vértice.
* `frame`: Moldura estática decorativa.

---

### Campos Comuns a todos os Elementos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | `string` | O tipo do elemento (ver lista acima). |
| `x` | `float` | Posição horizontal no canvas (pixel 0 é a borda esquerda). |
| `y` | `float` | Posição vertical no canvas (pixel 0 é o topo). |
| `width` | `float` | Largura do elemento em pixels. |
| `height` | `float` | Altura do elemento em pixels. |
| `color` | `string` | Cor (`#HEX` ou `gradient:#HEX1,#HEX2`). Usado em textos e formas geométricas. |
| `rotation` | `float` | Ângulo de rotação do elemento em graus (Ex: `45`). |

---

### Campos Específicos

#### 1. Textos (`type: "text"`)
* `content` (`string`): O texto a ser escrito.
* `font_size` (`float`): O tamanho da fonte em pixels.
* `text_align` (`string`): Alinhamento horizontal do texto. Valores aceitos: `"left"`, `"center"`, `"right"`.

#### 2. Mídias (`type: "image"` ou `"video"`)
* `content` (`string`): Caminho do arquivo de imagem ou vídeo no disco local (ou URL).

#### 3. Polígonos (`type: "polygon"`)
* `points` (`array`): Array de coordenadas de vértices `[x, y]`.
  * *Exemplo*: `[[0, 0], [100, 0], [50, 80]]` desenha um triângulo.

---

### Efeitos Visuais Extras

#### 🌓 Sombras (Aplicável a qualquer elemento)
* `shadow_color` (`string`): Cor da sombra no formato hex e canal alpha opcional (`#RRGGBBAA`).
* `shadow_blur` (`float`): Força do desfoque (blur) da sombra.
* `shadow_offset_x` (`float`): Distância horizontal da sombra.
* `shadow_offset_y` (`float`): Distância vertical da sombra.

#### 🌈 Gradientes de Cor
Retângulos, círculos ou polígonos podem ser preenchidos com gradientes lineares horizontais de cor, especificando o atributo `color` da seguinte forma:
```json
"color": "gradient:#FF5733,#33FF57"
```

---

## 📝 Exemplo Completo de Template

```json
{
  "template_id": "exemplo_completo",
  "resolution": {
    "width": 1280,
    "height": 720
  },
  "fps": 24,
  "cards": [
    {
      "id": "intro",
      "duration_ms": 3000,
      "background_color": "#0F172A",
      "elements": [
        {
          "type": "rect",
          "x": 640,
          "y": 100,
          "width": 400,
          "height": 80,
          "color": "gradient:#F43F5E,#D946EF"
        },
        {
          "type": "text",
          "content": "BEM-VINDO AO MOTOR",
          "font_size": 40,
          "color": "#FFFFFF",
          "text_align": "center",
          "x": 640,
          "y": 140
        },
        {
          "type": "text",
          "content": "Renderizador programático super eficiente escrito em Go",
          "font_size": 24,
          "color": "#94A3B8",
          "text_align": "center",
          "x": 640,
          "y": 400
        }
      ]
    }
  ]
}
```
