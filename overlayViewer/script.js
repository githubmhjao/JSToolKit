// input csv file should obey this index
const arrayIdx = {
  "wafer-id": 0,
  "pos-x": 1,
  "pos-y": 2,
  "ovl-x": 3,
  "ovl-y": 4,
  "label": 5
};

const file = {
  dataObj: undefined,
  dataArray: undefined,
  filterArray: undefined
};

const state = {
  "wafer-id": undefined,
  "label-x": undefined,
  "label-y": undefined,
  "spc-x": "",
  "spc-y": "",
  "wafer-map-scale": 1,
  "scatter-map-range": 4,
  "scatter-map-tick": 1
};

document.getElementById("input-file").addEventListener("change", handleFile);

document.querySelector(".wrapper.load button").addEventListener("click", () => {
  document.getElementById("input-file").click();
});

["wafer-map", "scatter-map"].forEach(i => {
  document.getElementById(`btn-${i}`).addEventListener("click", () => downloadSVGAsPNG(i, `${i}-${state["wafer-id"]}`))
});

Object.keys(state).forEach(key => {
  document.getElementById(key).addEventListener("change", handleState);
});

function handleState() {
  Object.keys(state).forEach(key => {
    state[key] = document.getElementById(key).value
  })
  console.log(state);
  if (file.dataObj) {
    handleTable();
    handleWafer();
    handleScatter();
  }
}

const primary = window.getComputedStyle(document.documentElement).getPropertyValue("--color-primary");
const secondary = window.getComputedStyle(document.documentElement).getPropertyValue("--color-secondary");
const danger = window.getComputedStyle(document.documentElement).getPropertyValue("--color-danger");

const physicalDimension = 300;

function createRelocate(physicalStart, physicalEnd, clientStart, clientEnd) {
  const scale = (clientEnd - clientStart) / (physicalEnd - physicalStart);
  return p => (p - physicalStart) * scale + clientStart;
}

function handleOOS() {
  document.getElementById("svg-oos-x");
}

function handleScatter() {
  const svg = document.getElementById("scatter-map");
  const svgNS = svg.namespaceURI;
  const relocateX = createRelocate(0, +state["scatter-map-range"], 0.5, 0.9);
  const relocateY = createRelocate(0, +state["scatter-map-range"], 0.5, 0.1);

  const scatters = document.querySelector("#scatter-map g.scatters");
  const ticks = document.querySelector("#scatter-map g.ticks");
  const texts = document.querySelector("#scatter-map g.texts");
  scatters.textContent = "";
  ticks.textContent = "";
  texts.textContent = "";

  scatters.style.stroke = primary;
  scatters.style.fill = primary;

  ticks.style.stroke = secondary;

  const waferId = state["wafer-id"];
  const labelX = state["label-x"];
  const labelY = state["label-y"];
  const range = +state["scatter-map-range"];
  const tick = +state["scatter-map-tick"];
  const count = Math.floor(range / tick);

  [...Array(count)].map((_, i) => {
    [+1, -1].forEach(sign => {
      const tickH = document.createElementNS(svgNS, "line");
      tickH.setAttribute("x1", "10%");
      tickH.setAttribute("x2", "90%");
      tickH.setAttribute("y1", relocateY(sign * tick * (i+1)) * 100 + "%");
      tickH.setAttribute("y2", relocateY(sign * tick * (i+1)) * 100 + "%");
      ticks.appendChild(tickH);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("y", relocateX(sign * tick * (i+1)) * 100 + "%");
      text.setAttribute("x", "5%");
      text.textContent = sign * tick * (i+1);
      texts.appendChild(text);
    });
  });

  [...Array(count)].map((_, i) => {
    [+1, -1].forEach(sign => {
      const tickV = document.createElementNS(svgNS, "line");
      tickV.setAttribute("y1", "10%");
      tickV.setAttribute("y2", "90%");
      tickV.setAttribute("x1", relocateX(sign * tick * (i+1)) * 100 + "%");
      tickV.setAttribute("x2", relocateX(sign * tick * (i+1)) * 100 + "%");
      ticks.appendChild(tickV);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", relocateX(sign * tick * (i+1)) * 100 + "%");
      text.setAttribute("y", "95%");
      text.textContent = sign * tick * (i+1);
      texts.appendChild(text);
    });
  });

  Object.values(file.dataObj[waferId]).forEach(valueObj => {
    if (valueObj.x[labelX] !== undefined && valueObj.y[labelY] !== undefined) {
      const scatter = document.createElementNS(svgNS, "circle");
      const cx = relocateX(+valueObj.x[labelX]) * 100 + "%";
      const cy = relocateY(+valueObj.y[labelY]) * 100 + "%";
      const r = "1%";

      Object.entries({cx, cy, r}).forEach(([key, value]) => {
        scatter.setAttribute(key, value);
      })

      const spcX = state["spc-x"] === "" ? Infinity : +state["spc-x"];
      const spcY = state["spc-y"] === "" ? Infinity : +state["spc-y"];

      if (Math.abs(+valueObj.x[labelX]) > spcX || Math.abs(+valueObj.y[labelY]) > spcY) {
        scatter.style.stroke = danger;
        scatter.style.fill = danger;
      }
      scatters.appendChild(scatter);
    }
  })
}

