const ImportEngine = (() => {
  let currentMode = "text";
  let validRows = [];

  function init() {
    document.querySelectorAll("[data-import-mode]").forEach(btn => {
      btn.addEventListener("click", () => setMode(btn.dataset.importMode));
    });
    document.getElementById("btnParseImport")?.addEventListener("click", parseCurrentMode);
    document.getElementById("btnSaveImportDrafts")?.addEventListener("click", saveValidToDraft);
    document.getElementById("btnClearImport")?.addEventListener("click", clearAll);
  }

  function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll(".import-mode").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-import-mode="${mode}"]`)?.classList.add("active");
    document.querySelectorAll(".import-mode-panel").forEach(p => p.classList.remove("active"));
    if (mode === "text") byId("bulkTextBox")?.classList.add("active");
    if (mode === "csv") byId("csvBox")?.classList.add("active");
    if (mode === "excel") byId("excelBox")?.classList.add("active");
  }

  async function parseCurrentMode() {
    try {
      let parsed = [];
      if (currentMode === "text") parsed = parseBulkText(valueText("bulkTextInput"));
      if (currentMode === "excel") parsed = parseTable(valueText("excelPasteInput"), "\t");
      if (currentMode === "csv") {
        const file = byId("csvFileInput")?.files?.[0];
        if (!file) return Toast.warning("Please select CSV file");
        parsed = parseCSV(await file.text());
      }
      const validation = validate(parsed);
      validRows = validation.valid;
      renderSummary(validation);
      renderErrors(validation.errors);
      renderPreview(validation.all);
      byId("btnSaveImportDrafts").disabled = validRows.length === 0;
      validRows.length ? Toast.success(`${validRows.length} valid questions ready`) : Toast.warning("No valid questions found");
    } catch (err) { Toast.error(err.message); }
  }

  function parseBulkText(text) {
    return text.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean).map(block => {
      const obj = { Question:"", A:"", B:"", C:"", D:"", Answer:"", Explanation:"" };
      block.split(/\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
        const s = line.replace(/^\d+[.)]\s*/, "");
        if (/^A[.)\-:]\s*/i.test(s)) obj.A = s.replace(/^A[.)\-:]\s*/i, "").trim();
        else if (/^B[.)\-:]\s*/i.test(s)) obj.B = s.replace(/^B[.)\-:]\s*/i, "").trim();
        else if (/^C[.)\-:]\s*/i.test(s)) obj.C = s.replace(/^C[.)\-:]\s*/i, "").trim();
        else if (/^D[.)\-:]\s*/i.test(s)) obj.D = s.replace(/^D[.)\-:]\s*/i, "").trim();
        else if (/^Answer\s*[:\-]?\s*/i.test(s)) obj.Answer = s.replace(/^Answer\s*[:\-]?\s*/i, "").trim().charAt(0).toUpperCase();
        else if (/^Explanation\s*[:\-]?\s*/i.test(s)) obj.Explanation = s.replace(/^Explanation\s*[:\-]?\s*/i, "").trim();
        else if (!obj.Question) obj.Question = s.trim();
        else obj.Question += " " + s.trim();
      });
      return obj;
    });
  }

  function parseTable(text, delimiter) {
    const rows = text.split(/\n/).map(r => r.trim()).filter(Boolean);
    if (!rows.length) return [];
    const headers = rows[0].split(delimiter).map(normalizeHeader);
    return rows.slice(1).map(row => {
      const cells = row.split(delimiter);
      const obj = {};
      headers.forEach((h,i) => obj[h] = (cells[i] || "").trim());
      return normalizeObj(obj);
    });
  }

  function parseCSV(text) {
    const rows = text.replace(/\r/g, "").split("\n").filter(Boolean);
    if (!rows.length) return [];
    const headers = parseCSVLine(rows[0]).map(normalizeHeader);
    return rows.slice(1).map(row => {
      const cells = parseCSVLine(row);
      const obj = {};
      headers.forEach((h,i) => obj[h] = (cells[i] || "").trim());
      return normalizeObj(obj);
    });
  }

  function parseCSVLine(line) {
    const out = []; let cur = ""; let quote = false;
    for (let i=0;i<line.length;i++) {
      const ch=line[i], next=line[i+1];
      if (ch === '"' && quote && next === '"') { cur += '"'; i++; }
      else if (ch === '"') quote = !quote;
      else if (ch === "," && !quote) { out.push(cur); cur=""; }
      else cur += ch;
    }
    out.push(cur); return out;
  }

  function normalizeHeader(h) {
    const k = String(h||"").trim().toLowerCase().replace(/\s+/g,"_");
    return ({question:"Question",question_text:"Question",a:"A",option_a:"A",b:"B",option_b:"B",c:"C",option_c:"C",d:"D",option_d:"D",answer:"Answer",correct_answer:"Answer",explanation:"Explanation"})[k] || h;
  }

  function normalizeObj(o) {
    return {
      Question: o.Question || o.Question_Text || o.question || "",
      A: o.A || o.Option_A || o.option_a || "",
      B: o.B || o.Option_B || o.option_b || "",
      C: o.C || o.Option_C || o.option_c || "",
      D: o.D || o.Option_D || o.option_d || "",
      Answer: String(o.Answer || o.Correct_Answer || o.answer || "").trim().charAt(0).toUpperCase(),
      Explanation: o.Explanation || o.explanation || ""
    };
  }

  function validate(rows) {
    const valid=[], errors=[], all=[], seen=new Set();
    rows.forEach((r,i) => {
      const q = normalizeObj(r), e=[];
      if (!q.Question) e.push("Missing question");
      if (!q.A) e.push("Missing A");
      if (!q.B) e.push("Missing B");
      if (!q.C) e.push("Missing C");
      if (!q.D) e.push("Missing D");
      if (!["A","B","C","D"].includes(q.Answer)) e.push("Invalid answer");
      const key = q.Question.toLowerCase().trim();
      if (key && seen.has(key)) e.push("Duplicate");
      if (key) seen.add(key);
      const rec = { index:i+1, question:q, errors:e, valid:e.length===0 };
      all.push(rec); e.length ? errors.push(rec) : valid.push(q);
    });
    return { total:rows.length, valid, errors, all };
  }

  function renderSummary(v) {
    byId("importSummary").innerHTML = `
      <div class="summary-tile"><span>Total</span><strong>${v.total}</strong></div>
      <div class="summary-tile"><span>Valid</span><strong>${v.valid.length}</strong></div>
      <div class="summary-tile"><span>Errors</span><strong>${v.errors.length}</strong></div>
      <div class="summary-tile"><span>Ready</span><strong>${v.valid.length}</strong></div>`;
  }

  function renderErrors(errors) {
    const box = byId("importErrors");
    box.innerHTML = errors.length ? errors.map(e => `<div class="import-error-item"><strong>Row ${e.index}</strong><p>${escapeHtml(e.errors.join(", "))}</p></div>`).join("") : `<p class="success-text">No validation errors.</p>`;
  }

  function renderPreview(all) {
    const box = byId("importPreview");
    box.innerHTML = all.length ? all.slice(0,50).map(item => {
      const q=item.question;
      return `<div class="preview-card ${item.valid?"valid":"invalid"}"><div class="preview-head"><strong>#${item.index}</strong><span>${item.valid?"Valid":"Error"}</span></div><p><b>Q.</b> ${escapeHtml(q.Question)}</p><p><b>A.</b> ${escapeHtml(q.A)}</p><p><b>B.</b> ${escapeHtml(q.B)}</p><p><b>C.</b> ${escapeHtml(q.C)}</p><p><b>D.</b> ${escapeHtml(q.D)}</p><p><b>Answer:</b> ${escapeHtml(q.Answer)}</p><p><b>Explanation:</b> ${escapeHtml(q.Explanation)}</p></div>`;
    }).join("") : "No questions parsed.";
  }

  async function saveValidToDraft() {
    try {
      if (!validRows.length) return Toast.warning("No valid questions to save");
      const payload = {
        Method: currentMode === "text" ? "bulk_text" : currentMode === "csv" ? "csv_upload" : "excel_tsv_paste",
        Source: "Phase 2.3 Import Engine",
        Admin_ID: AdminApp.getAdmin()?.Admin_ID || "",
        Board_ID: value("importBoardSelect"),
        Exam_ID: value("importExamSelect"),
        Subject_ID: value("importSubjectSelect"),
        Topic_ID: value("importTopicSelect"),
        Difficulty: value("importDifficulty"),
        Language: value("importLanguage"),
        questions: validRows
      };
      if (!payload.Board_ID || !payload.Subject_ID || !payload.Topic_ID) return Toast.warning("Select Board, Subject and Topic before saving");
      const data = await ScoreAPI.call("adminBulkDraftQuestions", payload);
      Toast.success(`${data.count} questions saved to DRAFT_QUESTIONS`);
    } catch (err) { Toast.error(err.message); }
  }

  function clearAll() {
    ["bulkTextInput","excelPasteInput"].forEach(id => { if(byId(id)) byId(id).value=""; });
    if(byId("csvFileInput")) byId("csvFileInput").value="";
    validRows=[]; byId("importSummary").innerHTML=""; byId("importErrors").textContent="No import parsed yet."; byId("importPreview").textContent="Parse questions to preview here."; byId("btnSaveImportDrafts").disabled=true;
  }

  function byId(id){ return document.getElementById(id); }
  function value(id){ return byId(id)?.value || ""; }
  function valueText(id){ return byId(id)?.value || ""; }
  function escapeHtml(v){ return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

  document.addEventListener("DOMContentLoaded", init);
  return { init };
})();
