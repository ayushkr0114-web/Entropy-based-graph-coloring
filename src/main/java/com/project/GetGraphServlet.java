package com.project;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.*;
import java.sql.*;
import java.util.*;

@WebServlet("/getGraph")
public class GetGraphServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            Connection con = DBConnection.getConnection();

            String query = "SELECT * FROM graph_data ORDER BY id DESC";
            PreparedStatement ps = con.prepareStatement(query);
            ResultSet rs = ps.executeQuery();

            List<Map<String, String>> graphs = new ArrayList<>();

            while (rs.next()) {
                Map<String, String> graph = new HashMap<>();
                graph.put("id", String.valueOf(rs.getInt("id")));
                graph.put("name", rs.getString("name"));
                graph.put("nodes", rs.getString("nodes"));
                graph.put("edges", rs.getString("edges"));
                graph.put("colors", String.valueOf(rs.getInt("colors")));
                graphs.add(graph);
            }

            // Build JSON response
            StringBuilder json = new StringBuilder();
            json.append("{ \"graphs\": [");

            for (int i = 0; i < graphs.size(); i++) {
                Map<String, String> g = graphs.get(i);
                json.append("{");
                json.append("\"id\":\"").append(g.get("id")).append("\",");
                json.append("\"name\":\"").append(g.get("name")).append("\",");
                json.append("\"nodes\":\"").append(g.get("nodes")).append("\",");
                json.append("\"edges\":\"").append(g.get("edges")).append("\",");
                json.append("\"colors\":\"").append(g.get("colors")).append("\"");
                json.append("}");
                if (i < graphs.size() - 1) json.append(",");
            }

            json.append("] }");

            out.print(json.toString());
            con.close();

        } catch (Exception e) {
            e.printStackTrace();
            out.print("{\"error\":\"DB Error: " + e.getMessage() + "\"}");
        }
    }
}