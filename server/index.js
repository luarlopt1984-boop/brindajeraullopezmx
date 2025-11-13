const express = require('express');
const JSZip = require('jszip');
const Papa = require('papaparse');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const CAT_URL_ZIP = 'https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461173677333&ssbinary=true';
const SAT_BLOB_BLACKLIST = 'https://www.sat.gob.mx/cs/Satellite?blobcol=urldata&blobkey=id&blobtable=MungoBlobs&blobwhere=1461173680198&ssbinary=true';

function normalizeList(arr){
  return arr.map(obj=>{
    const keys = Object.keys(obj);
    const claveKey = keys.find(k=>/clave/i.test(k)) || keys[0];
    const descKey = keys.find(k=>/descri|concepto|descripcion|nombre/i.test(k)) || keys[1] || keys[0];
    return { clave: (obj[claveKey]||'').trim(), descripcion: (obj[descKey]||'').trim(), raw: obj };
  });
}

app.get('/api/catalogs', async (req, res) => {
  try{
    const r = await fetch(CAT_URL_ZIP);
    if(!r.ok) return res.status(502).json({error:'failed to fetch remote zip'});
    const buffer = await r.arrayBuffer();
    const zip = await JSZip.loadAsync(Buffer.from(buffer));
    const files = Object.keys(zip.files);
    const actFile = files.find(n=>/ActividadEconomica/i.test(n) || /Actividad/i.test(n) || /actividad/i.test(n));
    const prodFile = files.find(n=>/ClaveProdServ/i.test(n) || /ClaveProd/i.test(n) || /ProdServ/i.test(n));
    if(!actFile || !prodFile) return res.status(500).json({error:'CSV files not found in zip', files});
    const csvAct = await zip.file(actFile).async('string');
    const csvProd = await zip.file(prodFile).async('string');
    const parsedAct = Papa.parse(csvAct, {header:true, skipEmptyLines:true});
    const parsedProd = Papa.parse(csvProd, {header:true, skipEmptyLines:true});
    const actividades = normalizeList(parsedAct.data);
    const productos = normalizeList(parsedProd.data);
    res.json({actividades, productos});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

app.get('/api/valida-rfc', async (req, res) => {
  const rfc = (req.query.rfc||'').toUpperCase();
  if(!rfc) return res.status(400).json({error:'rfc required'});
  try{
    const url1 = `https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?re=${rfc}&rr=AAA010101AAA&tt=0&id=0`;
    const resp1 = await fetch(url1);
    const ok = resp1.status === 200;
    const resp2 = await fetch(SAT_BLOB_BLACKLIST);
    const txt = await resp2.text();
    const black = txt.includes(rfc);
    res.json({ok, black});
  }catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Brindaje proxy listening on ${PORT}`));