function handleWafer() {
  const svg = document.getElementById("wafer-map");
  const svgNS = svg.namespaceURI;
  const relocateX = createRelocate(0, physicalDimension / 2, 0.5, 1);
  const relocateY = createRelocate(0, physicalDimension / 2, 0.5, 0);

  const lines = document.querySelector("#wafer-map g.lines");
  lines.textContent = "";
  lines.style.stroke = primary;

  const waferId = state["wafer-id"];
  const labelX = state["label-x"];
  const labelY = state["label-y"];

  Object.entries(file.dataObj[waferId]).forEach(([p, valueObj]) => {
    if (valueObj.x[labelX] !== undefined && valueObj.y[labelY] !== undefined) {
      const line = document.createElementNS(svgNS, "line");
      const x1 = relocateX(+p.split(",")[0]);
      const y1 = relocateY(+p.split(",")[1]);
      const x2 = x1 + +valueObj.x[labelX] * state["wafer-map-scale"] * 0.01;
      const y2 = y1 + +valueObj.y[labelY] * state["wafer-map-scale"] * 0.01;
      
      Object.entries({x1, y1, x2, y2}).forEach(([key, value]) => {
        line.setAttribute(key, value * 100 + "%");
      })

      const spcX = state["spc-x"] === "" ? Infinity : +state["spc-x"];
      const spcY = state["spc-y"] === "" ? Infinity : +state["spc-y"];

      if (Math.abs(+valueObj.x[labelX]) > spcX || Math.abs(+valueObj.y[labelY]) >spcY) {
        line.style.stroke = danger;
      }
      lines.appendChild(line);
    }
  })
}

function handleTable() {
  const table = document.querySelector("table tbody");
  table.textContent = "";

  const waferId = state["wafer-id"];
  const labelX = state["label-x"];
  const labelY = state["label-y"];

  Object.entries(file.dataObj[waferId]).forEach(([p, valueObj]) => {
    if (valueObj.x[labelX] !== undefined && valueObj.y[labelY] !== undefined) {
      const row = document.createElement("tr");
        
      [waferId, p.split(",")[0], p.split(",")[1], valueObj.x[labelX], valueObj.y[labelY]].forEach((c, i) => {
        const col = document.createElement("td");
        col.textContent = i > 0 ? c.slice(0, 5) : c;
        state["spc-x"] !== "" && i === 3 && +state["spc-x"] < Math.abs(+c) && (col.classList.add("oos"), col.classList.add("oos-x"));
        state["spc-y"] !== "" && i === 4 && +state["spc-y"] < Math.abs(+c) && (col.classList.add("oos"), col.classList.add("oos-y"));
        row.appendChild(col);
      })
  
      table.appendChild(row);
    }
  });

  ["oos-x", "oos-y"].forEach(item => {
    const oosCount = +document.querySelectorAll("tbody td." + item).length;
    const totalCount = +document.querySelectorAll("tbody tr").length;
    const percentage = oosCount / totalCount * 100;

    const textTotal = document.createElement("div");
    const oosTotal = document.createElement("div");
    const info = document.getElementById(item);
    const span = document.querySelector(`.wrapper.${item} .svg-container-small div span`);

    textTotal.textContent = `Total: ${totalCount}`;
    oosTotal.textContent = `OOS Count: ${oosCount}`;
    info.textContent = ""
    info.appendChild(textTotal);
    info.appendChild(oosTotal);

    const circle = document.getElementById("svg-"+item);
    const c = 2 * Math.PI* (+circle.getAttribute("r").slice(0, -1));
    circle.style.strokeDasharray = c + "%";
    circle.style.strokeDashoffset = - percentage * 0.01 * c + "%";

    span.textContent = Math.floor(percentage) + "%";
  })
}

