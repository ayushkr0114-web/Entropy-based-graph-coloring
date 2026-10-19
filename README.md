# 🌐 ColorSolve: Entropy Compression for Graph Coloring

A comprehensive web-based application designed to implement and solve graph coloring problems using graph theory concepts and **entropy compression algorithms**, powered by Java Servlets and interactive frontend visualizations.

---

## 🌟 Key Features

* **Graph Coloring Optimization:** Implements advanced algorithmic solutions for graph coloring and entropy compression.
* **Interactive Visualization:** Integrated with **Cytoscape.js** on the frontend for dynamic, interactive graph rendering and manipulation.
* **Backend Servlet Architecture:** Built using robust Java Servlets (`ColorGraphServlet`) to handle complex computation requests and JSON data exchange.
* **RESTful JSON Communication:** Seamlessly transfers graph nodes, edges, and color-mapping results between the client and backend server.

---

## 🏗️ System Architecture & Workflow

```text
       +-------------------------------------------------------------+
       |                        Client Browser                       |
       |               (JavaScript & Cytoscape.js UI)                |
       +------------------------------+------------------------------+
                                      |
                     HTTP JSON Requests (Graph Data)
                                      |
                                      v
       +-------------------------------------------------------------+
       |                  Apache Tomcat Web Server                   |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                   ColorGraphServlet (Java)                  |
       |       - Parses Graph Structure                              |
       |       - Executes Entropy Compression Algorithm              |
       |       - Computes Optimal Graph Coloring                     |
       +------------------------------+------------------------------+
                                      |
                           JSON Response (Color Mapping)
                                      |
                                      v
       +-------------------------------------------------------------+
       |                Cytoscape.js Frontend Renderer               |
       |               (Visualizes Colored Graph Nodes)              |
       +-------------------------------------------------------------+
🛠️ Technology Stack
Backend: Java, Servlets, JSON Processing

Frontend: HTML5, CSS3, JavaScript, Cytoscape.js

Server: Apache Tomcat

IDE: Eclipse IDE / Spring Tool Suite (STS)

📂 Project Structure
Plaintext
COLORSOLVEPROJECT/
│
├── src/main/java/
│   └── servlets/      # Backend Java servlets (ColorGraphServlet.java)
│
├── src/main/webapp/
│   ├── js/            # Frontend scripts & Cytoscape.js logic (script.js)
│   ├── css/           # Styling sheets
│   └── index.jsp      # Main application interface
│
└── README.md
⚙️ Local Setup and Installation
Clone the Repository:

Bash
git clone [https://github.com/ayushkr0114-web/Entropy-based-graph-coloring.git](https://github.com/ayushkr0114-web/Entropy-based-graph-coloring.git)
Import into Eclipse IDE:

Open Eclipse / STS.

Go to File > Import > General > Existing Projects into Workspace.

Browse and select the COLORSOLVEPROJECT folder and click Finish.

Deploy and Run:

Right-click the project folder > Run As > Run on Server (Select Apache Tomcat).

Open your web browser and navigate to:
http://localhost:8080/COLORSOLVEPROJECT/

👨‍💻 Author
Ayush Kumar

Computer Science & Engineering (Cyber Security) Student

GitHub Profile

📜 License
This project is open-source and available under the MIT License.


---

### Isko GitHub par kaise daalein?
1. Apne GitHub repository (`Entropy-based-graph-coloring`) par jayein.
2. **"Add file"** > **"Create new file"** par click karein.
3. File ka naam **`README.md`** rakhein.
4. Upar diya gaya pura code copy karke wahan paste kar dein.
5. Neeche green color ke **"Commit changes..."** button par click karke save kar dein. 

Iske sath hi aapke teeno projects (`BharatRail`, `DigitalSignatureSystem`, aur `ColorSolv
