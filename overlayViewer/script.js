// declare file related data
let file = {
  dataObj: {},
  option: [{}, {}, {}] 
};

// declare state
let state = {
  waferId: undefined, 
  xTargetLabel: undefined, 
  yTargetLabel: undefined, 
  xSpec: undefined, 
  ySpec: undefined,
  multiplier: 1,
  range: 4, 
  tick: 2
};

const physicalConstant = 300;

document.getElementById("file").addEventListener("change", handleFile);

Object.keys(state).forEach(k => {
  document.getElementById(k).addEventListener("change", handleChange)
});

function handleChange(e) {
  state[e.target.id] = e.target.value;
  handleState();
}

function handleState() {
  handleTable();
  handleWaferViewer();
  handleScatterViewer();  
}

function createRelocate(physicalLocation, clientLocation, scale) {
  return (p) => (p - physicalLocation) * scale + clientLocation;
}

function handleScatterViewer() {
  const svg = document.getElementById("scatterViewer");
  const svgNS = svg.namespaceURI;
  const size = svg.clientHeight;
  const {range, tick} = state;
  const count = Math.floor(range / tick);

  const circles = svg.querySelector(".circles");
  circles.textContent = "";
  
  const dataObj = file.dataObj;
  const relocateX = createRelocate(0, size/2, size/range/2);
  const relocateY = createRelocate(0, size/2, -size/range/2);

  Object.keys(dataObj[state.waferId]).forEach(p => {
    const circle = document.createElementNS(svgNS, "circle");
    const xOVL = dataObj[state.waferId][p]["x"][state.xTargetLabel];
    const yOVL = dataObj[state.waferId][p]["y"][state.yTargetLabel];
    if (xOVL !== undefined && yOVL !== undefined) {
      const cx = relocateX(+xOVL);
      const cy = relocateY(+yOVL);
      const r = 2;
  
      Object.entries({cx, cy, r}).forEach(([key, value]) => {
        circle.setAttribute(key, value)
      });
  
      +state.xSpec && Math.abs(+xOVL) > +state.xSpec && circle.classList.add("oos");
      +state.ySpec && Math.abs(+yOVL) > +state.ySpec && circle.classList.add("oos");
  
      circles.appendChild(circle);
    }
  });

  [...Array(count)].forEach((_, i) => {
    [+1, -1].forEach(sign => {
      const tickPosition = sign * (i + 1) * tick;
  
      const lineH = document.createElementNS(svgNS, "line");
      lineH.setAttribute("x2", "100%");
      lineH.setAttribute("style", `transform:translateY(${relocateY(tickPosition)}px)`);
      circles.appendChild(lineH);
  
      const lineV = document.createElementNS(svgNS, "line");
      lineV.setAttribute("y2", "100%");
      lineV.setAttribute("style", `transform:translateX(${relocateX(tickPosition)}px)`);
      circles.appendChild(lineV);

      const textH = document.createElementNS(svgNS, "text");
      textH.setAttribute("x", "-5%");
      textH.setAttribute("y", "0");
      textH.setAttribute("style", `transform:translateY(${relocateY(tickPosition)}px)`);
      textH.textContent = sign * (i + 1) * tick;
      circles.appendChild(textH);

      const textV = document.createElementNS(svgNS, "text");
      textV.setAttribute("x", "0");
      textV.setAttribute("y", "105%");
      textV.setAttribute("style", `transform:translateX(${relocateX(tickPosition)}px)`);
      textV.textContent = sign * (i + 1) * tick;
      circles.appendChild(textV);
    })
  });

  ["range", "tick"].forEach(s => {
    document.getElementById(s).value = state[s];
  })
}

