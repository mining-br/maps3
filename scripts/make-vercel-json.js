const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const cityCsvPath = path.join("data", "rigeo_city_sheet.csv");
const sheetsCsvPath = path.join("data", "rigeo_sheets_master.csv");
const outPath = path.join("data", "vercel_data.json");

function normUF(s){return String(s||"").trim().toUpperCase();}
function normCode(s){return String(s||"").trim().replace(/\s+/g," ").replace(/[.]/g,"-");}
function loadCSV(p){return parse(fs.readFileSync(p,"utf-8"),{columns:true,skip_empty_lines:true});}
function splitCodes(s){return s?String(s).split(";").map(x=>normCode(x)).filter(Boolean):[];}

function indexSheetsByUFandCode(rows){
  const ix={};
  for(const r of rows){
    const uf=normUF(r.uf);
    const scale=String(r.scale||"");
    const code=normCode(r.sheet_code||r.code||"");
    if(!uf||!code) continue;
    const entry={
      code,
      title:r.sheet_title||r.title||"",
      year:r.year||"",
      links:{
        geologia:r.pdf_geologia_url||"",
        recursos:r.pdf_recursos_url||"",
        relatorio:r.pdf_relatorio_url||"",
        sig:r.sig_zip_url||"",
        acervo:r.acervo_url||""
      },
      _scale:scale
    };
    ix[uf]??={};
    ix[uf][code]??=[];
    ix[uf][code].push(entry);
  }
  return ix;
}
const pickByScale=(arr,scale)=> (arr||[]).filter(x=>x._scale===scale).map(({_scale,...rest})=>rest);

(function build(){
  if(!fs.existsSync(cityCsvPath)||!fs.existsSync(sheetsCsvPath)){
    console.error("Coloque rigeo_city_sheet.csv e rigeo_sheets_master.csv em /data/");
    process.exit(1);
  }
  const cityRows=loadCSV(cityCsvPath);
  const sheetRows=loadCSV(sheetsCsvPath);
  const idx=indexSheetsByUFandCode(sheetRows);
  const out={};

  for(const r of cityRows){
    const uf=normUF(r.uf);
    const city=String(r.city_name||r.city||"").trim();
    if(!uf||!city) continue;

    const ce={"250k":[],"100k":[],"50k":[]};
    for(const code of splitCodes(r.sheets_250k)) ce["250k"].push(...pickByScale(idx[uf]?.[code], "1:250000"));
    for(const code of splitCodes(r.sheets_100k)) ce["100k"].push(...pickByScale(idx[uf]?.[code], "1:100000"));
    for(const code of splitCodes(r.sheets_50k))  ce["50k"].push (...pickByScale(idx[uf]?.[code], "1:50000"));

    out[uf]??={};
    out[uf][city]=ce;
  }

  fs.writeFileSync(outPath, JSON.stringify(out,null,2), "utf-8");
  console.log("OK ->", outPath);
})();
