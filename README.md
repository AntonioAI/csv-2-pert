# CSV to PERT XML Converter

## 📋 Overview

This project is a web-based utility that transforms project task data from a CSV file into an XML format suitable for import into draw.io / diagrams.net. This allows users to easily generate PERT (Program Evaluation and Review Technique) charts from their task lists, aiding in project management and visualization of task dependencies, durations, and critical paths.

The application performs PERT calculations (Expected Time, Variance, Early Start, Early Finish, Late Start, Late Finish, Slack) and identifies critical tasks and potential bottlenecks. The output XML can be directly imported into draw.io to render a PERT chart.

**Preview of Draw.io Output:**

![PERT Chart Diagram](./assets/example_pert_diagram.svg)

**(Example of how it might look after auto-arrangement in draw.io)**

## 📁 Project Structure

```
.
├── index.html            # Main HTML page for the user interface
├── styles.css            # CSS styles for the application (primarily Tailwind utility classes)
├── csvParser.js          # Module for parsing and validating the uploaded CSV file
├── pertCalculator.js     # Module for performing PERT calculations and graph analysis
├── xmlGenerator.js       # Module for generating the draw.io compatible XML output
├── ui.js                 # Module for handling UI interactions, events, and DOM manipulation
└── README.md             # This file
```

## ✨ Features

* **CSV Upload:** Easy drag-and-drop or browse to upload a CSV file containing task data.
* **Input Validation:** Comprehensive validation of CSV headers, data types, and logical consistency (e.g., optimistic time <= most likely time <= pessimistic time, valid dependencies).
* **PERT Calculations:** Automatically calculates:
    * Expected Time (TE)
    * Variance
    * Early Start (ES)
    * Early Finish (EF)
    * Late Start (LS)
    * Late Finish (LF)
    * Slack
* **Critical Path Identification:** Highlights tasks that are on the critical path (slack = 0).
* **Bottleneck Identification:** Highlights tasks that are potential bottlenecks (slack > 0 and <= 1.0, as defined in `pertCalculator.js`).
* **Cycle Detection:** Detects and reports circular dependencies in the task list.
* **XML Generation:** Produces an mxGraph XML file compatible with draw.io / diagrams.net.
* **User-Friendly Interface:** Simple and intuitive web interface with clear instructions and feedback messages.
* **Timestamped Output:** Generated XML files are automatically named with a timestamp (format: `pert_chart_YYYYMMDD_HHMMSS.xml`) for easy versioning.

## 🚀 Setup & Usage

1. **Clone** this repo:

   ```bash
   git clone https://github.com/AntonioAI/csv-2-pert.git
   cd csv-2-pert
   ```
2.  Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).

## 🔧 How It Works

1.  **Download Template:** Click the "Download CSV Template" button on the page to get a pert_template.csv file with the correct headers and example data.
2.  **Prepare Your CSV:**  Edit the template with your own project tasks. Make sure your task_ids are unique and that dependencies are listed correctly.
3.  **Upload CSV:** Drag your CSV file onto the designated area or click to browse and select it. The app will immediately parse and validate the file, showing a success or error message.
4.  **Generate XML:** Once the CSV is successfully parsed, click the "Generate PERT XML" button.
5.  **Download & Import:** The generated XML file is automatically downloaded by your browser. You can then import this file into [draw.io / diagrams.net](https://app.diagrams.net/) (File > Import from > Device) to visualize your PERT chart.

> Tip: After importing, use draw.io’s **Arrange → Layout** features (e.g., "Horizontal Flow") for an optimal chart layout.

![PERT Chart Diagram](./docs/flowchart.svg)

## 📝 CSV File Format <span id="csv-file-format"></span>

The CSV file must contain a header row with the following columns, in any order:

| Column             | Type   | Description                                      |
| ------------------ | ------ | ------------------------------------------------ |
| `task_id`          | string | Unique task identifier (required)                |
| `description`      | string | Task details (optional)                          |
| `optimistic_time`  | number | Minimum completion time (≥ 0)                    |
| `most_likely_time` | number | Expected completion time (≥ 0)                   |
| `pessimistic_time` | number | Maximum completion time (≥ 0)                    |
| `dependencies`     | string | Comma-separated `task_id`s (leave empty if none) |

For tasks having > 1 dependencies, list them separated by commas and enclose the comma-separated list in quotes (e.g., `"T1,T2"`).

**Example CSV Content:**

```csv
task_id,description,optimistic_time,most_likely_time,pessimistic_time,dependencies
T1,Requirement Gathering,3,5,10,
T2,Design Phase,4,6,12,T1
T3,Development - Module A,5,8,15,T2
T4,Development - Module B,6,9,18,T2
T5,Integration,2,3,5,"T3,T4"
T6,Testing,3,5,8,T5
T7,Documentation,1,2,3,T2
T8,Deployment,1,1,2,"T6,T7"
```

**Validation Rules enforced by `csvParser.js`:**
* All required headers must be present.
* `task_id` must be unique and non-empty.
* `optimistic_time`, `most_likely_time`, `pessimistic_time` must be non-negative numbers.
* The time estimates must follow the rule: `optimistic_time <= most_likely_time <= pessimistic_time`.
* All listed `dependencies` must correspond to existing `task_id`s in the file.
* Circular dependencies will be detected by `pertCalculator.js` and will result in an error.

## 🎨 Output XML and Visualization

The application generates an `.xml` file containing the PERT chart data in the mxGraphModel format. This file can be directly imported into draw.io.

**Node Styling in Draw.io:**
* **Normal tasks:** Light blue fill (`#EBF8FF`)
* **Critical tasks:** Light red fill (`#FED7D7`)
* **Bottleneck tasks:** Light yellow fill (`#FEFCBF`)

**Node Labels in Draw.io:**
Each task node will display the following information:
* Task ID and Description (e.g., `T1: Requirement Gathering`)
* TE: Expected Time (e.g., `5.00`)
* Var: Variance (e.g., `1.36`)
* ES: Early Start (e.g., `0.00`) | EF: Early Finish (e.g., `5.00`)
* LS: Late Start (e.g., `0.00`) | LF: Late Finish (e.g., `5.00`)
* Slack: (e.g., `0.00`)
* An indicator for **CRITICAL** or *BOTTLENECK* status if applicable.


## 🛠️ Technologies Used

* **HTML5**
* **CSS3**
    * **Tailwind CSS:** For utility-first styling.
* **JavaScript (ES6+)**
* **Libraries:**
    * **[PapaParse 5.3.2](https://www.papaparse.com) (MIT):** For client-side CSV parsing.
    * **[graphlib 2.1.8](https://github.com/dagrejs/graphlib) (MIT):** For graph data structure, topological sort, and cycle detection.
* **Font Awesome:** For icons.

## 👤 Author

This project was created by **Antonio Innocente**.
* GitHub: [AntonioAI](https://github.com/AntonioAI)
* Project Repository: [csv-2-pert](https://github.com/AntonioAI/csv-2-pert)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Please feel free to check the [issues page](https://github.com/AntonioAI/csv-2-pert/issues).


## 📜 License

MIT License. See [LICENSE](https://github.com/AntonioAI/csv-2-pert/blob/main/LICENSE) for details.