function handleFile(e) {
  const csvFile = e.target.files[0];
  const fileReader = new FileReader();

  function handleOption() {
    const waferIds = new Set(file.dataArray.map(r => r[arrayIdx["wafer-id"]]));
    const labels = new Set(file.dataArray.map(r => r[arrayIdx["label"]]));

    const selectElements = {
      "wafer-id": waferIds,
      "label-x": labels,
      "label-y": labels
    };

    Object.entries(selectElements).forEach(([key, value]) => {
      const selectElement = document.getElementById(key);
      selectElement.textContent = "";
      value.forEach((o, i) => {
        const optionElement = document.createElement("option");
        optionElement.textContent = o;
        selectElement.appendChild(optionElement);
        i === 0 && (selectElement.value = o);
      })
    });
  }

  function handleInitialValue() {
    Object.entries(state).forEach(([key, value]) => {
      if (!document.getElementById(key).value) {
        document.getElementById(key).value = value;
      };
    })
  }

  fileReader.addEventListener("load", (e) => {
    const text = e.target.result;
    const rows = text.split("\r\n").slice(1, -1);
    const dataArray = rows.map(r => r.split(","));

    // arr to object
    const dataObj = {};
    dataArray.forEach(r => {
      const waferId = r[arrayIdx["wafer-id"]];
      const posX = +r[arrayIdx["pos-x"]];
      const posY = +r[arrayIdx["pos-y"]];
      const pos = `${posX},${posY}`;
      const label = r[arrayIdx["label"]];
      dataObj[waferId] ?? (dataObj[waferId] = {});
      dataObj[waferId][pos] ?? (dataObj[waferId][pos] = {x: {}, y: {}});
      dataObj[waferId][pos]["x"][label] = r[arrayIdx["ovl-x"]];
      dataObj[waferId][pos]["y"][label] = r[arrayIdx["ovl-y"]];
    });

    file.dataArray = dataArray;
    file.dataObj = dataObj;

    handleOption();
    handleInitialValue();
    handleState();
  });

  if (csvFile) fileReader.readAsText(csvFile);

  document.getElementById("file-name").textContent = csvFile.name;
  console.log(csvFile);
  e.target.value = "";
}

function downloadSVGAsPNG(svgId, name){
  const canvas = document.createElement("canvas");
  const svg = document.getElementById(svgId);
  const base64doc = btoa(unescape(encodeURIComponent(svg.outerHTML)));
  const w = 1000;
  const h = 1000;
  const img_to_download = document.createElement('img');
  img_to_download.src = 'data:image/svg+xml;base64,' + base64doc;
  img_to_download.onload = function () {
    canvas.setAttribute('width', w);
    canvas.setAttribute('height', h);
    const context = canvas.getContext("2d");
    context.drawImage(img_to_download,0,0,w,h);
    const dataURL = canvas.toDataURL('image/png');
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(canvas.msToBlob(), name + ".png");
      e.preventDefault();
    } else {
      const a = document.createElement('a');
      a.download = name + ".png";
      a.href = dataURL;
      a.click();
    }
  }  
}
