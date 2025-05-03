# CSV2PERT

> A zero-server PERT diagram generator: CSV → GraphML

---

## 🚀 Solution Architecture

```plaintext
[User's Browser]
     │
     │ 1. Upload CSV + click "Generate"
     │
     ▼
[Static Web App (index.html + JS libs via CDN)]
     │
     │ 2. PapaParse parses CSV into JS objects
     │ 3. graphlib builds DAG, runs topo­sort, forward/backward passes
     │ 4. Code generates GraphML text blob
     │
     ▼
[Download GraphML]
     │
     │ 5. User downloads "pert.graphml"
     │ 6. User imports into draw.io (File → Import)
     │
     ▼
[Editable PERT Diagram in draw.io]
```

---

## 📁 Project Structure

```
csv2pert/
├── index.html      # Single-page UI + all logic
├── example.csv     # Sample CSV to test the tool
└── README.md       # This file
```

---

## 🛠 Tech Stack & Modern Best Practices

| Layer              | Technology                                    | Rationale & Best Practices                                  |
|--------------------|-----------------------------------------------|--------------------------------------------------------------|
| **Markup & UI**    | HTML5                                         | Semantic, lightweight single-page app                        |
| **CSV Parsing**    | PapaParse (CDN)                               | Battle-tested, streaming parser, zero-config                 |
| **Graph Modeling** | graphlib (CDN)                                | In-browser DAG, topo-sort & graph algorithms                 |
| **PERT Logic**     | Vanilla ES6 JavaScript                        | No framework overhead; easy to maintain; modern syntax       |
| **Download API**   | Blob + `URL.createObjectURL`                  | Standard approach to generate and trigger client downloads   |
| **Hosting**        | GitHub Pages                                  | Free, zero-maintenance, GitOps for static sites              |
| **CI / CD**        | GitHub Actions (optional)                     | Linting, link-check, automated deploy to GitHub Pages        |
| **Quality**        | ESLint, Prettier (in GH Actions)              | Code consistency and correctness                             |
| **Documentation**  | Markdown + inline JSDoc comments              | Self-documenting code; easy-to-read project docs             |

---

## 🔧 Getting Started

1. **Clone the repo**  
   ```bash
   git clone https://github.com/<your-username>/csv2pert.git
   cd csv2pert
   ```

2. **Open in browser**  
   Double-click `index.html` or serve via `live-server`, `python -m http.server`, etc.

3. **Use**  
   - Upload your CSV (see Example CSV below).
   - Click "Generate GraphML".
   - Download and import into draw.io.

4. **Deploy**  
   Push to GitHub and enable Pages in repo settings (branch: main, folder: /root).

---

## 📖 Example CSV

Save the following as `example.csv` and upload it to the app:

```csv
task_id,o,m,p,dependencies
A,2,4,6,
B,1,2,3,A
C,3,5,9,A
D,2,3,4,B,C
E,1,1.5,2,A
F,4,6,8,C
G,2,3,5,E,F
```

### Column Descriptions
- **task_id**: Unique identifier for each task
- **o, m, p**: Optimistic, most likely, and pessimistic duration estimates
- **dependencies**: Comma-separated list of predecessor task IDs (leave blank if none)

The app will compute:
- TE (Expected time) = (o + 4m + p) / 6
- Variance = ((p − o) / 6)²
- ES/EF and LS/LF times
- Slack and Critical Path