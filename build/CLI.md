# CLI `videogen` — Guia de Uso Standalone

A ferramenta de linha de comando `videogen` permite renderizar vídeos diretamente a partir de templates JSON sem a necessidade de rodar a API REST ou interface gráfica.

---

## 🚀 Uso Básico

Para gerar um vídeo rapidamente, basta passar o caminho do template JSON e o nome do arquivo MP4 de saída desejado:

```bash
./videogen -json=caminho/do/template.json -out=video.mp4
```

---

## 🛠️ Parâmetros (Flags)

| Flag | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `-json` | `string` | `templates/sample_v1.json` | Caminho do arquivo JSON de template. |
| `-out` | `string` | `output_final.mp4` | Caminho e nome do arquivo de saída MP4. |
| `-workers` | `int` | `0` | Número de workers de renderização concorrente. `0` = detecta e usa todos os núcleos de CPU disponíveis de forma automática. |
| `-schema` | `bool` | `false` | Imprime a estrutura de cenas do template no terminal formatada textualmente de maneira legível e encerra a execução (útil para debug e documentação rápida). |
| `-version` | `bool` | `false` | Exibe a versão do sistema e encerra. |
| `-cpuprofile` | `string` | `""` | Habilita e grava o profile do uso de CPU no arquivo indicado (útil para diagnóstico de performance). |
| `-memprofile` | `string` | `""` | Habilita e grava o profile do uso de memória no arquivo indicado. |

---

## 🌐 Variáveis de Ambiente

As variáveis abaixo podem ser usadas para configurar os caminhos padrão caso você não queira passar as flags via CLI:

* `VIDEOGEN_JSON`: Define o caminho padrão para buscar o template.
* `VIDEOGEN_OUT`: Define o caminho de saída padrão para o arquivo final.
* `VIDEOGEN_WORKERS`: Define a quantidade padrão de workers para renderização paralela.

---

## 💡 Exemplos Práticos

### 1. Renderizar um vídeo simples
```bash
./videogen -json=templates/examples/breaking_news.json -out=breaking.mp4
```

### 2. Validar e visualizar o esquema do template (sem gerar vídeo)
```bash
./videogen -json=templates/examples/breaking_news.json -schema
```

*Exemplo de saída:*
```text
=========================================================================
 ESQUEMA DO TEMPLATE: breaking_news
=========================================================================
• Resolução: 1920x1080 (Aspect Ratio)
• FPS:        30 quadros por segundo
• Trilha Sonora Global: the_mountain-piano-background-487020.mp3
• Qualidade JPEG Temporário:   2 (escala 1 a 31)
• Total de Cenas (Cards):      1
-------------------------------------------------------------------------
 CENA #1 (ID: "card_news") | Duração: 6.00s (6000 ms) | Fundo: #00FF00
 Elementos e variáveis dinâmicas configuráveis:
   [1] 🎥 VÍDEO      | X:   960 | Y:   540 | Content: "video.mp4", Size: 1920x1080
   [2] ⏹️ RETÂNGULO  | X:   250 | Y:    80 | Color: gradient:#CC0000,#880000, Size: 500x80
   [3] 📝 TEXTO      | X:   250 | Y:    80 | Content: "BREAKING NEWS", Font Size: 40, Color: #FFFFFF
=========================================================================
```

### 3. Renderizar otimizando para máquina multi-core (Ex: 8 cores)
```bash
./videogen -json=template.json -out=video.mp4 -workers=8
```

---

## 🚥 Códigos de Saída (Exit Codes)

* `0`: Sucesso total. O arquivo MP4 foi gerado com sucesso.
* `1`: Erro. Indica problemas como JSON inválido, CroMedia falhou em codificar o vídeo, ou caminhos de assets incorretos.
