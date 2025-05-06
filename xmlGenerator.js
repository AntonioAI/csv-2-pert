// xmlGenerator.js

/**
 * Generates an mxGraph XML string for draw.io from PERT data.
 * @param {Object} pertData - The object returned by calculatePERT.
 * Expected to contain `tasks` array and `graph` (graphlib instance).
 * @returns {string} The mxGraph XML string.
 */
function generateXML(pertData) {
    const { tasks, graph } = pertData;

    // Basic styles
    const defaultStyle = "shape=rectangle;whiteSpace=wrap;html=1;rounded=1;strokeColor=#333333;fontSize=10;fontFamily=Inter;align=left;verticalAlign=top;spacingLeft=4;spacingRight=4;spacingTop=4;spacingBottom=4;";
    const normalFill = "fillColor=#EBF8FF;"; // Light blue
    const criticalFill = "fillColor=#FED7D7;"; // Light red
    const bottleneckFill = "fillColor=#FEFCBF;"; // Light yellow

    let xml = `<mxGraphModel dx="1426" dy="797" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">\n`;
    xml += `  <root>\n`;
    xml += `    <mxCell id="0"/>\n`; // Default root
    xml += `    <mxCell id="1" parent="0"/>\n`; // Default parent layer

    // Add nodes (tasks)
    tasks.forEach((task, index) => {
        let fillStyle = normalFill;
        if (task.isCritical) {
            fillStyle = criticalFill;
        } else if (task.isBottleneck) {
            fillStyle = bottleneckFill;
        }

        const style = defaultStyle + fillStyle;
        
        // Node label with HTML for line breaks and formatting
        // Using toFixed(2) for display consistency of float values.
        const label = `<b>${task.id}: ${task.description || 'N/A'}</b><br>` +
                      `TE: ${task.expectedTime.toFixed(2)} | Var: ${task.variance.toFixed(2)}<br>` +
                      `ES: ${task.earlyStart.toFixed(2)} | EF: ${task.earlyFinish.toFixed(2)}<br>` +
                      `LS: ${task.lateStart.toFixed(2)} | LF: ${task.lateFinish.toFixed(2)}<br>` +
                      `Slack: ${task.slack.toFixed(2)}` +
                      `${task.isCritical ? '<br><b>CRITICAL</b>' : ''}` +
                      `${task.isBottleneck ? '<br><i>BOTTLENECK</i>' : ''}`;

        // Basic positioning - can be improved or left for draw.io auto-layout
        // For simplicity, we'll let draw.io handle layout by not setting x,y.
        // However, draw.io might place them all at 0,0.
        // A very simple staggered layout might be better.
        const x = (index % 5) * 200 + 50; // Simple horizontal staggering
        const y = Math.floor(index / 5) * 150 + 50; // Simple vertical staggering
        const width = 180; // Adjust as needed
        const height = 100; // Adjust based on label content

        xml += `    <mxCell id="${task.id}" value="${xmlEncode(label)}" style="${style}" vertex="1" parent="1">\n`;
        xml += `      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>\n`;
        xml += `    </mxCell>\n`;
    });

    // Add edges (dependencies)
    let edgeCount = 0;
    if (graph && typeof graph.edges === 'function') {
        graph.edges().forEach(edgeObj => {
            const sourceId = edgeObj.v; // Source task ID
            const targetId = edgeObj.w; // Target task ID
            edgeCount++;
            const edgeId = `edge-${sourceId}-${targetId}-${edgeCount}`; // Unique edge ID

            // Style for edges
            const edgeStyle = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;strokeWidth=1;strokeColor=#6B7280;"; // Gray-500

            xml += `    <mxCell id="${edgeId}" style="${edgeStyle}" edge="1" parent="1" source="${sourceId}" target="${targetId}">\n`;
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
 * @param {string} str The string to encode.
 * @returns {string} The XML-encoded string.
 */
function xmlEncode(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>&"']/g, function (match) {
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