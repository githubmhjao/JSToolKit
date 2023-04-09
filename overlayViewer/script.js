// define data struction
const columnDefinition = {
  "waferId" : 0,
  "locationX" : 1,
  "locationY" : 2,
  "overlayX" : 3,
  "overlayY" : 4,
  "label" : 5,
}

// initial state
const state = {
  "dataArray": undefined,
  "dataArrayFiltered": undefined,
  "waferId": undefined,
  "show": undefined,
  "labelX": undefined,
  "labelY": undefined,
  "specX": undefined,
  "specY": undefined,
  "scale": undefined,
  "range": undefined,
  "tick": undefined,
}

const physicalDimension = 300;

const primary = window.getComputedStyle(document.documentElement).getPropertyValue("--color-primary");
const secondary = window.getComputedStyle(document.documentElement).getPropertyValue("--color-secondary");
const danger = window.getComputedStyle(document.documentElement).getPropertyValue("--color-danger");

// define element
const inputFileEle = document.querySelector("#input-file");
const selectWaferEle = document.querySelector("#select-wafer");
const selectShowEle = document.querySelector("#select-show");
const selectLabelX = document.querySelector("#select-label-x");
const inputSpecX = document.querySelector("#input-spec-x");
const selectLabelY = document.querySelector("#select-label-y");
const inputSpecY = document.querySelector("#input-spec-y");
const inputScale = document.querySelector("#input-scale");
const inputRange = document.querySelector("#input-range");
const inputTick = document.querySelector("#input-tick");

// add event listener
inputFileEle.addEventListener("change", async (e) => {
  await handleFile(e);
  handleOption();
  handleState();
  handleWafer();
  handleBullEye();
  handleTable();
  handleCount();
});

[selectWaferEle, selectShowEle, selectLabelX, inputSpecX, selectLabelY, inputSpecY, inputScale, inputRange, inputTick].forEach(ele => {
  ele.addEventListener("change", () => {
    handleState();
    handleWafer();
    handleBullEye();
    handleTable();
    handleCount();
  });
})

// define function
function createRelocate(physicalStart, physicalEnd, clientStart, clientEnd) {
  const scale = (clientEnd - clientStart) / (physicalEnd - physicalStart);
  return p => (p - physicalStart) * scale + clientStart;
}

function handleState() {
  state["waferId"] = selectWaferEle.value;
  state["show"] = selectShowEle.options.selectedIndex === -1 ? 
    [...selectShowEle.options].map(x => x.value) : 
    [...selectShowEle.options].filter(x => x.selected).map(x => x.value);

  state["labelX"] = selectLabelX.value;
  state["labelY"] = selectLabelY.value;

  state["dataArrayFiltered"] = state["dataArray"].filter(r => r[columnDefinition["waferId"]] === state["waferId"])
  .filter(r => state["show"].includes(r[columnDefinition["label"]]));

  [
    [inputScale, "scale", 1],
    [inputRange, "range", 6],
    [inputTick, "tick", 2]
  ].forEach(([inputEle, stateKey, defaultValue], i) => {
    const tmpValue = inputEle.value;
    if (tmpValue === "" || isNaN(tmpValue)) inputEle.value = defaultValue;
    state[stateKey] = inputEle.value;
  });

  (inputSpecX.value !== "" || !isNaN(inputSpecX.value)) && (state["specX"] = inputSpecX.value);
  (inputSpecY.value !== "" || !isNaN(inputSpecY.value)) && (state["specY"] = inputSpecY.value);
}

function handleWafer() {
  const labelX = state["labelX"];
  const labelY = state["labelY"];
  const scale = state["scale"];
  const specX = state["specX"];
  const specY = state["specY"];

  const svg = document.getElementById("wafer-map");
  const svgNS = svg.namespaceURI;
  const relocateX = createRelocate(0, physicalDimension / 2, 50, 95);
  const relocateY = createRelocate(0, physicalDimension / 2, 50, 5);

  const lines = document.querySelector("#wafer-map g.lines");
  lines.textContent = "";
  lines.style.stroke = primary;

  state.dataArrayFiltered.forEach(r => {
    const line = document.createElementNS(svgNS, "line");
    const x1 = relocateX(r[columnDefinition["locationX"]]);
    const y1 = relocateY(r[columnDefinition["locationY"]]);
    const ovlX = +r[columnDefinition["overlayX"]];
    const ovlY = +r[columnDefinition["overlayY"]];
    const x2 = x1 + ovlX * scale;
    const y2 = y1 + ovlY * scale;
    
    Object.entries({x1, y1, x2, y2}).forEach(([key, value]) => {
      line.setAttribute(key, value + "%");
    });

    (labelX === r[columnDefinition["label"]]) && (specX && Math.abs(ovlX) > +specX) && (line.style.stroke = danger);
    (labelY === r[columnDefinition["label"]]) && (specY && Math.abs(ovlY) > +specY) && (line.style.stroke = danger);

    lines.appendChild(line);
  });
}

