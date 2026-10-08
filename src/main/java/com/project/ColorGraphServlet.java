package com.project;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.WebServlet;
import java.io.*;
import java.util.*;

@WebServlet("/colorGraph")
public class ColorGraphServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        BufferedReader reader = request.getReader();
        StringBuilder sb = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }

        System.out.println("Received JSON: " + sb.toString());

        try {
            // Parse input
            Map<String, Object> input = parseJson(sb.toString());
            List<String> nodes = (List<String>) input.get("nodes");
            List<List<String>> edges = (List<List<String>>) input.get("edges");

            // Build adjacency list
            Map<String, Set<String>> adj = buildAdjacency(nodes, edges);

            // DSATUR greedy coloring
            Map<String, String> coloring = dsaturColor(adj);

            // Send response
            PrintWriter out = response.getWriter();
            out.print(toJson(coloring));
            out.flush();

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            PrintWriter out = response.getWriter();
            out.print("{\"error\":\"" + e.getMessage() + "\"}");
            out.flush();
        }
    }

    private Map<String, Object> parseJson(String json) {
        // Simple parser for { "nodes": ["A","B"], "edges": [["A","B"]] }
        Map<String, Object> result = new HashMap<>();
        List<String> nodes = new ArrayList<>();
        List<List<String>> edges = new ArrayList<>();

        // Extract nodes
        int nodesStart = json.indexOf("\"nodes\"");
        if (nodesStart != -1) {
            int arrStart = json.indexOf("[", nodesStart);
            int arrEnd = json.indexOf("]", arrStart);
            String nodesStr = json.substring(arrStart + 1, arrEnd);
            for (String s : nodesStr.split("\"")) {
                s = s.trim();
                if (!s.isEmpty() && !s.equals(",") && !s.equals(":")) {
                    nodes.add(s);
                }
            }
        }

        // Extract edges
        int edgesStart = json.indexOf("\"edges\"");
        if (edgesStart != -1) {
            int arrStart = json.indexOf("[", edgesStart);
            int depth = 0;
            int edgeStart = -1;
            for (int i = arrStart; i < json.length(); i++) {
                char c = json.charAt(i);
                if (c == '[') {
                    depth++;
                    if (depth == 2) edgeStart = i + 1;
                } else if (c == ']') {
                    depth--;
                    if (depth == 1 && edgeStart != -1) {
                        String edgeStr = json.substring(edgeStart, i);
                        List<String> edge = new ArrayList<>();
                        for (String s : edgeStr.split("\"")) {
                            s = s.trim();
                            if (!s.isEmpty() && !s.equals(",") && !s.equals(":")) {
                                edge.add(s);
                            }
                        }
                        if (edge.size() == 2) edges.add(edge);
                        edgeStart = -1;
                    }
                }
            }
        }

        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    private Map<String, Set<String>> buildAdjacency(List<String> nodes, List<List<String>> edges) {
        Map<String, Set<String>> adj = new HashMap<>();
        for (String node : nodes) {
            adj.put(node, new HashSet<>());
        }
        for (List<String> edge : edges) {
            if (edge.size() == 2) {
                String u = edge.get(0);
                String v = edge.get(1);
                adj.get(u).add(v);
                adj.get(v).add(u);
            }
        }
        return adj;
    }

    private Map<String, String> dsaturColor(Map<String, Set<String>> adj) {
        Map<String, String> coloring = new HashMap<>();
        Map<String, Integer> saturation = new HashMap<>();
        Map<String, Integer> degree = new HashMap<>();

        for (String node : adj.keySet()) {
            saturation.put(node, 0);
            degree.put(node, adj.get(node).size());
        }

        List<String> colors = Arrays.asList(
            "#e6194b", "#3cb44b", "#ffe119", "#0000ff", "#911eb4",
            "#46f0f0", "#f032e6", "#d2f53c", "#fabebe", "#008080"
        );

        Set<String> uncolored = new HashSet<>(adj.keySet());

        while (!uncolored.isEmpty()) {
            // Select node with highest saturation, then degree
            String selected = null;
            int maxSat = -1;
            int maxDeg = -1;

            for (String node : uncolored) {
                int sat = saturation.get(node);
                int deg = degree.get(node);
                if (sat > maxSat || (sat == maxSat && deg > maxDeg)) {
                    maxSat = sat;
                    maxDeg = deg;
                    selected = node;
                }
            }

            // Find smallest available color
            Set<String> neighborColors = new HashSet<>();
            for (String neighbor : adj.get(selected)) {
                if (coloring.containsKey(neighbor)) {
                    neighborColors.add(coloring.get(neighbor));
                }
            }

            String chosenColor = colors.get(0);
            for (String color : colors) {
                if (!neighborColors.contains(color)) {
                    chosenColor = color;
                    break;
                }
            }

            coloring.put(selected, chosenColor);
            uncolored.remove(selected);

            // Update saturation of neighbors
            for (String neighbor : adj.get(selected)) {
                if (uncolored.contains(neighbor)) {
                    saturation.put(neighbor, saturation.get(neighbor) + 1);
                }
            }
        }

        return coloring;
    }

    private String toJson(Map<String, String> coloring) {
        StringBuilder json = new StringBuilder();
        json.append("{\"coloring\":{");
        int i = 0;
        for (Map.Entry<String, String> entry : coloring.entrySet()) {
            json.append("\"").append(entry.getKey()).append("\":")
                .append("\"").append(entry.getValue()).append("\"");
            if (i < coloring.size() - 1) json.append(",");
            i++;
        }
        json.append("}}");
        return json.toString();
    }
}