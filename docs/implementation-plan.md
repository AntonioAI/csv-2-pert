# Implementation Plan for Enhancing CSV2PERT

This plan outlines the steps to enhance the `CSV2PERT` web app, ensuring that the generated XML file produces a fully styled, labeled, and arranged PERT diagram when imported into draw.io. Each step includes a validation test to confirm progress before committing to GitHub.

## Step 1: Improve Error Handling and Validation
- **Objective**: Enhance the app to detect and handle common errors in the input CSV.
- **Tasks**:
  - Check for duplicate `task_id` values in the CSV.
  - Detect cycles in the dependency graph using `graphlib.alg.findCycles`.
  - Verify that all dependencies reference existing tasks.
  - Display specific error messages (e.g., "Duplicate task ID: A", "Cycle detected: A → B → A", "Unknown dependency: Task Z in task B").
- **Validation Test**:
  - Create test CSVs that trigger each error condition (e.g., one with duplicate IDs, one with a cycle, one with invalid dependencies).
  - Verify that the app displays the correct error message and prevents XML generation.
- **GitHub Commit**: `git commit -m "feat: enhance error handling for CSV input"`

## Step 2: Research draw.io's Native XML Format (mxGraph XML)
- **Objective**: Understand how to create an mxGraph XML file that draw.io can interpret, including styling, labeling, and basic layout, since draw.io does not support GraphML import.
- **Tasks**:
  1. **Study the mxGraph XML Structure**:
     - Review the [mxGraph User Manual](https://jgraph.github.io/mxgraph/docs/manual.html) to understand the XML structure, which includes `<mxGraphModel>`, `<root>`, and `<mxCell>` elements for nodes and edges.
     - Examine sample XML files in the [mxGraph GitHub repository](https://github.com/jgraph/mxgraph/tree/master/javascript/examples) to see how nodes (vertices) and edges are defined.
     - Note that every diagram requires two default cells: one with `id="0"` (root) and one with `id="1"` (default parent, `parent="0"`).
  2. **Learn Style Keys for Nodes and Edges**:
     - Refer to the [mxConstants documentation](https://jgraph.github.io/mxgraph/docs/js-api/files/util/mxConstants-js.html) for a comprehensive list of style keys (e.g., `shape`, `fillColor`, `strokeColor`, `endArrow`).
     - Understand common style keys:
       - For nodes: `shape=rectangle`, `fillColor=#ffffff`, `strokeColor=#000000`, `html=1` (to enable HTML labels).
       - For edges: `endArrow=classic`, `strokeColor=#000000`, `html=1`.
     - Note that styles are defined as semicolon-separated key-value pairs (e.g., `shape=rectangle;fillColor=#ff0000;html=1`).
  3. **Understand Labeling with HTML**:
     - Learn that the `value` attribute of an `<mxCell>` holds the label, which can include HTML (e.g., `Task A<br>TE=4.00<br>Slack=0.00`) when `html=1` is set in the style.
     - Test how draw.io renders multi-line labels with `<br>` tags.
  4. **Explore Positioning and Geometry**:
     - Understand that `<mxGeometry>` elements define node positions (`x`, `y`) and sizes (`width`, `height`).
     - For edges, use `<mxGeometry relative="1">` to let draw.io automatically route the edge between source and target nodes.
     - Note that omitting `x` and `y` coordinates allows draw.io to apply its auto-layout feature, which is recommended for initial implementation.
  5. **Create and Test a Sample XML**:
     - Manually create a sample mxGraph XML file with two nodes (one styled as a critical path task) and one edge, as shown below:
       ```xml
       <mxGraphModel>
         <root>
           <mxCell id="0"/>
           <mxCell id="1" parent="0"/>
           <mxCell id="taskA" value="Task A<br>TE=4.00<br>Slack=0.00" style="shape=rectangle;fillColor=#ff0000;strokeColor=#000000;html=1" vertex="1" parent="1">
             <mxGeometry x="100" y="100" width="80" height="40" as="geometry"/>
           </mxCell>
           <mxCell id="taskB" value="Task B<br>TE=3.00<br>Slack=1.00" style="shape=rectangle;fillColor=#ffffff;strokeColor=#000000;html=1" vertex="1" parent="1">
             <mxGeometry x="200" y="100" width="80" height="40" as="geometry"/>
           </mxCell>
           <mxCell id="edge1" source="taskA" target="taskB" style="endArrow=classic;strokeColor=#000000;html=1" edge="1" parent="1">
             <mxGeometry relative="1" as="geometry"/>
           </mxCell>
         </root>
       </mxGraphModel>
       ```
     - Save the file with a `.xml` or `.drawio` extension (e.g., `test.drawio`).
     - Import it into draw.io (via File > Import in the web version at [app.diagrams.net](https://app.diagrams.net)) and verify the rendering.
- **Validation Test**:
  - Import the sample XML file into draw.io.
  - Confirm that:
    - Nodes appear as rectangles with correct fill colors (e.g., red for critical path, white for others).
    - Labels display as multi-line text with task ID, TE, and slack.
    - The edge connects the nodes with an arrow.
    - The layout is reasonable (either using specified `x`, `y` or draw.io’s auto-layout if coordinates are omitted).
  - Adjust the XML if any styling or labeling issues are observed (e.g., incorrect colors or label formatting).
- **GitHub Commit**: `git commit -m "docs: document mxGraph XML format for draw.io"`

## Step 3: Enhance Node Styling in mxGraph XML
- **Objective**: Add styling attributes to nodes in the generated mxGraph XML.
- **Tasks**:
  - Define a default style for all tasks (e.g., `shape=rectangle;fillColor=#ffffff;strokeColor=#000000;html=1`).
  - Use mxGraph-compatible attributes based on findings from Step 2.
- **Validation Test**:
  - Generate an mxGraph XML file from the app using a sample CSV.
  - Import it into draw.io and verify that nodes have the basic style applied.
- **GitHub Commit**: `git commit -m "feat: add basic styling to nodes in mxGraph XML"`

## Step 4: Style Critical Path Tasks
- **Objective**: Apply distinct styling to tasks on the critical path.
- **Tasks**:
  - Identify tasks with zero slack using existing PERT calculations.
  - Set a unique style for these tasks (e.g., `fillColor=#ff0000`).
- **Validation Test**:
  - Use a sample CSV with a known critical path.
  - Generate mxGraph XML and check in draw.io if critical tasks are styled differently (e.g., red fill).
- **GitHub Commit**: `git commit -m "feat: highlight critical path tasks with distinct styling"`

## Step 5: Style Bottlenecks
- **Objective**: Highlight tasks that are potential bottlenecks.
- **Tasks**:
  - Define criteria for bottlenecks (e.g., tasks with slack < 1 or high variance).
  - Apply another style (e.g., `fillColor=#ffff00`).
- **Validation Test**:
  - Adjust the sample CSV to include tasks that meet the bottleneck criteria.
  - Generate mxGraph XML and verify in draw.io that these tasks are styled appropriately (e.g., yellow fill).
- **GitHub Commit**: `git commit -m "feat: highlight bottleneck tasks with distinct styling"`

## Step 6: Improve Labels
- **Objective**: Enhance labels to include task ID, expected time (TE), and slack.
- **Tasks**:
  - Generate multi-line labels using HTML (e.g., `Task A<br>TE=4.00<br>Slack=0.00` with `html=1` in the style).
  - Ensure the label format is compatible with draw.io.
- **Validation Test**:
  - Generate mxGraph XML and import into draw.io to check if labels are displayed correctly with multiple lines.
- **GitHub Commit**: `git commit -m "feat: enhance labels with task details"`

## Step 7: Handle Layout
- **Objective**: Ensure the diagram is well-arranged upon import.
- **Tasks**:
  - **Option A (Recommended Initially)**: Rely on draw.io’s auto-layout feature by omitting `x` and `y` coordinates in `<mxGeometry>`.
  - **Option B (If Needed)**: Assign basic x and y coordinates based on topological order and earliest start times (e.g., `x = ES * 100`, `y = topo_index * 50`).
- **Validation Test**:
  - Generate mxGraph XML and import into draw.io.
  - For Option A: Apply draw.io’s auto-layout (Arrange > Layout > Hierarchical) and check if the arrangement is acceptable.
  - For Option B: Verify that nodes are positioned logically without overlap.
- **GitHub Commit**: `git commit -m "feat: implement basic layout for nodes"` (if Option B is chosen) or `git commit -m "docs: note reliance on draw.io auto-layout"`

## Step 8: Ensure Compatibility with Other Tools
- **Objective**: Confirm that the mxGraph XML can be used in draw.io and potentially other tools.
- **Tasks**:
  - Import the generated mxGraph XML into draw.io to confirm compatibility.
  - Optionally, test in other tools like yEd to see if the basic structure is recognized (styling may not transfer).
- **Validation Test**:
  - Verify that the diagram renders correctly in draw.io and, if tested, that the basic graph structure appears in another tool.
- **GitHub Commit**: `git commit -m "chore: verifyNUALmxGraph XML compatibility"`

## Step 9: Refine and Iterate
- **Objective**: Address issues or improvements identified during testing.
- **Tasks**:
  - Fix bugs or adjust styling/labeling based on test results.
  - Incorporate user feedback if available.
- **Validation Test**:
  - Repeat import tests in draw.io after each adjustment to ensure improvements work as expected.
- **GitHub Commit**: `git commit -m "fix: [specific issue]"` or `git commit -m "feat: [enhancement]"`

## Step 10: Update Documentation
- **Objective**: Enhance the README to reflect new features and provide guidance.
- **Tasks**:
  - Explain the styling and layout features (e.g., critical path in red, bottlenecks in yellow).
  - Include a screenshot of the imported diagram in draw.io.
  - Provide tips for using draw.io’s auto-layout if applicable.
- **Validation Test**:
  - Review the documentation for clarity and completeness.
- **GitHub Commit**: `git commit -m "docs: update README with new features and usage tips"`

## Additional Considerations
- **Performance**: Test the app with large CSVs (e.g., 100+ tasks) to ensure efficient XML generation.
- **User Customization**: Optionally, add UI options for styling adjustments (e.g., color pickers) as a future enhancement.
- **Edge Cases**: Validate handling of tasks with no dependencies, multiple critical paths, or invalid data formats.

## Execution Notes
- Commit changes incrementally after each successful test to maintain a clear Git history.
- Use sample CSVs throughout development to consistently test features.
- Revisit layout (Step 7) if users report issues with draw.io’s auto-layout, potentially implementing Option B.

## Key Citations
- [mxGraph User Manual for XML Structure](https://jgraph.github.io/mxgraph/docs/manual.html)
- [mxConstants Documentation for Style Keys](https://jgraph.github.io/mxgraph/docs/js-api/files/util/mxConstants-js.html)
- [mxGraph GitHub Repository for Examples](https://github.com/jgraph/mxgraph)
