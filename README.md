# CSV to PERT XML Converter

## Overview

This project is a web-based utility that transforms project task data from a CSV file into an XML format suitable for import into draw.io / diagrams.net. This allows users to easily generate PERT (Program Evaluation and Review Technique) charts from their task lists, aiding in project management and visualization of task dependencies, durations, and critical paths.

The application performs PERT calculations (Expected Time, Variance, Early Start, Early Finish, Late Start, Late Finish, Slack) and identifies critical tasks and potential bottlenecks. The output XML can be directly imported into draw.io to render a PERT chart.

## Features

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

## How it Works

1.  **Prepare Your CSV:** Create a CSV file with the required columns: `task_id`, `description`, `optimistic_time`, `most_likely_time`, `pessimistic_time`, and `dependencies`. (See [CSV File Format](#csv-file-format) for details).
2.  **Upload:** Use the interface to upload your CSV file. The application will parse and validate it, providing immediate feedback.
3.  **Generate:** Click the "Generate PERT XML" button.
4.  **Calculations:**
    * The `csvParser.js` module reads and validates the CSV data.
    * The `pertCalculator.js` module takes the parsed tasks, builds a task dependency graph using `graphlib`, performs PERT calculations, identifies the critical path and bottlenecks, and checks for cycles.
5.  **XML Output:**
    * The `xmlGenerator.js` module takes the results from the PERT calculator and constructs an XML string in the mxGraph format. Task nodes are styled based on their status (normal, critical, bottleneck).
6.  **Download & Import:** The generated XML file is automatically downloaded by your browser. You can then import this file into draw.io / diagrams.net (File > Import from > Device) to visualize your PERT chart.

## File Structure

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

## CSV File Format

The CSV file must contain a header row with the following columns, in any order:

* `task_id`: A unique identifier for the task (string/number). Cannot be empty.
* `description`: A brief description of the task (string). Can be empty.
* `optimistic_time`: The shortest possible time to complete the task (number, >= 0).
* `most_likely_time`: The most probable time to complete the task (number, >= 0).
* `pessimistic_time`: The longest possible time to complete the task (number, >= 0).
* `dependencies`: A comma-separated list of `task_id`s that this task depends on.
    * If there are no dependencies, leave this field empty.
    * For multiple dependencies, list them separated by commas (e.g., `T1,T2`). If creating the CSV manually and a dependency ID itself contains a comma, or if you want to ensure exact parsing, you can enclose the entire comma-separated list in quotes (e.g., `"T1,T2"`). PapaParse generally handles unquoted comma-separated values well.

**Validation Rules enforced by `csvParser.js`:**
* All required headers must be present.
* `task_id` must be unique and non-empty.
* `optimistic_time`, `most_likely_time`, `pessimistic_time` must be non-negative numbers.
* The time estimates must follow the rule: `optimistic_time <= most_likely_time <= pessimistic_time`.
* All listed `dependencies` must correspond to existing `task_id`s in the file.
* Circular dependencies will be detected by `pertCalculator.js` and will result in an error.

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

## Setup and Usage

1.  Ensure all project files (`index.html`, `styles.css`, `csvParser.js`, `pertCalculator.js`, `xmlGenerator.js`, `ui.js`) are in the same directory.
2.  Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Edge, Safari).
3.  Follow the instructions on the page:
    * Click the "Click to browse or drag & drop" area or the (hidden) "Choose CSV File" input to select your prepared CSV file.
    * The name of the selected file will appear. If there are parsing errors, they will be displayed.
    * Once a valid CSV is selected and parsed successfully, the "Generate PERT XML" button will become active.
    * Click the button to perform PERT calculations and generate the XML file.
    * The XML file (e.g., `pert_chart_20250509_180000.xml`) will be automatically downloaded.
4.  Open [draw.io](https://app.diagrams.net/) or your diagrams.net desktop application.
5.  Select "File" > "Import from" > "Device..." and choose the downloaded XML file.
6.  The PERT chart should be displayed. You may need to use draw.io's auto-layout features (e.g., Arrange > Layout > Vertical/Horizontal Flow) for optimal visualization if the default positioning is not ideal.

## Output XML and Visualization

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

**Preview of Draw.io Output:**


![PERT Chart Diagram](./assets/example_pert_diagram.svg)

**(Example of how it might look after auto-arrangement in draw.io)**


## Technologies Used

* **HTML5**
* **CSS3**
    * **Tailwind CSS:** For utility-first styling.
* **JavaScript (ES6+)**
* **Libraries:**
    * **PapaParse 5.3.2:** For client-side CSV parsing.
    * **graphlib 2.1.8:** For graph data structure, topological sort, and cycle detection.
* **Font Awesome:** For icons.

## Author

This project was created by **Antonio Innocente**.
* GitHub: [AntonioAI](https://github.com/AntonioAI)
* Project Repository: [csv-2-pert](https://github.com/AntonioAI/csv-2-pert) (Link from `index.html`)

## Contributing

Contributions, issues, and feature requests are welcome. Please feel free to check the [issues page](https://github.com/AntonioAI/csv-2-pert/issues) (if the project is hosted and has one) or create a new one.