function handleBullEye() {
  const labelX = state["labelX"];
  const labelY = state["labelY"];
  const specX = state["specX"];
  const specY = state["specY"];
  const range = state["range"];
  const tick = state["tick"];
  const count = Math.floor(range / tick);

  const svg = document.getElementById("bull-eye");
  const svgNS = svg.namespaceURI;
  const relocateX = createRelocate(0, range, 50, 90);
  const relocateY = createRelocate(0, range, 50, 10);

  const scatters = document.querySelector("#bull-eye g.scatters");
  const ticks = document.querySelector("#bull-eye g.ticks");
  const texts = document.querySelector("#bull-eye g.texts");
  scatters.textContent = "";
  ticks.textContent = "";
  texts.textContent = "";

  scatters.style.stroke = primary;
  scatters.style.fill = primary;

  ticks.style.stroke = secondary;

  [...Array(count)].map((_, i) => {
    [+1, -1].forEach(sign => {
      const tickH = document.createElementNS(svgNS, "line");
      tickH.setAttribute("x1", "10%");
      tickH.setAttribute("x2", "90%");
      tickH.setAttribute("y1", relocateY(sign * tick * (i+1)) + "%");
      tickH.setAttribute("y2", relocateY(sign * tick * (i+1)) + "%");
      ticks.appendChild(tickH);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("y", relocateX(sign * tick * (i+1)) + "%");
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
      tickV.setAttribute("x1", relocateX(sign * tick * (i+1)) + "%");
      tickV.setAttribute("x2", relocateX(sign * tick * (i+1)) + "%");
      ticks.appendChild(tickV);

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", relocateX(sign * tick * (i+1)) + "%");
      text.setAttribute("y", "95%");
      text.textContent = sign * tick * (i+1);
      texts.appendChild(text);
    });
  });

  state.dataArrayFiltered.forEach(row => {
    const ovlX = +row[columnDefinition["overlayX"]];
    const ovlY = +row[columnDefinition["overlayY"]];
    const scatter = document.createElementNS(svgNS, "circle");
    const cx = relocateX(ovlX) + "%";
    const cy = relocateY(ovlY) + "%";
    const r = "1%";

    Object.entries({cx, cy, r}).forEach(([key, value]) => {
      scatter.setAttribute(key, value);
    });

    (labelX === row[columnDefinition["label"]]) && (specX && Math.abs(ovlX) > +specX) && (scatter.style.fill = danger, scatter.style.stroke = danger);
    (labelY === row[columnDefinition["label"]]) && (specY && Math.abs(ovlY) > +specY) && (scatter.style.fill = danger, scatter.style.stroke = danger);

    scatters.appendChild(scatter);
  });
}

function handleTable() {
  const tableContent = document.querySelector(".card.detail .table-content");
  tableContent.textContent = "";

  const labelX = state["labelX"];
  const labelY = state["labelY"];
  const specX = state["specX"];
  const specY = state["specY"];

  state.dataArrayFiltered.forEach(r => {
    const row = document.createElement("div");
    row.classList.add("row");
    [...r].forEach((c, i) => {
      const col = document.createElement("div");
      col.classList.add("col");

      [columnDefinition["overlayX"], columnDefinition["overlayY"]].includes(i) ?
        col.textContent = parseFloat(c).toFixed(2):
        col.textContent = c;

      row.appendChild(col);
    });

    const ovlX = +r[columnDefinition["overlayX"]];
    const ovlY = +r[columnDefinition["overlayY"]];

    (labelX === r[columnDefinition["label"]]) && (specX && Math.abs(ovlX) > specX) && row.classList.add("oos-x");
    (labelY === r[columnDefinition["label"]]) && (specY && Math.abs(ovlY) > specY) && row.classList.add("oos-y");

    tableContent.appendChild(row);
  });
}

function handleCount() {
  const labelX = state["labelX"];
  const labelY = state["labelY"];
  const specX = state["specX"];
  const specY = state["specY"];

  [
    [specX, labelX, "overlayX", "total-count-x", "oos-count-x", "oos-rate-x", "oos-x"],
    [specY, labelY, "overlayY", "total-count-y", "oos-count-y", "oos-rate-y", "oos-y"]
  ].forEach(([spec, label, overlayKey, totalCount, oosCount, oosRate, svg], _) => {
    if (spec) {
      const tmpArray = state.dataArray.filter(r => r[columnDefinition["label"]] === label);
      const oosArray = tmpArray.filter(r => Math.abs(+r[columnDefinition[overlayKey]]) > +spec);

      document.getElementById(totalCount).value = tmpArray.length;
      document.getElementById(oosCount).value = oosArray.length;
      const rate = (oosArray.length / tmpArray.length);
      document.getElementById(oosRate).value = (rate * 100).toFixed(2) + "%";

      const circle = document.getElementById(svg);
      const c = 2 * Math.PI* parseFloat(circle.getAttribute("r"));
      circle.style.strokeDasharray = c + "%";
      circle.style.strokeDashoffset = - rate * c + "%";

      circle.previousElementSibling.style.stroke = danger;
    } else {
      document.getElementById(totalCount).value = "";
      document.getElementById(oosCount).value = "";
      document.getElementById(oosRate).value = "";

      const circle = document.getElementById(svg);
      circle.style.strokeDasharray = "";
      circle.style.strokeDashoffset = "";
    }
  });
}

function handleOption() {
  const waferIds = [...new Set(state.dataArray.map(r => r[columnDefinition["waferId"]]))].sort();
  const labels = [...new Set(state.dataArray.map(r => r[columnDefinition["label"]]))].sort();
  [
    [selectWaferEle, waferIds], 
    [selectShowEle, labels], 
    [selectLabelX, labels],
    [selectLabelY, labels]
  ].forEach(x => {
    x[0].textContent = "";
    x[1].forEach(value => {
      const optionElement = document.createElement("option");
      optionElement.textContent = value;
      x[0].appendChild(optionElement);
    })
  });

  [inputSpecX, inputSpecY, inputScale, inputRange, inputTick].forEach(ele => ele.value = "");
}

function handleFile(e) {
  const csvFile = e.target.files[0];
  
  if (csvFile) {
    document.querySelector("#pseudo-input-file").value = csvFile.name;
    e.target.value = "";
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onerror = reject;
      fileReader.onload = () => {
        const text = fileReader.result;
        const rows = text.split("\r\n").slice(1, -1);
        state.dataArray = rows.map(r => r.split(","));
        resolve();
      };
      fileReader.readAsText(csvFile);
    })
  }
}