function handleWaferViewer() {
  const svg = document.getElementById("waferViewer");
  const svgNS = svg.namespaceURI;
  const size = svg.clientHeight;
  const lines = svg.querySelector(".lines");
  lines.textContent = "";
  const dataObj = file.dataObj;
  const relocateX = createRelocate(0, size/2, size/physicalConstant);
  const relocateY = createRelocate(0, size/2, -size/physicalConstant);
  Object.keys(dataObj[state.waferId]).forEach(p => {
    const line = document.createElementNS(svgNS, "line");
    const [x1, y1] = p.split(",");
    const xOVL = dataObj[state.waferId][p]["x"][state.xTargetLabel];
    const yOVL = dataObj[state.waferId][p]["y"][state.yTargetLabel];
    if (xOVL !== undefined && yOVL !== undefined) {
      const x2 = +x1 + +xOVL * state.multiplier;
      const y2 = +y1 + +yOVL * state.multiplier;

      [{x1, y1}, {x2, y2}].forEach(p => {
        line.setAttribute(Object.keys(p)[0], relocateX(+Object.values(p)[0]));
        line.setAttribute(Object.keys(p)[1], relocateY(+Object.values(p)[1]));
      })
  
      +state.xSpec && Math.abs(+xOVL) > +state.xSpec && line.classList.add("oos");
      +state.ySpec && Math.abs(+yOVL) > +state.ySpec && line.classList.add("oos");
  
      lines.appendChild(line);
    }
  });
  
  ["multiplier"].forEach(s => {
    document.getElementById(s).value = state[s];
  });
}

function handleTable() {
  const tbody = document.getElementById("data").querySelector("tbody");
  Array.prototype.slice.call(tbody.querySelectorAll("tr"), 3).forEach(el => {
    tbody.removeChild(el);
  });

  console.log(state);

  Object.keys(file.dataObj[state.waferId]).forEach(p => {
    const tr = document.createElement("tr");
    const waferId = state.waferId;
    const [xPos, yPos] = p.split(",");
    const xOvl = file.dataObj[waferId][p]["x"][state.xTargetLabel];
    const yOvl = file.dataObj[waferId][p]["y"][state.yTargetLabel];
    if (xOvl !== undefined && yOvl !== undefined) {
      [waferId, xPos, yPos, xOvl, yOvl].forEach((c, i) => {
        const td = document.createElement("td");
        td.textContent = (i > 2) ? c.slice(0, 4) : c;
        +state.xSpec && i === 3 && Math.abs(+xOvl) > +state.xSpec && td.classList.add("oos");
        +state.ySpec && i === 4 && Math.abs(+yOvl) > +state.ySpec && td.classList.add("oos");
        tr.appendChild(td);
      })
      tbody.appendChild(tr);
    }
  })
}

function handleFile(e) {
  const csvFile = e.target.files[0];
  const fileReader = new FileReader();
  
  function handleArray(arr) {
    const obj = {};
    const opt = [{}, {}, {}];
    arr.forEach(r => {
      const waferId = r[0];
      const pos = `${r[1]},${r[2]}`;
      const [xOvl, yOvl] = [r[3], r[4]];
      const targetLabel = r[5];

      obj[waferId] ??= {};
      obj[waferId][pos] ??= {"x": {}, "y": {}};
      obj[waferId][pos]["x"][targetLabel] = xOvl;
      obj[waferId][pos]["y"][targetLabel] = yOvl;

      opt[0].hasOwnProperty(waferId) || (opt[0][waferId] = true);
      opt[1].hasOwnProperty(targetLabel) || (opt[1][targetLabel] = true);
      opt[2].hasOwnProperty(targetLabel) || (opt[2][targetLabel] = true);
    })
    return [obj, opt]
  }

  function handleOption(opt) {
    const waferIdSel = document.getElementById("waferId");
    const xTargetLabelSel = document.getElementById("xTargetLabel");
    const yTargetLabelSel = document.getElementById("yTargetLabel");

    [waferIdSel, xTargetLabelSel, yTargetLabelSel].forEach((el, i) => {
      el.textContent = "";
      Object.keys(opt[i]).forEach((o, order) => {
        const optionElement = document.createElement("option");
        optionElement.textContent = o;
        el.appendChild(optionElement);
        order === 0 && (el.value = o);
      })
    })
  }

  fileReader.addEventListener("load", (e) => {
    const text = e.target.result;
    const rows = text.split("\r\n").slice(1, -1);
    const array = rows.map(r => r.split(","));
    const [obj, option] = handleArray(array);
    file.dataObj = obj;
    file.option = option;
    
    handleOption(option);
    ["waferId", "xTargetLabel", "yTargetLabel"].forEach((s, i) => {
      state[s] = document.getElementById(s).value;
    });

    handleState();
  })

  if (csvFile) {
    fileReader.readAsText(csvFile);
  }

  e.target.value = "";
}
