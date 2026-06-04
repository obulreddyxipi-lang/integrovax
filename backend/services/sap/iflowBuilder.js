const JSZip = require("jszip");
const xml2js = require("xml2js");
const baseTemplate = require("./blank_template");

function toSafeId(raw) {
  const s = String(raw || "").trim();
  const cleaned = s.replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_");
  const result = cleaned.replace(/^_+|_+$/g, "");
  if (!result) throw new Error("Invalid iflowId (empty after sanitization)");
  return result;
}

function base64UrlToBase64(s) {
  const str = String(s || "").trim();
  if (!str) return str;
  if (!/[+\/]/.test(str) && /[-_]/.test(str)) {
    let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    return b64;
  }
  return str;
}

async function buildIflowZipBase64({ iflowId, iflowName, iflwXml, scripts, mappings }) {
  const id = toSafeId(iflowId);
  const name = iflowName || id;

  console.log(`[ZIP BUILDER] Customizing native BTP template for iFlow: ${id}`);
  
  // Load standard CPI-native ZIP template in memory
  const zip = await JSZip.loadAsync(baseTemplate.zipBase64, { base64: true });
  
  // 1. Customize META-INF/MANIFEST.MF
  if (zip.file("META-INF/MANIFEST.MF")) {
    let manifest = await zip.file("META-INF/MANIFEST.MF").async("string");
    manifest = manifest
      .replace(/Bundle-SymbolicName: [^;\n]+/g, `Bundle-SymbolicName: ${id}`)
      .replace(/Bundle-Name: [^\n]+/g, `Bundle-Name: ${name}`)
      .replace(/Bundle-Version: [^\n]+/g, `Bundle-Version: 1.0.1`)
      .replace(/Origin-Bundle-Name: [^\n]+/g, `Origin-Bundle-Name: ${name}`)
      .replace(/Origin-Bundle-SymbolicName: [^\n]+/g, `Origin-Bundle-SymbolicName: ${id}`);
    zip.file("META-INF/MANIFEST.MF", manifest);
  }
  
  // 2. Customize metainfo.prop
  if (zip.file("metainfo.prop")) {
    let metainfo = await zip.file("metainfo.prop").async("string");
    metainfo = metainfo.replace(/description=[^\n]*/g, `description=Created dynamically by iFlow Builder: ${name}`);
    zip.file("metainfo.prop", metainfo);
  }
  
  // 3. Customize and rename .iflw file
  const oldIflwPath = Object.keys(zip.files).find(f => f.endsWith(".iflw"));
  
  if (iflwXml) {
    // If a custom XML is provided, validate it first and customize its process ID elements dynamically
    let xmlStr = String(iflwXml);
    xmlStr = xmlStr
      .replace(/processRef="iflow_skeleton"/g, `processRef="${id}"`)
      .replace(/id="iflow_skeleton"/g, `id="${id}"`)
      .replace(/bpmnElement="iflow_skeleton"/g, `bpmnElement="${id}"`)
      .replace(/routeid="iflow_skeleton"/g, `routeid="${id}"`)
      .replace(/processRef="iflow_reference"/g, `processRef="${id}"`)
      .replace(/id="iflow_reference"/g, `id="${id}"`)
      .replace(/bpmnElement="iflow_reference"/g, `bpmnElement="${id}"`)
      .replace(/routeid="iflow_reference"/g, `routeid="${id}"`)
      .replace(/processRef="if_echo_mapping"/g, `processRef="${id}"`)
      .replace(/id="if_echo_mapping"/g, `id="${id}"`)
      .replace(/bpmnElement="if_echo_mapping"/g, `bpmnElement="${id}"`)
      .replace(/routeid="if_echo_mapping"/g, `routeid="${id}"`)
      .replace(/name="My Blank iFlow"/g, `name="${name}"`)
      .replace(/name="Pallet Reference Flow"/g, `name="${name}"`)
      .replace(/name="Multi-Adapter Enterprise Intent Flow"/g, `name="${name}"`);

    const parser = new xml2js.Parser({ explicitArray: false });
    await parser.parseStringPromise(xmlStr);
    
    // Remove the old iflw file
    if (oldIflwPath) zip.remove(oldIflwPath);
    
    // Save new custom XML
    const newIflwPath = `src/main/resources/scenarioflows/integrationflow/${id}.iflw`;
    zip.file(newIflwPath, xmlStr);
  } else if (oldIflwPath) {
    // Otherwise customize the template .iflw file in place
    let iflwContent = await zip.file(oldIflwPath).async("string");
    
    // Replace default process references with new technical ID
    iflwContent = iflwContent
      .replace(/processRef="if_echo_mapping"/g, `processRef="${id}"`)
      .replace(/id="if_echo_mapping"/g, `id="${id}"`)
      .replace(/bpmnElement="if_echo_mapping"/g, `bpmnElement="${id}"`)
      .replace(/name="My Blank iFlow"/g, `name="${name}"`);

    // If custom Groovy script is provided, convert CallActivity_5 to a Groovy Script step in the diagram
    if (Array.isArray(scripts) && scripts.length > 0) {
      const firstScriptName = scripts[0].fileName || scripts[0].name || "script.groovy";
      const callActivity5Regex = /<bpmn2:callActivity id="CallActivity_5" name="[^"]*">([\s\S]*?)<\/bpmn2:callActivity>/;
      const match = iflwContent.match(callActivity5Regex);

      if (match) {
        const groovyProps = `
        <bpmn2:extensionElements>
            <ifl:property>
                <key>activityType</key>
                <value>Script</value>
            </ifl:property>
            <ifl:property>
                <key>cmdVariantUri</key>
                <value>ctype::FlowstepVariant/cname::GroovyScript/version::1.1.2</value>
            </ifl:property>
            <ifl:property>
                <key>componentVersion</key>
                <value>1.1</value>
            </ifl:property>
            <ifl:property>
                <key>scriptFunction</key>
                <value>processData</value>
            </ifl:property>
            <ifl:property>
                <key>scriptPath</key>
                <value>src/main/resources/scripts/${firstScriptName}</value>
            </ifl:property>
            <ifl:property>
                <key>scriptType</key>
                <value>Groovy</value>
            </ifl:property>
        </bpmn2:extensionElements>`;
        
        const stepName = firstScriptName.replace(/\.groovy$/i, "").replace(/_/g, " ");
        const formattedStepName = stepName.charAt(0).toUpperCase() + stepName.slice(1);
        iflwContent = iflwContent.replace(callActivity5Regex, `<bpmn2:callActivity id="CallActivity_5" name="${formattedStepName}">${groovyProps}</bpmn2:callActivity>`);
      }

      // Bypass CallActivity_8
      iflwContent = iflwContent
        .replace(
          /<bpmn2:sequenceFlow id="SequenceFlow_6" sourceRef="CallActivity_5" targetRef="CallActivity_8"\/>/,
          `<bpmn2:sequenceFlow id="SequenceFlow_6" sourceRef="CallActivity_5" targetRef="EndEvent_2"/>`
        )
        .replace(/<bpmn2:callActivity id="CallActivity_8" name="Set Body">[\s\S]*?<\/bpmn2:callActivity>/, "")
        .replace(/<bpmn2:sequenceFlow id="SequenceFlow_9" sourceRef="CallActivity_8" targetRef="EndEvent_2"\/>/, "")
        .replace(/<bpmndi:BPMNShape bpmnElement="CallActivity_8" id="BPMNShape_CallActivity_8">[\s\S]*?<\/bpmndi:BPMNShape>/, "")
        .replace(/<bpmndi:BPMNEdge bpmnElement="SequenceFlow_9" id="BPMNEdge_SequenceFlow_9">[\s\S]*?<\/bpmndi:BPMNEdge>/);

      const edge6Regex = /<bpmndi:BPMNEdge bpmnElement="SequenceFlow_6" id="BPMNEdge_SequenceFlow_6" sourceElement="BPMNShape_CallActivity_5" targetElement="BPMNShape_CallActivity_8">[\s\S]*?<\/bpmndi:BPMNEdge>/;
      const newEdge6 = `
            <bpmndi:BPMNEdge bpmnElement="SequenceFlow_6" id="BPMNEdge_SequenceFlow_6" sourceElement="BPMNShape_CallActivity_5" targetElement="BPMNShape_EndEvent_2">
                <di:waypoint x="432.0" xsi:type="dc:Point" y="158.0"/>
                <di:waypoint x="719.0" xsi:type="dc:Point" y="158.0"/>
            </bpmndi:BPMNEdge>`;
      
      iflwContent = iflwContent.replace(edge6Regex, newEdge6);
    }
      
    zip.remove(oldIflwPath);
    const newIflwPath = `src/main/resources/scenarioflows/integrationflow/${id}.iflw`;
    zip.file(newIflwPath, iflwContent);
  }
  
  const packedFiles = Object.keys(zip.files);

  // 4. Pack Groovy scripts if provided
  if (Array.isArray(scripts) && scripts.length > 0) {
    const scriptFolder = zip.folder("src/main/resources/scripts");
    scripts.forEach((s) => {
      const fileName = s.fileName || s.name || "script.groovy";
      const code = s.code || s.content || "";
      scriptFolder.file(fileName, code);
      packedFiles.push(`src/main/resources/scripts/${fileName}`);
    });
  }

  // 5. Pack mappings (XSLT) if provided
  if (Array.isArray(mappings) && mappings.length > 0) {
    const mappingFolder = zip.folder("src/main/resources/mapping");
    mappings.forEach((m) => {
      const fileName = m.fileName || m.name || "mapping.xsl";
      const code = m.code || m.content || "";
      mappingFolder.file(fileName, code);
      packedFiles.push(`src/main/resources/mapping/${fileName}`);
    });
  }

  // Generate Base64
  const base64 = await zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return {
    iflowId: id,
    iflowName: name,
    artifactContentBase64: base64,
    files: packedFiles,
  };
}

module.exports = {
  buildIflowZipBase64,
  toSafeId,
  base64UrlToBase64,
};
