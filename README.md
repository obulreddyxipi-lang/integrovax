# IntegrovaX - Integration Simulation Suite

IntegrovaX is a serverless, AI-powered integration monitoring and simulation platform designed to validate, troubleshoot, and optimize integration flows, schemas, transformations, and scripting assets.

## 🚀 Key Features

* **Overview Dashboard**: Rich analytics charts, message volume trend graphs, and iFlow status distribution dashboards.
* **Payload Simulator**: Isolated JSON/XML/CSV payload testing with timelines and diagnostics logs.
* **Transformation Tools**: Client-side conversion pipeline with 10 developer tools:
  * Format JSON & Format XML
  * XML to JSON & JSON to XML
  * CSV to XML & XML to XSD
  * Text Diff & XPath Tester
  * XSD Schema Validator
* **Groovy Script Engine**: Write and debug Groovy scripts. Runs in simulated sandbox mode entirely client-side when serverless, or securely via remote Express compilers.
* **XSLT Simulator**: Client-side XSLT stylesheet parsing using browser-native compilation.
* **API Sandbox**: Postman-style HTTP testing tool with request methods, headers, parameters, and bodies.
* **Mock Generator**: Mock dataset compiler generating JSON structures dynamically.

---

## 🛠️ Local Development & Execution

To run the full suite (frontend UI + local proxy backend) on your local machine:

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment**:
   * Create `backend/.env` with your Google Gemini API key and/or SAP BTP trial OAuth client credentials (optional).
3. **Launch the Application**:
   ```bash
   npm run start
   ```
   * The React development server will start on `http://localhost:3000`.
   * The Express API server will start on `http://localhost:40005`.

---

## ☁️ GitHub Pages Hosting

The compiled static assets in the root folder are fully set up for serverless hosting on GitHub Pages:
1. Push the main branch containing the root files to your repository.
2. In your repository settings, go to **Pages**, choose the **`main`** branch and **`/ (root)`** directory.
3. Save, and your suite will be live in about a minute. All simulators automatically fall back to client-side simulated processors if the backend is unreachable.

---

## 📄 License & Intellectual Property

This project is 100% original, copyright-free, and open-source. It contains no proprietary headers or proprietary licensing constraints, making it fully free to copy, modify, and distribute.
