function esc(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function readPayload(){
  try { return JSON.parse(localStorage.getItem('bt_report_payload') || 'null'); }
  catch(e) { return null; }
}


async function downloadStyledPDF(){
  const status = document.getElementById('pdfStatus');
  const card = document.querySelector('.report-card');
  if(!card){ alert('Report is not ready yet.'); return; }
  if(!window.html2canvas || !window.jspdf){
    alert('PDF exporter is still loading. Please wait 3 seconds and try again. Internet should be on.');
    return;
  }
  try{
    if(status) status.style.display = 'block';
    document.body.classList.add('pdf-exporting');
    await new Promise(r => setTimeout(r, 250));
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight
    });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 6;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    let imgW = maxW;
    let imgH = canvas.height * imgW / canvas.width;
    if(imgH > maxH){
      imgH = maxH;
      imgW = canvas.width * imgH / canvas.height;
    }
    const x = (pageW - imgW) / 2;
    const y = (pageH - imgH) / 2;
    pdf.addImage(imgData, 'PNG', x, y, imgW, imgH, undefined, 'FAST');
    const safeName = (document.querySelector('.hero h1')?.textContent || 'BioTracker_Report').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
    pdf.save(`${safeName || 'BioTracker_Report'}.pdf`);
  }catch(e){
    console.error(e);
    alert('Styled PDF could not be created. Try again after the report image fully loads.');
  }finally{
    document.body.classList.remove('pdf-exporting');
    if(status) status.style.display = 'none';
  }
}

function renderReport(){
  const data = readPayload();
  const root = document.getElementById('reportRoot');
  if(!data){
    root.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;padding:30px;background:#0f172a;color:white;font-family:Inter,sans-serif"><div style="max-width:680px;text-align:center"><h1 style="margin-bottom:10px">No report data found</h1><p>Open a scan result or search result first, then click <b>Download PDF Report</b>.</p><button onclick="window.close()" style="margin-top:16px;padding:12px 18px;border:none;border-radius:12px;font-weight:700;cursor:pointer">Close</button></div></div>';
    return;
  }

  const theme = data.theme === 'plant' ? 'plant' : 'animal';
  const icon = theme === 'plant' ? '🌿' : '🦁';
  const titleLine = theme === 'plant' ? 'Botanical Identification Report' : 'Wildlife Identification Report';
  const bullets = Array.isArray(data.bullets) && data.bullets.length
    ? data.bullets
    : ['Observation summary was not available for this report.'];

  const collegeName = data.collegeName || 'Graphic Era Deemed to be University';
  const projectName = data.projectName || 'BioTracker AI – Biodiversity Conservation Web App';
  const developerName = data.developerName || 'Ayush Negi';
  const reportFor = data.userName || 'Guest User';
  const appName = data.appName || 'BioTracker AI';
  const title = data.title || 'Species Report';
  const scientificName = data.scientificName || title;
  const category = data.category || 'Species';
  const confidence = data.confidence || 'AI result ready';
  const dateText = data.dateText || new Date().toLocaleString();
  const intro = data.intro || 'This styled report was generated from the BioTracker identification result.';

  root.innerHTML = `
    <div class="report-shell ${theme}">
      <div class="decor d1"></div>
      <div class="decor d2"></div>
      <div class="logo-watermark"><img src="assets/graphic-era-logo.png" alt="Graphic Era Logo"></div>
      <div class="app-watermark">${esc(appName)}</div>

      <div class="report-card ${theme}">
        <div class="top-brand-bar">
          <div class="brand-left">
            <img class="college-logo" src="assets/graphic-era-logo.png" alt="Graphic Era University Logo">
            <div class="brand-text">
              <h2>${esc(collegeName)}</h2>
              <p><strong>Project:</strong> ${esc(projectName)}<br><strong>Prepared by:</strong> ${esc(developerName)}</p>
            </div>
          </div>
          <div class="brand-side">
            <div class="mini-label">Official Report Layout</div>
            <p><strong>Report for:</strong> ${esc(reportFor)}<br><strong>Generated:</strong> ${esc(dateText)}</p>
          </div>
        </div>

        <div class="hero ${theme}">
          <div>
            <div class="badge-row">
              <span class="badge">${icon} ${esc(appName)}</span>
              <span class="badge">${esc(titleLine)}</span>
            </div>
            <h1>${esc(title)}</h1>
            <p>${esc(intro)}</p>
            <div class="badge-row">
              <span class="badge">Category: ${esc(category)}</span>
              <span class="badge">Scientific name: ${esc(scientificName)}</span>
              <span class="badge">${esc(confidence)}</span>
            </div>
          </div>
          <div class="hero-actions">
            <button class="hero-btn primary" onclick="downloadStyledPDF()">Download Styled PDF</button>
            <button class="hero-btn secondary" onclick="window.print()">Print</button>
            <button class="hero-btn secondary" onclick="window.close()">Close</button>
          </div>
        </div>

        <div class="body-grid">
          <div class="image-card">
            <h3 class="section-title">Uploaded / Captured Image</h3>
            ${data.image ? `<img src="${esc(data.image)}" alt="Report Image">` : `<div class="placeholder">No image preview</div>`}
          </div>

          <div class="info-card">
            <h3 class="section-title">Detailed Observation Summary</h3>
            <p class="narrative">This styled report was generated from the ${esc(appName)} identification result. It is designed for presentation, print, and PDF export. The report combines the detected name, scientific name, category, confidence note, and descriptive knowledge points so the user can keep a proper record of the scanned subject in a professional format.</p>
            <div class="meta-grid">
              <div class="meta-item"><span>Identified name</span><strong>${esc(title)}</strong></div>
              <div class="meta-item"><span>Scientific name</span><strong>${esc(scientificName)}</strong></div>
              <div class="meta-item"><span>Category</span><strong>${esc(category)}</strong></div>
              <div class="meta-item"><span>Generated on</span><strong>${esc(dateText)}</strong></div>
              <div class="meta-item"><span>Confidence / note</span><strong>${esc(confidence)}</strong></div>
              <div class="meta-item"><span>Prepared for</span><strong>${esc(reportFor)}</strong></div>
              <div class="meta-item"><span>College</span><strong>${esc(collegeName)}</strong></div>
              <div class="meta-item"><span>Project owner</span><strong>${esc(developerName)}</strong></div>
            </div>
            <h3 class="section-title">Descriptive Highlights</h3>
            <ul class="bullet-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
          </div>
        </div>

        <div class="footer-note">Tip: Click <b>Download / Print PDF</b> and choose <b>Save as PDF</b> in the print dialog for a polished downloadable report with your college branding and BioTracker watermark.</div>
      </div>
    </div>`;
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderReport); else renderReport();
