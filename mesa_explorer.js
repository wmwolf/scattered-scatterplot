// const body = d3.select("body");
// const svg = body.append("svg").attr("width", 500).attr("height", 400);
// svg
//   .append("circle")
//   .attr("cx", 150)
//   .attr("cy", 75)
//   .attr("r", 50)
//   .attr("fill", "blue");
// svg
//   .append("circle")
//   .attr("cx", 300)
//   .attr("cy", 75)
//   .attr("r", 50)
//   .attr("fill", "blue");
// svg
//   .append("circle")
//   .attr("cx", 225)
//   .attr("cy", 225)
//   .attr("r", 100)
// .attr("fill", "red");
let contents;
let data;
let plotExists = false;
let svg;

let x;
let xAxis;
let y;
let yAxis;
let line;

// Plot area dimensions. Somewhat arbitrary
const w = 600;
const h = 400;
const margin = { top: 10, right: 30, bottom: 30, left: 60 };
const width = w - margin.left - margin.right;
const height = h - margin.top - margin.bottom;

async function loadFile(input) {
  let file = input.files[0];
  let fileReader = new FileReader();
  fileReader.readAsText(file);
  fileReader.onload = () => {
    contents = fileReader.result;
    data = process_data(contents);
    svg = d3
      .select("#plot-area")
      .append("svg")
      .attr("height", h)
      .attr("width", w)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // setup axes
    x = d3.scaleLinear().range([0, width]);
    xAxis = d3.axisBottom().scale(x);
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "x-axis");

    y = d3.scaleLinear().range([height, 0]);
    yAxis = d3.axisLeft().scale(y);
    svg.append("g").attr("class", "y-axis");

    // setup handle for line data
    line = svg.selectAll(".line").enter().data([data.bulk]);

    plot_hr();
  };
  fileReader.onerror = () => {
    alert(fileReader.error);
  };
}
// async function getFile(files) {
//   // open file picker
//   // let [fileHandle] = await window.showOpenFilePicker();
//   // Note: to select a directory, use showDirectoryPicker
//   // let fileData = await fileHandle.getFile();
//   data = process_data(await fileData.text());
//   return data;
// }

// convert MESA output (history or profile) into javascript object
process_data = (file_contents) => {
  const headerNamesLine = 1;
  const headerValsLine = 2;
  const bulkNamesLine = 5;
  const bulkValsStart = bulkNamesLine + 1;
  let headerData = {};
  let bulkData = [];

  // read file contents into an array
  contents = file_contents.trim();
  lines = contents.trim().split("\n");

  // extract header data
  lines[headerNamesLine]
    .trim()
    .split(/\s+/)
    .forEach((key, i) => {
      headerData[key] = lines[headerValsLine]
        .trim()
        .split(/\s+/)
        [i].replace(/"/g, "");
    });

  // extract bulk data into a list of objects
  const bulkNames = lines[bulkNamesLine].trim().split(/\s+/);
  lines.slice(bulkValsStart).forEach((line, k) => {
    let line_data = {};
    line
      .trim()
      .split(/\s+/)
      .forEach((datum, i) => {
        line_data[bulkNames[i]] = parseFloat(datum);
      });
    bulkData.push(line_data);
  });

  return { header: headerData, bulk: bulkData };
};

function plotData(
  xName,
  yName,
  xScale = "linear",
  yScale = "linear",
  xReversed = false,
  yReversed = false
) {
  console.log("in plotData");
  // line = svg.selectAll(".line").data([data.bulk]);
  line = svg.selectAll(".line").data([data.bulk]);
  line
    .enter()
    .append("path")
    // .datum(data.bulk)
    .attr("class", "line")
    .merge(line)
    .transition(1000)
    .attr(
      "d",
      d3
        .line()
        .x((d) => x(d[xName]))
        .y((d) => y(d[yName]))
    )
    .attr("fill", "none")
    .attr("stroke", "DodgerBlue")
    .attr("stroke-width", 2.0);

  // var line = svg
  // .append("path")
  // .datum(data.bulk)
  // .attr("fill", "none")
  // .attr("stroke", "steelblue")
  // .attr("stroke-width", 1.5)
  // .attr(
  // 	"d",
  // 	d3
  // 		.line()
  // 		.x( d => d[xName] )
  // 		.y( d => d[yName] )
  // );
}

function updateAxes(
  xName,
  yName,
  xScale = "linear",
  yScale = "linear",
  xReversed = false,
  yReversed = false
) {
  // set up margins; assuming linear scales for now
  const margin_frac = 0.05;
  let left = d3.min(data.bulk, (d) => d[xName]);
  let right = d3.max(data.bulk, (d) => d[xName]);
  const xMargin = margin_frac * (right - left);
  left = left - xMargin;
  right = right + xMargin;

  let bot = d3.min(data.bulk, (d) => d[yName]);
  let top = d3.max(data.bulk, (d) => d[yName]);
  const yMargin = margin_frac * (top - bot);
  bot = bot - yMargin;
  top = top + yMargin;

  // handle reversals
  if (xReversed) {
    [left, right] = [right, left];
  }
  if (yReversed) {
    [top, bot] = [bot, top];
  }
  x.domain([left, right]);
  y.domain([bot, top]);
  svg.selectAll(".x-axis").transition().duration(1000).call(xAxis);
  svg.selectAll(".y-axis").transition().duration(1000).call(yAxis);
}

function line_plot(
  xName,
  yName,
  xScale = "linear",
  yScale = "linear",
  xReversed = false,
  yReversed = false
) {
  updateAxes(xName, yName, xScale, yScale, xReversed, yReversed);
  plotData(xName, yName, xScale, yScale);
}

function plot_hr() {
  line_plot("log_Teff", "log_L", "linear", "linear", true, false);
}
function plot_Tc_Rhoc() {
  line_plot("log_center_Rho", "log_center_T");
}

document.querySelector("#mesa-input").addEventListener("change", (event) => {
  loadFile(event.target);
});
document.querySelector("#plot-HR").addEventListener("click", (event) => {
  plot_hr();
});
document.querySelector("#plot-Tc-Rhoc").addEventListener("click", (event) => {
  plot_Tc_Rhoc();
});
//       d3.select("#load-data").on('click', (event) => {
//         let files = d3.select('#mesa-input')
//         console.log(files.files)
//         getFile(d3.select('#mesa-input').files[0]).then((result) => {
//
//           data = result;
//         });
//       });
