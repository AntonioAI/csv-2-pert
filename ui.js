// ui.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM element references
    const csvFileInput = document.getElementById('csvFile');
    const generateButton = document.getElementById('generateButton');
    const messageArea = document.getElementById('messageArea');
    const fileNameDisplay = document.getElementById('fileName');

    let parsedTasks = null; // To store tasks after successful CSV parsing

    // Event listener for file input changes
    csvFileInput.addEventListener('change', () => {
        if (csvFileInput.files.length > 0) {
            const file = csvFileInput.files[0];
            fileNameDisplay.textContent = file.name; // Display the selected file name
            generateButton.disabled = false; // Enable the generate button
            messageArea.textContent = ''; // Clear previous messages
            messageArea.className = 'mt-6 p-4 rounded-md text-sm min-h-[50px]'; // Reset message area class
            parsedTasks = null; // Reset previously parsed tasks, force re-parse if file changes

            // Automatically parse and validate the CSV on file selection
            parseAndValidateCSV(file)
                .then(tasks => {
                    parsedTasks = tasks; // Store successfully parsed tasks
                    displayMessage(`CSV file '${file.name}' parsed successfully. ${tasks.length} tasks found. Ready to generate XML.`, 'success');
                })
                .catch(errorMsg => {
                    parsedTasks = null; // Ensure no stale data on error
                    generateButton.disabled = true; // Disable button if initial parse fails
                    displayMessage(`Error parsing CSV: ${errorMsg}`, 'error');
                    fileNameDisplay.textContent = 'No file selected (error)';
                });
        } else {
            // No file selected or file selection was cancelled
            fileNameDisplay.textContent = 'No file selected';
            generateButton.disabled = true;
            parsedTasks = null;
        }
    });

    // Event listener for the "Generate PERT XML" button click
    generateButton.addEventListener('click', async () => {
        // Ensure a file is selected
        if (!csvFileInput.files || csvFileInput.files.length === 0) {
            displayMessage('Please select a CSV file first.', 'error');
            return;
        }
        
        // If tasks haven't been parsed yet (e.g., if auto-parse on change was removed or failed silently)
        // or if the user re-clicks generate after an error with the same file.
        if (!parsedTasks) {
            try {
                // Attempt to parse again if parsedTasks is not set
                parsedTasks = await parseAndValidateCSV(csvFileInput.files[0]);
                 displayMessage(`CSV file '${csvFileInput.files[0].name}' parsed successfully. ${parsedTasks.length} tasks found. Processing...`, 'success');
            } catch (errorMsg) {
                displayMessage(`Error parsing CSV: ${errorMsg}`, 'error');
                parsedTasks = null; // Ensure it's reset on error
                return; // Stop execution if parsing fails
            }
        }
        
        // Final check if parsedTasks is available (should be set if parsing succeeded)
        if (!parsedTasks) { 
             displayMessage('CSV data is not available or failed to parse. Please re-select the file.', 'error');
             return;
        }

        displayMessage('Calculating PERT metrics...', 'info');

        try {
            // Perform PERT calculations
            const pertResults = calculatePERT(parsedTasks);

            // Check if PERT calculation returned an error string
            if (typeof pertResults === 'string') { 
                displayMessage(`PERT Calculation Error: ${pertResults}`, 'error');
                return; // Stop if PERT calculation itself had an error
            }

            displayMessage('Generating XML...', 'info');
            // Generate XML output using the (presumably correct) xmlGenerator.js
            const xmlOutput = generateXML(pertResults);

            // --- Create a timestamp for the filename ---
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`; // Format: YYYYMMDD_HHMMSS
            const timestampedFileName = `pert_chart_${timestamp}.xml`;
            // --- End of timestamp logic ---

            // Trigger XML download with the new timestamped filename
            downloadXML(xmlOutput, timestampedFileName);
            displayMessage(`PERT XML '${timestampedFileName}' generated and download initiated!`, 'success');

        } catch (error) {
            // Catch any unexpected errors during the process
            console.error("Error during PERT calculation or XML generation:", error);
            displayMessage(`An unexpected error occurred: ${error.message}`, 'error');
        }
    });

    /**
     * Displays a message to the user in the message area.
     * @param {string} message - The message to display.
     * @param {'info'|'success'|'error'} type - The type of message (affects styling).
     */
    function displayMessage(message, type = 'info') {
        messageArea.textContent = message;
        // Reset base classes and apply specific styling based on message type
        // Ensures min-h-[50px] is always present from index.html's initial class for messageArea
        messageArea.className = 'mt-6 p-4 rounded-md text-sm min-h-[50px]'; 
        switch (type) {
            case 'success':
                messageArea.classList.add('success'); // 'success' class should be defined in styles.css
                break;
            case 'error':
                messageArea.classList.add('error'); // 'error' class should be defined in styles.css
                break;
            case 'info':
            default:
                // Default styling for informational messages
                messageArea.classList.add('bg-blue-100', 'text-blue-700', 'border', 'border-blue-300');
                break;
        }
    }

    /**
     * Triggers a browser download for the given text content.
     * @param {string} content - The text content to download.
     * @param {string} fileName - The desired name for the downloaded file.
     */
    function downloadXML(content, fileName) {
        const element = document.createElement('a');
        // Set the href with the data URI scheme for XML content
        element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', fileName); // Set the download attribute to the desired filename
        element.style.display = 'none'; // The link doesn't need to be visible
        document.body.appendChild(element); // Append to body to make it clickable
        element.click(); // Simulate a click on the link to trigger download
        document.body.removeChild(element); // Clean up by removing the link from the DOM
    }
});