// csvParser.js

/**
 * Parses a CSV file and validates its content for PERT analysis.
 * @param {File} file - The CSV file to parse.
 * @returns {Promise<Array<Object>|String>} A promise that resolves with an array of task objects or an error message string.
 */
function parseAndValidateCSV(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject("No file provided.");
            return;
        }

        Papa.parse(file, {
            header: true, // Expect a header row
            skipEmptyLines: true,
            complete: (results) => {
                const tasks = results.data;
                const errors = [];
                const requiredHeaders = [
                    "task_id", "description", "optimistic_time", 
                    "most_likely_time", "pessimistic_time", "dependencies"
                ];

                // Check for missing headers
                const actualHeaders = results.meta.fields;
                for (const header of requiredHeaders) {
                    if (!actualHeaders.includes(header)) {
                        errors.push(`Missing required CSV header: '${header}'.`);
                    }
                }

                if (errors.length > 0) {
                    reject(errors.join("\n"));
                    return;
                }
                
                if (tasks.length === 0) {
                    reject("CSV file is empty or contains only headers.");
                    return;
                }

                const validatedTasks = [];
                const taskIds = new Set();

                tasks.forEach((task, index) => {
                    const rowNum = index + 2; // Account for header row and 0-based index

                    // Check for missing task_id
                    if (!task.task_id || String(task.task_id).trim() === "") {
                        errors.push(`Row ${rowNum}: 'task_id' is missing or empty.`);
                        return; // Skip further validation for this row if ID is missing
                    }
                    task.task_id = String(task.task_id).trim();

                    // Check for duplicate task_id
                    if (taskIds.has(task.task_id)) {
                        errors.push(`Row ${rowNum}: Duplicate 'task_id' found: '${task.task_id}'.`);
                    } else {
                        taskIds.add(task.task_id);
                    }

                    // Validate numeric fields
                    const o = parseFloat(task.optimistic_time);
                    const m = parseFloat(task.most_likely_time);
                    const p = parseFloat(task.pessimistic_time);

                    if (isNaN(o) || o < 0) {
                        errors.push(`Row ${rowNum} (Task ${task.task_id}): 'optimistic_time' must be a non-negative number. Found: '${task.optimistic_time}'.`);
                    }
                    if (isNaN(m) || m < 0) {
                        errors.push(`Row ${rowNum} (Task ${task.task_id}): 'most_likely_time' must be a non-negative number. Found: '${task.most_likely_time}'.`);
                    }
                    if (isNaN(p) || p < 0) {
                        errors.push(`Row ${rowNum} (Task ${task.task_id}): 'pessimistic_time' must be a non-negative number. Found: '${task.pessimistic_time}'.`);
                    }

                    // Validate O <= M <= P
                    if (!isNaN(o) && !isNaN(m) && !isNaN(p)) {
                        if (o > m) {
                            errors.push(`Row ${rowNum} (Task ${task.task_id}): 'optimistic_time' (${o}) cannot be greater than 'most_likely_time' (${m}).`);
                        }
                        if (m > p) {
                            errors.push(`Row ${rowNum} (Task ${task.task_id}): 'most_likely_time' (${m}) cannot be greater than 'pessimistic_time' (${p}).`);
                        }
                    }
                    
                    // Ensure description exists, even if empty
                    task.description = task.description ? String(task.description).trim() : "";


                    // Process dependencies: split string into an array, trim whitespace, filter out empty strings
                    const dependenciesRaw = task.dependencies ? String(task.dependencies).trim() : "";
                    const dependenciesArray = dependenciesRaw === "" ? [] : dependenciesRaw.split(',').map(dep => dep.trim()).filter(dep => dep !== "");

                    validatedTasks.push({
                        id: task.task_id,
                        description: task.description,
                        optimisticTime: o,
                        mostLikelyTime: m,
                        pessimisticTime: p,
                        dependencies: dependenciesArray,
                        originalRow: rowNum 
                    });
                });

                if (errors.length > 0) {
                    reject(errors.join("\n"));
                    return;
                }

                // Second pass for dependency validation (ensure all dependencies exist)
                const allTaskIds = new Set(validatedTasks.map(t => t.id));
                validatedTasks.forEach(task => {
                    task.dependencies.forEach(depId => {
                        if (!allTaskIds.has(depId)) {
                            errors.push(`Task '${task.id}' (Row ${task.originalRow}): Dependency '${depId}' does not match any existing 'task_id'.`);
                        }
                    });
                });

                if (errors.length > 0) {
                    reject(errors.join("\n"));
                    return;
                }
                
                resolve(validatedTasks);
            },
            error: (error) => {
                reject(`CSV parsing error: ${error.message}`);
            }
        });
    });
}