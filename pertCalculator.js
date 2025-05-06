// pertCalculator.js

/**
 * Calculates PERT metrics for a list of tasks.
 * @param {Array<Object>} tasks - Array of task objects from csvParser.
 * @returns {Object|String} An object containing tasks with PERT metrics and critical path info, or an error string.
 */
function calculatePERT(tasks) {
    try {
        // Initialize graph
        const g = new graphlib.Graph({ directed: true, compound: false, multigraph: false });

        // Add nodes to graph and calculate TE and Variance for each task
        tasks.forEach(task => {
            if (isNaN(task.optimisticTime) || isNaN(task.mostLikelyTime) || isNaN(task.pessimisticTime)) {
                 throw new Error(`Task ${task.id} has invalid time estimates. Cannot calculate PERT.`);
            }
            task.expectedTime = (task.optimisticTime + 4 * task.mostLikelyTime + task.pessimisticTime) / 6;
            task.variance = Math.pow((task.pessimisticTime - task.optimisticTime) / 6, 2);
            
            // Initialize PERT metrics
            task.earlyStart = 0;
            task.earlyFinish = 0;
            task.lateStart = Infinity;
            task.lateFinish = Infinity;
            task.slack = 0;
            task.isCritical = false;
            task.isBottleneck = false; // Initialize bottleneck status

            g.setNode(task.id, task); // Store the whole task object in the node
        });

        // Add edges (dependencies)
        tasks.forEach(task => {
            task.dependencies.forEach(depId => {
                if (!g.hasNode(depId)) {
                    throw new Error(`Dependency error: Task '${depId}' (dependency of '${task.id}') not found in the graph.`);
                }
                // Edge from dependency to task (depId -> task.id)
                g.setEdge(depId, task.id);
            });
        });

        // Check for cycles
        const cycles = graphlib.alg.findCycles(g);
        if (cycles.length > 0) {
            const cyclePaths = cycles.map(cycle => cycle.join(" -> ")).join("; ");
            throw new Error(`Circular dependency detected: ${cyclePaths}. PERT calculations cannot proceed.`);
        }

        // Topological sort
        const topoSortedIds = graphlib.alg.topsort(g);
        if (topoSortedIds.length !== tasks.length) {
            // This might happen if there are disconnected components not reachable from initial nodes,
            // or if topsort fails for some other reason (though cycle check should cover most graph issues).
            // For PERT, we typically expect a connected graph or one where all tasks are reachable.
            // If some tasks are unreachable from any "start" nodes, their ES might remain 0 incorrectly
            // if not handled. However, standard PERT assumes tasks flow from start(s) to end(s).
            const graphNodes = g.nodes();
            const missingFromTopo = graphNodes.filter(n => !topoSortedIds.includes(n));
            if (missingFromTopo.length > 0) {
                 throw new Error(`Topological sort failed or graph has disconnected parts not processed. Missing tasks from sort: ${missingFromTopo.join(', ')}`);
            }
        }


        // Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
        topoSortedIds.forEach(taskId => {
            const task = g.node(taskId);
            let maxEFOfPredecessors = 0;
            const predecessors = g.predecessors(taskId) || [];
            predecessors.forEach(predId => {
                const predTask = g.node(predId);
                if (predTask.earlyFinish > maxEFOfPredecessors) {
                    maxEFOfPredecessors = predTask.earlyFinish;
                }
            });
            task.earlyStart = maxEFOfPredecessors;
            task.earlyFinish = task.earlyStart + task.expectedTime;
        });

        // Identify overall project finish time (max EF of all tasks)
        let projectFinishTime = 0;
        tasks.forEach(task => {
            if (task.earlyFinish > projectFinishTime) {
                projectFinishTime = task.earlyFinish;
            }
        });

        // Backward Pass: Calculate Late Start (LS) and Late Finish (LF)
        // Tasks with no successors (end tasks) have LF = projectFinishTime
        topoSortedIds.slice().reverse().forEach(taskId => {
            const task = g.node(taskId);
            const successors = g.successors(taskId) || [];
            if (successors.length === 0) {
                task.lateFinish = projectFinishTime;
            } else {
                let minLSOfSuccessors = Infinity;
                successors.forEach(succId => {
                    const succTask = g.node(succId);
                    if (succTask.lateStart < minLSOfSuccessors) {
                        minLSOfSuccessors = succTask.lateStart;
                    }
                });
                task.lateFinish = minLSOfSuccessors;
            }
            task.lateStart = task.lateFinish - task.expectedTime;
        });

        // Calculate Slack and identify Critical Path & Bottlenecks
        tasks.forEach(task => {
            // Slack calculation might have small floating point inaccuracies.
            // Compare with a small epsilon if exact zero is problematic.
            const slack = task.lateStart - task.earlyStart;
            // Round slack to a few decimal places to handle potential floating point issues
            task.slack = parseFloat(slack.toFixed(5));


            if (task.slack === 0) {
                task.isCritical = true;
            } else if (task.slack > 0 && task.slack <= 1.0) { // Bottleneck definition (slack > 0 and <= 1)
                task.isBottleneck = true;
            }
        });
        
        const criticalPathTasks = tasks.filter(task => task.isCritical).map(task => task.id);

        return {
            tasks: tasks, // All tasks with their calculated metrics
            criticalPathIds: criticalPathTasks,
            projectFinishTime: projectFinishTime,
            graph: g // Return the graph object if needed for XML generation layout
        };

    } catch (error) {
        console.error("Error in PERT calculation:", error);
        return `PERT Calculation Error: ${error.message}`;
    }
}