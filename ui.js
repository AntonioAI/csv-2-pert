// ui.js

document.addEventListener('DOMContentLoaded', () => {
    const csvFileInput = document.getElementById('csvFile');
    const generateButton = document.getElementById('generateButton');
    const messageArea = document.getElementById('messageArea');
    const fileNameDisplay = document.getElementById('fileName');

    let parsedTasks = null;

    // Enable generate button when a file is selected
    csvFileInput.addEventListener('change', () => {
        if (csvFileInput.files.length > 0) {
            const file = csvFileInput.files[0];
            fileNameDisplay.textContent = file.name;
            generateButton.disabled = false;
            messageArea.textContent = ''; // Clear previous messages
            messageArea.className = 'mt-6 p-4 rounded-md text-sm'; // Reset class
            parsedTasks = null; // Reset parsed tasks

            // Automatically try to parse and validate on file selection
            parseAndValidateCSV(file)
                .then(tasks => {
                    parsedTasks = tasks;
                    displayMessage(`CSV file '${file.name}' parsed successfully. ${tasks.length} tasks found. Ready to generate XML.`, 'success');
                })
                .catch(errorMsg => {
                    parsedTasks = null;
                    generateButton.disabled = true; // Disable button if initial parse fails
                    displayMessage(`Error parsing CSV: ${errorMsg}`, 'error');
                    fileNameDisplay.textContent = 'No file selected (error)';
                });

        } else {
            fileNameDisplay.textContent = 'No file selected';
            generateButton.disabled = true;
            parsedTasks = null;
        }
    });

    generateButton.addEventListener('click', async () => {
        if (!csvFileInput.files || csvFileInput.files.length === 0) {
            displayMessage('Please select a CSV file first.', 'error');
            return;
        }
        
        // If tasks haven't been parsed yet (e.g., if auto-parse on change was removed or failed silently)
        // or if the user re-clicks generate after an error with the same file.
        if (!parsedTasks) {
            try {
                parsedTasks = await parseAndValidateCSV(csvFileInput.files[0]);
                 displayMessage(`CSV file '${csvFileInput.files[0].name}' parsed successfully. ${parsedTasks.length} tasks found. Processing...`, 'success');
            } catch (errorMsg) {
                displayMessage(`Error parsing CSV: ${errorMsg}`, 'error');
                parsedTasks = null; // Ensure it's reset
                return;
            }
        }
        
        if (!parsedTasks) { // Double check after await
             displayMessage('CSV data is not available or failed to parse. Please re-select the file.', 'error');
             return;
        }


        displayMessage('Calculating PERT metrics...', 'info');

        try {
            const pertResults = calculatePERT(parsedTasks);

            if (typeof pertResults === 'string') { // Error message returned
                displayMessage(`PERT Calculation Error: ${pertResults}`, 'error');
                return;
            }

            displayMessage('Generating XML...', 'info');
            const xmlOutput = generateXML(pertResults);

            downloadXML(xmlOutput, 'pert_chart.xml');
            displayMessage('PERT XML generated and download initiated successfully!', 'success');

        } catch (error) {
            console.error("Error during PERT calculation or XML generation:", error);
            displayMessage(`An unexpected error occurred: ${error.message}`, 'error');
        } finally {
            // Optionally, reset parsedTasks if you want to force re-parsing for subsequent clicks
            // parsedTasks = null; 
            // generateButton.disabled = true; // Or re-evaluate based on file input state
            // csvFileInput.value = ''; // Clear file input for a fresh start, but this can be annoying
            // fileNameDisplay.textContent = 'No file selected';
        }
    });

    /**
     * Displays a message to the user.
     * @param {string} message - The message to display.
     * @param {'info'|'success'|'error'} type - The type of message.
     */
    function displayMessage(message, type = 'info') {
        messageArea.textContent = message;
        messageArea.className = 'mt-6 p-4 rounded-md text-sm'; // Reset base classes
        switch (type) {
            case 'success':
                messageArea.classList.add('success'); // Defined in styles.css
                break;
            case 'error':
                messageArea.classList.add('error'); // Defined in styles.css
                break;
            case 'info':
            default:
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
        element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', fileName);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
});