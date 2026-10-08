(() => {
    "use strict";

    /* =========================================================
       ColorSolve - Complete Fixed JavaScript
       ========================================================= */

    /*
       API base URL:
       HTML mein define karo:

       <script>
           window.BASE_URL = "/COLORSOLVEPROJECT";
       </script>
    */
    const API_BASE = window.BASE_URL || (() => {
        const parts = window.location.pathname
            .split("/")
            .filter(Boolean);

        /*
           Example:
           /COLORSOLVEPROJECT/pages/index.html
           => /COLORSOLVEPROJECT
        */
        return parts.length ? `/${parts[0]}` : "";
    })();

    /* =========================================================
       Color Palette
       ========================================================= */

    const PALETTE = [
        "#e6194b",
        "#3cb44b",
        "#ffe119",
        "#4363d8",
        "#f58231",
        "#911eb4",
        "#46f0f0",
        "#f032e6",
        "#bcf60c",
        "#fabebe",
        "#008080",
        "#e6beff",
        "#9a6324",
        "#800000",
        "#aaffc3"
    ];

    /* =========================================================
       HTML Elements
       ========================================================= */

    const loadExampleBtn = document.getElementById("loadExample");
    const runLocalBtn = document.getElementById("runLocal");
    const runBackendBtn = document.getElementById("runBackend");

    const saveGraphBtn = document.getElementById("saveGraph");
    const loadGraphBtn = document.getElementById("loadGraph");
    const exportJsonBtn = document.getElementById("exportJson");

    const uploadFileInput = document.getElementById("uploadFile");

    const vertexCountInput = document.getElementById("vertexCount");
    const graphNameInput = document.getElementById("graphName");
    const useCaseSelect = document.getElementById("useCaseSelect");

    const colorsUsedEl = document.getElementById("colors-used");
    const conflictsEl = document.getElementById("conflicts-resolved");

    const legendEl = document.getElementById("legend");
    const statusEl = document.getElementById("statusMessage");

    const cyContainer = document.getElementById("cy");

    /* =========================================================
       Status Message
       ========================================================= */

    function showStatus(message, isError = false) {
        const text = String(message || "");

        if (statusEl) {
            statusEl.textContent = text;

            statusEl.classList.remove("success", "error");
            statusEl.classList.add(isError ? "error" : "success");
        }

        if (isError) {
            console.error("ColorSolve:", text);
        } else {
            console.log("ColorSolve:", text);
        }
    }

    /* =========================================================
       HTML Escape
       ========================================================= */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =========================================================
       Button State Helpers
       Preserve icons and original HTML from 3D UI buttons
       ========================================================= */

    function setButtonLoading(button, loadingText) {
        if (!button) return;

        if (!button.dataset.originalHtml) {
            button.dataset.originalHtml = button.innerHTML;
        }

        button.disabled = true;
        button.textContent = loadingText;
    }

    function restoreButton(button) {
        if (!button) return;

        button.disabled = false;

        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }

    /* =========================================================
       Safe Edge ID
       ========================================================= */

    function normalizeEdge(source, target) {
        const first = String(source);
        const second = String(target);

        const encodedFirst = encodeURIComponent(first);
        const encodedSecond = encodeURIComponent(second);

        return first < second
            ? `${encodedFirst}__${encodedSecond}`
            : `${encodedSecond}__${encodedFirst}`;
    }

    /* =========================================================
       Normalize Backend / Local Color
       Supports:
       0, 1, 2
       "0", "1", "2"
       "#ff0000"
       "red"
       ========================================================= */

    function getVisualColor(color) {
        if (
            color !== null &&
            color !== undefined &&
            String(color).trim() !== ""
        ) {
            const numericColor = Number(color);

            if (Number.isInteger(numericColor)) {
                const normalizedIndex =
                    ((numericColor % PALETTE.length) + PALETTE.length) %
                    PALETTE.length;

                return PALETTE[normalizedIndex];
            }
        }

        return String(color || "#9ca3af");
    }

    /* =========================================================
       Check Cytoscape
       ========================================================= */

    if (typeof cytoscape === "undefined") {
        showStatus(
            "Cytoscape library is not loaded. Check the Cytoscape CDN script in index.html.",
            true
        );

        return;
    }

    if (!cyContainer) {
        showStatus(
            "Graph container with id='cy' was not found in index.html.",
            true
        );

        return;
    }

    /* =========================================================
       Cytoscape Initialization
       ========================================================= */

    const cy = cytoscape({
        container: cyContainer,

        elements: [],

        minZoom: 0.1,
        maxZoom: 5,
        wheelSensitivity: 0.2,

        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: false,

        style: [
            {
                selector: "node",

                style: {
                    "background-color": "#9ca3af",
                    "border-width": 2,
                    "border-color": "#dbeafe",

                    "label": "data(label)",

                    "text-valign": "center",
                    "text-halign": "center",

                    "color": "#ffffff",
                    "font-size": 10,
                    "font-weight": "600",

                    "text-outline-color": "#111827",
                    "text-outline-width": 2,

                    "width": 32,
                    "height": 32
                }
            },

            {
                selector: "edge",

                style: {
                    "width": 2,
                    "line-color": "#8fa6bb",
                    "curve-style": "bezier",
                    "opacity": 0.85
                }
            },

            {
                selector: "node:selected",

                style: {
                    "border-width": 4,
                    "border-color": "#00ffd0"
                }
            }
        ]
    });

    /* =========================================================
       Remove Empty Placeholder
       Needed for new 3D UI HTML
       ========================================================= */

    function removeEmptyGraphPlaceholder() {
        const placeholder = cyContainer.querySelector(".empty-graph");

        if (placeholder) {
            placeholder.remove();
        }
    }

    /* =========================================================
       Reset Result
       ========================================================= */

    function resetResult() {
        if (colorsUsedEl) {
            colorsUsedEl.textContent = "0";
        }

        if (conflictsEl) {
            conflictsEl.textContent = "0";
        }

        if (legendEl) {
            legendEl.innerHTML = "";
        }
    }

    /* =========================================================
       Get Current Graph
       ========================================================= */

    function getGraphPayload() {
        return {
            nodes: cy.nodes().map(node => node.id()),

            edges: cy.edges().map(edge => ({
                source: edge.source().id(),
                target: edge.target().id()
            }))
        };
    }

    /* =========================================================
       Render Graph
       ========================================================= */

    function renderGraph(nodes = [], edges = []) {
        removeEmptyGraphPlaceholder();

        const nodeIds = [
            ...new Set(
                (Array.isArray(nodes) ? nodes : [])
                    .map(node => {
                        if (node && typeof node === "object") {
                            return node.id ?? node.data?.id;
                        }

                        return node;
                    })
                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null &&
                            String(value).trim() !== ""
                    )
                    .map(value => String(value).trim())
            )
        ];

        const nodeSet = new Set(nodeIds);
        const edgeKeys = new Set();

        const elements = nodeIds.map(id => ({
            data: {
                id,
                label: nodeIds.length <= 100 ? id : ""
            }
        }));

        for (const edge of Array.isArray(edges) ? edges : []) {
            if (!edge) continue;

            const source = String(edge.source ?? "").trim();
            const target = String(edge.target ?? "").trim();

            if (
                !source ||
                !target ||
                source === target ||
                !nodeSet.has(source) ||
                !nodeSet.has(target)
            ) {
                continue;
            }

            const key = normalizeEdge(source, target);

            if (edgeKeys.has(key)) {
                continue;
            }

            edgeKeys.add(key);

            elements.push({
                data: {
                    id: `edge_${key}`,
                    source,
                    target
                }
            });
        }

        cy.elements().remove();

        if (elements.length > 0) {
            cy.add(elements);
        }

        const totalNodes = cy.nodes().length;

        let nodeSize = 32;
        let fontSize = 10;

        if (totalNodes > 100) {
            nodeSize = 20;
            fontSize = 8;
        }

        if (totalNodes > 300) {
            nodeSize = 12;
            fontSize = 0;
        }

        cy.nodes().style({
            width: nodeSize,
            height: nodeSize,
            "font-size": fontSize,
            "background-color": "#9ca3af",
            "border-width": 2,
            "border-color": "#dbeafe"
        });

        cy.edges().style({
            width: totalNodes > 200 ? 1 : 2,
            "line-color": "#8fa6bb"
        });

        if (totalNodes > 0) {
            const layoutName = totalNodes > 200 ? "grid" : "cose";

            cy.layout({
                name: layoutName,
                animate: false,
                fit: true,
                padding: 35,

                /*
                   COSE layout options:
                   Grid layout extra options ignore karega.
                */
                randomize: true,
                nodeRepulsion: 9000,
                idealEdgeLength: 90,
                gravity: 0.3
            }).run();

            cy.fit(undefined, 35);
            cy.center();
        }

        resetResult();
    }

    /* =========================================================
       Adjacency List -> Graph
       ========================================================= */

    function adjacencyToGraph(adjacency) {
        if (!adjacency || typeof adjacency !== "object") {
            return {
                nodes: [],
                edges: []
            };
        }

        const nodeSet = new Set(
            Object.keys(adjacency).map(key => String(key).trim())
        );

        const edges = [];
        const addedEdges = new Set();

        for (const sourceKey of Object.keys(adjacency)) {
            const source = String(sourceKey).trim();

            const neighbours = Array.isArray(adjacency[sourceKey])
                ? adjacency[sourceKey]
                : [];

            nodeSet.add(source);

            for (const neighbour of neighbours) {
                const target = String(neighbour ?? "").trim();

                if (!target || source === target) {
                    continue;
                }

                nodeSet.add(target);

                const key = normalizeEdge(source, target);

                if (addedEdges.has(key)) {
                    continue;
                }

                addedEdges.add(key);

                edges.push({
                    source,
                    target
                });
            }
        }

        return {
            nodes: [...nodeSet],
            edges
        };
    }

    /* =========================================================
       Generate Random Graph
       ========================================================= */

    function generateRandomGraph(vertexCount) {
        const nodes = [];
        const edges = [];

        for (let i = 1; i <= vertexCount; i++) {
            nodes.push(`V${i}`);
        }

        let probability = 0.15;

        if (vertexCount > 50) {
            probability = 0.08;
        }

        if (vertexCount > 150) {
            probability = 0.035;
        }

        if (vertexCount > 350) {
            probability = 0.015;
        }

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (Math.random() < probability) {
                    edges.push({
                        source: nodes[i],
                        target: nodes[j]
                    });
                }
            }
        }

        /*
           At least a connected chain for better visualization.
           Isse isolated nodes ka chance kam ho jayega.
        */
        if (vertexCount > 1) {
            const existingEdges = new Set(
                edges.map(edge => normalizeEdge(edge.source, edge.target))
            );

            for (let i = 0; i < nodes.length - 1; i++) {
                const key = normalizeEdge(nodes[i], nodes[i + 1]);

                if (!existingEdges.has(key)) {
                    existingEdges.add(key);

                    edges.push({
                        source: nodes[i],
                        target: nodes[i + 1]
                    });
                }
            }
        }

        return {
            nodes,
            edges
        };
    }

    /* =========================================================
       Apply Coloring
       ========================================================= */

    function applyColoring(coloring) {
        if (
            !coloring ||
            typeof coloring !== "object" ||
            Array.isArray(coloring)
        ) {
            throw new Error(
                "Invalid coloring result received."
            );
        }

        cy.nodes().forEach(node => {
            node.style("background-color", "#9ca3af");
        });

        for (const [id, color] of Object.entries(coloring)) {
            const node = cy.getElementById(String(id));

            if (node.length > 0) {
                node.style(
                    "background-color",
                    getVisualColor(color)
                );
            }
        }

        const usedColors = new Set(
            Object.values(coloring).map(getVisualColor)
        );

        if (colorsUsedEl) {
            colorsUsedEl.textContent = String(usedColors.size);
        }

        let conflicts = 0;

        cy.edges().forEach(edge => {
            const sourceId = edge.source().id();
            const targetId = edge.target().id();

            const sourceColor = coloring[sourceId];
            const targetColor = coloring[targetId];

            if (
                sourceColor !== undefined &&
                targetColor !== undefined &&
                String(sourceColor) === String(targetColor)
            ) {
                conflicts++;
            }
        });

        if (conflictsEl) {
            conflictsEl.textContent = String(conflicts);
        }

        if (legendEl) {
            legendEl.innerHTML = [...usedColors]
                .map(
                    (color, index) => `
                        <span class="legend-item">
                            <span
                                class="legend-color"
                                style="background:${escapeHtml(color)}">
                            </span>
                            Color ${index + 1}
                        </span>
                    `
                )
                .join("");
        }
    }

    /* =========================================================
       Local DSATUR Algorithm
       ========================================================= */

    function runLocalDsatur() {
        if (cy.nodes().length === 0) {
            showStatus(
                "Create, generate, upload, or load a graph first.",
                true
            );

            return;
        }

        setButtonLoading(runLocalBtn, "Coloring...");

        try {
            const coloring = {};

            const uncolored = new Set(
                cy.nodes().map(node => node.id())
            );

            while (uncolored.size > 0) {
                let selectedId = null;
                let maxSaturation = -1;
                let maxDegree = -1;

                for (const nodeId of uncolored) {
                    const node = cy.getElementById(nodeId);

                    const neighbourColors = new Set();

                    node.neighborhood("node").forEach(neighbour => {
                        const neighbourColor = coloring[neighbour.id()];

                        if (neighbourColor !== undefined) {
                            neighbourColors.add(neighbourColor);
                        }
                    });

                    const saturation = neighbourColors.size;
                    const degree = node.neighborhood("node").length;

                    const shouldSelect =
                        saturation > maxSaturation ||
                        (saturation === maxSaturation && degree > maxDegree) ||
                        (
                            saturation === maxSaturation &&
                            degree === maxDegree &&
                            (
                                selectedId === null ||
                                nodeId.localeCompare(selectedId) < 0
                            )
                        );

                    if (shouldSelect) {
                        selectedId = nodeId;
                        maxSaturation = saturation;
                        maxDegree = degree;
                    }
                }

                if (selectedId === null) {
                    break;
                }

                const selectedNode = cy.getElementById(selectedId);

                const forbiddenColors = new Set();

                selectedNode.neighborhood("node").forEach(neighbour => {
                    const neighbourColor = coloring[neighbour.id()];

                    if (neighbourColor !== undefined) {
                        forbiddenColors.add(neighbourColor);
                    }
                });

                let colorIndex = 0;

                while (forbiddenColors.has(colorIndex)) {
                    colorIndex++;
                }

                coloring[selectedId] = colorIndex;
                uncolored.delete(selectedId);
            }

            applyColoring(coloring);

            showStatus(
                `Local DSATUR completed. ${new Set(Object.values(coloring)).size} colors used.`
            );
        } catch (error) {
            showStatus(
                `Local DSATUR failed: ${error.message}`,
                true
            );
        } finally {
            restoreButton(runLocalBtn);
        }
    }

    /* =========================================================
       Read Backend Response Safely
       ========================================================= */

    async function readResponse(response) {
        const text = await response.text();
        const trimmed = text.trim();

        if (!response.ok) {
            let message = `HTTP ${response.status}`;

            if (trimmed) {
                try {
                    const data = JSON.parse(trimmed);

                    message =
                        data.error ||
                        data.message ||
                        data.details ||
                        message;
                } catch (_) {
                    const plainText = trimmed
                        .replace(/<[^>]*>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();

                    if (plainText) {
                        message = plainText.substring(0, 300);
                    }
                }
            }

            throw new Error(message);
        }

        if (!trimmed) {
            return {};
        }

        try {
            return JSON.parse(trimmed);
        } catch (_) {
            return {
                message: trimmed
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
            };
        }
    }

    /* =========================================================
       Backend DSATUR
       Endpoint: /colorGraph
       ========================================================= */

    async function runBackendColoring() {
        if (cy.nodes().length === 0) {
            showStatus(
                "Create or load a graph first.",
                true
            );

            return;
        }

        setButtonLoading(runBackendBtn, "Processing...");

        try {
            const response = await fetch(`${API_BASE}/colorGraph`, {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(getGraphPayload())
            });

            const result = await readResponse(response);

            if (result.error) {
                throw new Error(result.error);
            }

            const coloring =
                result.coloring ||
                result.result?.coloring ||
                result.data?.coloring ||
                result.data;

            if (
                !coloring ||
                typeof coloring !== "object" ||
                Array.isArray(coloring)
            ) {
                throw new Error(
                    "Backend response does not contain a valid 'coloring' object."
                );
            }

            applyColoring(coloring);

            showStatus(
                "Backend DSATUR coloring completed successfully."
            );
        } catch (error) {
            showStatus(
                `Backend coloring failed: ${error.message}`,
                true
            );
        } finally {
            restoreButton(runBackendBtn);
        }
    }

    /* =========================================================
       Save Graph
       Endpoint: /saveGraph
       ========================================================= */

    async function saveGraph() {
        const graph = getGraphPayload();

        if (graph.nodes.length === 0) {
            showStatus(
                "There is no graph available to save.",
                true
            );

            return;
        }

        const graphName =
            graphNameInput?.value.trim() ||
            `Graph ${new Date().toLocaleString()}`;

        const colorsUsed =
            Number(colorsUsedEl?.textContent) || 0;

        const formData = new URLSearchParams();

        formData.set("name", graphName);
        formData.set("nodes", JSON.stringify(graph.nodes));
        formData.set("edges", JSON.stringify(graph.edges));
        formData.set("colors", String(colorsUsed));

        setButtonLoading(saveGraphBtn, "Saving...");

        try {
            const response = await fetch(`${API_BASE}/saveGraph`, {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8",

                    "Accept": "application/json"
                },

                body: formData.toString()
            });

            const result = await readResponse(response);

            if (result.error) {
                throw new Error(result.error);
            }

            const databaseId =
                result.id ??
                result.graphId ??
                result.data?.id ??
                "saved";

            showStatus(
                `Graph saved successfully. Database ID: ${databaseId}`
            );
        } catch (error) {
            showStatus(
                `Graph save failed: ${error.message}`,
                true
            );
        } finally {
            restoreButton(saveGraphBtn);
        }
    }

    /* =========================================================
       Parse Possible JSON
       ========================================================= */

    function parsePossibleJson(value) {
        if (typeof value !== "string") {
            return value;
        }

        const trimmed = value.trim();

        if (!trimmed) {
            return value;
        }

        try {
            return JSON.parse(trimmed);
        } catch (_) {
            return value;
        }
    }

    /* =========================================================
       Normalize Saved Graph
       ========================================================= */

    function normalizeSavedGraph(result) {
        if (!result || typeof result !== "object") {
            throw new Error(
                "Saved graph response is empty or invalid."
            );
        }

        const actualResult =
            result.data &&
            typeof result.data === "object" &&
            !Array.isArray(result.data)
                ? result.data
                : result;

        let nodes = parsePossibleJson(actualResult.nodes);
        let edges = parsePossibleJson(actualResult.edges);

        if (Array.isArray(nodes) && Array.isArray(edges)) {
            return {
                name: actualResult.name || result.name || "",

                nodes: nodes
                    .map(node => {
                        if (node && typeof node === "object") {
                            return String(node.id ?? node.data?.id ?? "");
                        }

                        return String(node ?? "");
                    })
                    .filter(Boolean),

                edges: edges
                    .map(edge => ({
                        source: String(edge.source ?? ""),
                        target: String(edge.target ?? "")
                    }))
                    .filter(edge => edge.source && edge.target)
            };
        }

        /*
           If backend returns adjacency object in nodes field.
        */
        if (
            nodes &&
            typeof nodes === "object" &&
            !Array.isArray(nodes)
        ) {
            const graph = adjacencyToGraph(nodes);

            return {
                name: actualResult.name || result.name || "",
                nodes: graph.nodes,
                edges: graph.edges
            };
        }

        /*
           If backend directly returns adjacency object:
           {
               "A": ["B", "C"],
               "B": ["A"]
           }
        */
        if (
            !actualResult.nodes &&
            !actualResult.edges &&
            typeof actualResult === "object"
        ) {
            const graph = adjacencyToGraph(actualResult);

            if (graph.nodes.length > 0) {
                return {
                    name: result.name || "",
                    nodes: graph.nodes,
                    edges: graph.edges
                };
            }
        }

        throw new Error(
            "Saved graph response must contain nodes and edges arrays."
        );
    }

    /* =========================================================
       Load Latest Graph
       Endpoint: /getGraph
       ========================================================= */

    async function loadLatestGraph() {
        setButtonLoading(loadGraphBtn, "Loading...");

        try {
            const response = await fetch(`${API_BASE}/getGraph`, {
                method: "GET",

                headers: {
                    "Accept": "application/json"
                }
            });

            const result = await readResponse(response);

            if (result.error) {
                throw new Error(result.error);
            }

            const graph = normalizeSavedGraph(result);

            renderGraph(graph.nodes, graph.edges);

            if (graph.name && graphNameInput) {
                graphNameInput.value = graph.name;
            }

            showStatus(
                `Loaded graph: ${graph.name || "latest saved graph"}.`
            );
        } catch (error) {
            showStatus(
                `Graph load failed: ${error.message}`,
                true
            );
        } finally {
            restoreButton(loadGraphBtn);
        }
    }

    /* =========================================================
       Export Graph JSON
       ========================================================= */

    function exportGraphJson() {
        const graph = getGraphPayload();

        if (graph.nodes.length === 0) {
            showStatus(
                "There is no graph available to export.",
                true
            );

            return;
        }

        const exportData = {
            name:
                graphNameInput?.value.trim() ||
                "ColorSolve Graph",

            useCase:
                useCaseSelect?.value || "custom",

            exportedAt: new Date().toISOString(),

            nodes: graph.nodes,
            edges: graph.edges
        };

        const blob = new Blob(
            [JSON.stringify(exportData, null, 2)],
            {
                type: "application/json"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "colorsolve-graph.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        showStatus("Graph JSON download started.");
    }

    /* =========================================================
       Parse Uploaded File
       Supports JSON / CSV / TXT adjacency list
       ========================================================= */

    function parseUploadedGraph(text, fileName) {
        const trimmed = String(text ?? "").trim();

        if (!trimmed) {
            throw new Error("The uploaded file is empty.");
        }

        const lowerName = String(fileName || "").toLowerCase();

        /* ---------------- JSON ---------------- */

        if (lowerName.endsWith(".json")) {
            let parsed;

            try {
                parsed = JSON.parse(trimmed);
            } catch (error) {
                throw new Error(
                    `Invalid JSON file: ${error.message}`
                );
            }

            if (
                Array.isArray(parsed.nodes) &&
                Array.isArray(parsed.edges)
            ) {
                return {
                    nodes: parsed.nodes
                        .map(node => {
                            if (node && typeof node === "object") {
                                return String(node.id ?? node.data?.id ?? "");
                            }

                            return String(node ?? "");
                        })
                        .filter(Boolean),

                    edges: parsed.edges
                        .map(edge => ({
                            source: String(edge.source ?? ""),
                            target: String(edge.target ?? "")
                        }))
                        .filter(edge => edge.source && edge.target)
                };
            }

            if (
                parsed.graph &&
                typeof parsed.graph === "object"
            ) {
                return normalizeSavedGraph(parsed.graph);
            }

            if (
                parsed.data &&
                typeof parsed.data === "object"
            ) {
                return normalizeSavedGraph(parsed);
            }

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return adjacencyToGraph(parsed);
            }

            throw new Error(
                "Unsupported JSON graph format."
            );
        }

        /* ---------------- CSV ---------------- */

        if (lowerName.endsWith(".csv")) {
            const lines = trimmed.split(/\r?\n/);

            const nodes = new Set();
            const edges = [];
            const edgeSet = new Set();

            for (let index = 0; index < lines.length; index++) {
                const line = lines[index].trim();

                if (!line) {
                    continue;
                }

                /*
                   Ignore header:
                   source,target
                */
                if (
                    index === 0 &&
                    /^source\s*,\s*target$/i.test(line)
                ) {
                    continue;
                }

                const parts = line.split(",");

                if (parts.length < 2) {
                    throw new Error(
                        `Invalid CSV line ${index + 1}: ${line}`
                    );
                }

                const source = parts[0].trim();
                const target = parts[1].trim();

                if (!source || !target || source === target) {
                    continue;
                }

                const edgeKey = normalizeEdge(source, target);

                if (edgeSet.has(edgeKey)) {
                    continue;
                }

                edgeSet.add(edgeKey);

                nodes.add(source);
                nodes.add(target);

                edges.push({
                    source,
                    target
                });
            }

            if (nodes.size === 0) {
                throw new Error(
                    "CSV file does not contain valid graph edges."
                );
            }

            return {
                nodes: [...nodes],
                edges
            };
        }

        /* ---------------- TXT adjacency list ---------------- */

        const adjacency = {};

        for (const rawLine of trimmed.split(/\r?\n/)) {
            const line = rawLine.trim();

            if (!line || line.startsWith("#")) {
                continue;
            }

            const match = line.match(
                /^\s*([^:]+)\s*:\s*(.*)$/
            );

            if (!match) {
                throw new Error(
                    `Invalid adjacency line: ${line}. Use format: A: B, C`
                );
            }

            const node = match[1].trim();

            if (!node) {
                continue;
            }

            const neighbours = match[2].trim()
                ? match[2]
                    .split(",")
                    .map(value => value.trim())
                    .filter(Boolean)
                : [];

            adjacency[node] = neighbours;
        }

        const graph = adjacencyToGraph(adjacency);

        if (graph.nodes.length === 0) {
            throw new Error(
                "Text file does not contain valid graph data."
            );
        }

        return graph;
    }

    /* =========================================================
       Generate Graph Button Event
       ========================================================= */

    if (loadExampleBtn) {
        loadExampleBtn.addEventListener("click", () => {
            const count = Number.parseInt(
                vertexCountInput?.value ?? "30",
                10
            );

            if (
                !Number.isInteger(count) ||
                count < 3 ||
                count > 500
            ) {
                showStatus(
                    "Vertex count must be between 3 and 500.",
                    true
                );

                return;
            }

            const graph = generateRandomGraph(count);

            renderGraph(graph.nodes, graph.edges);

            if (
                graphNameInput &&
                !graphNameInput.value.trim()
            ) {
                const useCaseName =
                    useCaseSelect?.options[
                        useCaseSelect.selectedIndex
                    ]?.text || "Custom";

                graphNameInput.value =
                    `${useCaseName} Graph`;
            }

            showStatus(
                `${count}-vertex graph generated with ${graph.edges.length} edges.`
            );
        });
    }

    /* =========================================================
       Button Events
       ========================================================= */

    if (runLocalBtn) {
        runLocalBtn.addEventListener(
            "click",
            runLocalDsatur
        );
    }

    if (runBackendBtn) {
        runBackendBtn.addEventListener(
            "click",
            runBackendColoring
        );
    }

    if (saveGraphBtn) {
        saveGraphBtn.addEventListener(
            "click",
            saveGraph
        );
    }

    if (loadGraphBtn) {
        loadGraphBtn.addEventListener(
            "click",
            loadLatestGraph
        );
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener(
            "click",
            exportGraphJson
        );
    }

    /* =========================================================
       File Upload Event
       ========================================================= */

    if (uploadFileInput) {
        uploadFileInput.addEventListener("change", event => {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const graph = parseUploadedGraph(
                        String(reader.result ?? ""),
                        file.name
                    );

                    renderGraph(graph.nodes, graph.edges);

                    if (graphNameInput) {
                        graphNameInput.value = file.name.replace(
                            /\.[^.]+$/,
                            ""
                        );
                    }

                    showStatus(
                        `File imported: ${graph.nodes.length} nodes and ${graph.edges.length} edges.`
                    );
                } catch (error) {
                    showStatus(
                        `File import failed: ${error.message}`,
                        true
                    );
                } finally {
                    /*
                       Allows selecting the same file again.
                    */
                    uploadFileInput.value = "";
                }
            };

            reader.onerror = () => {
                showStatus(
                    "Unable to read the selected file.",
                    true
                );

                uploadFileInput.value = "";
            };

            reader.readAsText(file);
        });
    }

    /* =========================================================
       Responsive Cytoscape Resize
       ========================================================= */

    window.addEventListener("resize", () => {
        setTimeout(() => {
            cy.resize();

            if (cy.nodes().length > 0) {
                cy.fit(undefined, 35);
            }
        }, 150);
    });

    /* =========================================================
       Initial Graph
       ========================================================= */

    const initialGraph = generateRandomGraph(30);

    renderGraph(
        initialGraph.nodes,
        initialGraph.edges
    );

    showStatus(
        "Graph initialized. Run Local DSATUR or Run via Backend."
    );

    console.log("ColorSolve script loaded successfully.");
    console.log("ColorSolve API_BASE:", API_BASE);
})();