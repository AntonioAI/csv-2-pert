// xmlGenerator.js

/**
 * Generates an mxGraph XML string for draw.io from PERT data.
 * @param {Object} pertData - The object returned by calculatePERT.
 * Expected to contain `tasks` array and `graph` (graphlib instance).
 * @returns {string} The mxGraph XML string.
 */
function generateXML(pertData) {
    const { tasks, graph } = pertData;

    // Define base style components for clarity
    const baseNodeStyle = {
        shape: "rectangle",
        whiteSpace: "wrap",
        html: "1", // Allows HTML content in labels
        rounded: "1",
        strokeColor: "#333333",
        fontSize: "10",
        fontFamily: "Helvetica",
        align: "left",
        verticalAlign: "top",
        spacingLeft: "4",
        spacingRight: "4",
        spacingTop: "4",
        spacingBottom: "4",
    };

    // Function to convert style object to mxGraph style string
    const styleObjectToString = (styleObj) => {
        return Object.entries(styleObj)
            .map(([key, value]) => `${key}=${value}`)
            .join(";");
    };

    // Define fill colors
    const fillColors = {
        normal: "fillColor=#EBF8FF;",     // Light blue
        critical: "fillColor=#FED7D7;",   // Light red
        bottleneck: "fillColor=#FEFCBF;", // Light yellow
    };

    const defaultStyleString = styleObjectToString(baseNodeStyle);

    let xml = `<mxGraphModel dx="1426" dy="797" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">\n`;
    xml += `  <root>\n`;
    xml += `    <mxCell id="0"/>\n`; // Default root
    xml += `    <mxCell id="1" parent="0"/>\n`; // Default parent layer

    // Add nodes (tasks)
    tasks.forEach((task, index) => {
        let specificFillStyle = fillColors.normal;
        if (task.isCritical) {
            specificFillStyle = fillColors.critical;
        } else if (task.isBottleneck) {
            specificFillStyle = fillColors.bottleneck;
        }

        const finalNodeStyle = `${defaultStyleString};${specificFillStyle}`;
        
        // Construct the raw HTML label.
        // Note: task.id and task.description are ALREADY strings.
        // The xmlEncode for these individual parts is good practice if they could contain '&', for example.
        // However, the most critical part is encoding the *entire* label before putting it in the XML attribute.
        const rawLabelHtml = `<b>${xmlEncode(task.id)}: ${xmlEncode(task.description) || 'N/A'}</b><br>` +
                             `TE: ${task.expectedTime.toFixed(2)} | Var: ${task.variance.toFixed(2)}<br>` +
                             `ES: ${task.earlyStart.toFixed(2)} | EF: ${task.earlyFinish.toFixed(2)}<br>` +
                             `LS: ${task.lateStart.toFixed(2)} | LF: ${task.lateFinish.toFixed(2)}<br>` +
                             `Slack: ${task.slack.toFixed(2)}` +
                             `${task.isCritical ? '<br><b>CRITICAL</b>' : ''}` +
                             `${task.isBottleneck ? '<br><i>BOTTLENECK</i>' : ''}`;

        // Basic positioning
        const x = (index % 5) * 200 + 50; 
        const y = Math.floor(index / 5) * 150 + 50; 
        const width = 180; 
        const height = 100;

        // IMPORTANT: Encode the entire HTML string for safe insertion into the XML value attribute.
        const encodedLabel = xmlEncode(rawLabelHtml);

        xml += `    <mxCell id="${xmlEncode(task.id)}" value="${encodedLabel}" style="${finalNodeStyle}" vertex="1" parent="1">\n`;
        xml += `      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>\n`;
        xml += `    </mxCell>\n`;
    });

    // Add edges (dependencies)
    let edgeCount = 0;
    if (graph && typeof graph.edges === 'function') {
        graph.edges().forEach(edgeObj => {
            const sourceId = edgeObj.v; 
            const targetId = edgeObj.w; 
            edgeCount++;
            const edgeId = `edge-${xmlEncode(sourceId)}-${xmlEncode(targetId)}-${edgeCount}`; 

            const edgeStyle = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeWidth=1;strokeColor=#6B7280;";

            xml += `    <mxCell id="${edgeId}" style="${edgeStyle}" edge="1" parent="1" source="${xmlEncode(sourceId)}" target="${xmlEncode(targetId)}">\n`;
            xml += `      <mxGeometry relative="1" as="geometry"/>\n`;
            xml += `    </mxCell>\n`;
        });
    }

    xml += `  </root>\n`;
    xml += `</mxGraphModel>\n`;

    return xml;
}

/**
 * Encodes a string for use in XML attributes or content.
 * Replaces special characters with their XML entities.
 * @param {string | number | undefined} str The string or number to encode.
 * @returns {string} The XML-encoded string.
 */
function xmlEncode(str) {
    if (str === undefined || str === null) return '';
    const s = String(str); 
    return s.replace(/[<>&"']/g, function (match) {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return match;
        }
    });
}