# API REST `videogen-server` — Guia de Referência

O servidor de API REST permite integrar a criação de vídeos de forma dinâmica e assíncrona por meio de requisições HTTP (comunicação AJAX, Fetch, Axios, ou curls do terminal).

---

## 🌐 Detalhes de Inicialização

* **Executar o Servidor**: `./videogen-server`
* **Porta Padrão**: `:8080` (Acesse `http://localhost:8080` ou `http://<IP_DA_REDE>:8080`)
* **CORS**: Habilitado por padrão (`Access-Control-Allow-Origin: *`) para qualquer requisição vinda de navegadores ou microserviços.

---

## 🧭 Endpoints Disponíveis

### 1. Modelos (Templates JSON)

#### `GET /api/templates`
Retorna uma lista com o ID dos templates salvos localmente na pasta `templates/examples/`.
* **Resposta (200 OK)**:
  ```json
  ["breaking_news", "teste", "multiscreen"]
  ```

#### `GET /api/templates/{id}`
Retorna o objeto JSON completo de um template específico.
* **Exemplo**: `GET /api/templates/breaking_news`
* **Resposta (200 OK)**: JSON do template selecionado.

#### `POST /api/templates/{id}`
Cria ou sobrescreve um template no disco local.
* **Body**: Objeto JSON de template válido.
* **Resposta (200 OK)**:
  ```json
  {"message": "Template saved successfully"}
  ```

#### `GET /api/templates/{id}/example`
Retorna o JSON do template e a renderização do seu esquema textual legível (útil para dashboards).
* **Resposta (200 OK)**:
  ```json
  {
    "template": { ... },
    "schema_print": "===================================\n ESQUEMA DO TEMPLATE...\n..."
  }
  ```

---

### 2. Preview Rápido

#### `POST /api/preview`
Gera e renderiza em tempo real uma imagem PNG correspondente ao primeiro frame do template JSON fornecido. Excelente para previews instantâneos antes de mandar renderizar o vídeo inteiro.
* **Body**: JSON completo do template.
* **Resposta (200 OK)**: Imagem PNG binária (`Content-Type: image/png`).

---

### 3. Geração de Vídeo (Renderização Assíncrona)

#### `POST /api/render`
Dispara um Job de renderização em segundo plano a partir de um template JSON.
* **Body**: JSON de template.
* **Resposta (200 OK)**:
  ```json
  {
    "job_id": "job_1782770088459",
    "message": "Rendering started"
  }
  ```
  *(Guarde o `job_id` para consultar o status de renderização).*

---

### 4. Controle e Monitoramento de Jobs

#### `GET /api/videos`
Retorna o status atual de todos os jobs de renderização (em andamento, concluídos ou com erro).
* **Resposta (200 OK)**:
  ```json
  {
    "job_1782770088459": {
      "id": "job_1782770088459",
      "template_id": "breaking_news",
      "status": "done",
      "file_path": "outputs/output_breaking_news_job_1782770088459.mp4",
      "render_duration_ms": 107633,
      "template": { ... },
      "created_at": "2026-06-29T18:54:48Z",
      "updated_at": "2026-06-29T18:56:36Z"
    }
  }
  ```
  *Nota: Os vídeos concluídos (`status: "done"`) ficam disponíveis para download no diretório `/outputs/*` (Exemplo: `http://localhost:8080/outputs/output_breaking_news_job_1782770088459.mp4`).*

#### `GET /api/videos/{id}`
Retorna informações detalhadas apenas do job consultado.

#### `PUT /api/videos/{id}`
Atualiza metadados do job, como categoria ou status de arquivamento.
* **Body**:
  ```json
  {
    "category": "Marketing",
    "archived": false
  }
  ```

#### `DELETE /api/videos/{id}`
Remove o registro do job do histórico e deleta o arquivo de vídeo MP4 gerado no disco.

---

### 5. Envio de Mídias e uploads

#### `POST /api/upload`
Envia arquivos de vídeo, imagem ou áudio para serem consumidos pelos templates.
* **Body**: `multipart/form-data` contendo o arquivo sob a chave `file`.
* **Resposta (200 OK)**:
  ```json
  {
    "path": "tmp/uploads/meu_video.mp4",
    "duration_ms": 60000
  }
  ```
  *(O campo `duration_ms` é calculado de forma automática para vídeos usando o decodificador nativo do CroMedia e retornado na resposta para facilitar o alinhamento de tempos).*

#### `GET /api/media`
Retorna uma árvore com todos os arquivos de mídia escaneados recursivamente dentro da pasta `tmp/uploads/`.
* **Resposta (200 OK)**:
  ```json
  {
    "/": [
      {
        "name": "musica.mp3",
        "path": "tmp/uploads/musica.mp3",
        "url": "http://localhost:8080/uploads/musica.mp3",
        "type": "audio",
        "size": 3418002
      }
    ]
  }
  ```

#### `GET /api/probe?path=...`
Detecta a duração do arquivo MP4 passado via query parameter `path` usando o motor do CroMedia.
* **Resposta (200 OK)**:
  ```json
  {
    "duration_ms": 60500
  }
  ```

---

## 🛠️ Pastas de Recursos Estáticos Expostas

* **`/outputs/*`** mapeia para a pasta física `outputs/`
* **`/uploads/*`** mapeia para a pasta física `tmp/uploads/`
