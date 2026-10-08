package com.project;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/saveGraph")
public class GraphServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        doPost(request, response);
    }

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        response.setContentType("text/plain");
        response.setCharacterEncoding("UTF-8");

        String name = request.getParameter("name");
        String nodes = request.getParameter("nodes"); // Comma-separated: A,B,C
        String edges = request.getParameter("edges"); // Format: A-B,B-C
        String colors = request.getParameter("colors");

        try {
            Connection con = DBConnection.getConnection();

            // Count nodes
            int nodeCount = nodes != null && !nodes.trim().isEmpty() 
                ? nodes.split(",").length 
                : 0;

            // Count colors (if numeric)
            int colorCount = 0;
            try {
                colorCount = Integer.parseInt(colors);
            } catch (NumberFormatException e) {
                colorCount = 0;
            }

            PreparedStatement ps = con.prepareStatement(
                "INSERT INTO graph_data(name, nodes, edges, colors) VALUES(?,?,?,?)"
            );

            ps.setString(1, name);
            ps.setString(2, nodes);
            ps.setString(3, edges);
            ps.setInt(4, colorCount);

            int i = ps.executeUpdate();

            if (i > 0) {
                response.getWriter().println("Data Saved Successfully ✅");
            } else {
                response.getWriter().println("Error ❌");
            }

            con.close();

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().println("Error: " + e.getMessage());
        }
    }
}