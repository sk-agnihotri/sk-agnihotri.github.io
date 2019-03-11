var DATASET_COLORS, addColorToDataset, errorWrapped, getCurrentViz, getCurrentWorksheet, getTableau, initChart, myChart, updateChartWithData,
  slice = [].slice;

myChart = null;

getTableau = function() {
  return parent.parent.tableau;
};

getCurrentViz = function() {
  return getTableau().VizManager.getVizs()[0];
};

getCurrentWorksheet = function() {
  return getCurrentViz().getWorkbook().getActiveSheet().getWorksheets()[0];
};

errorWrapped = function(context, fn) {
  return function() {
    var args, err, error;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    try {
      return fn.apply(null, args);
    } catch (error) {
      err = error;
      return console.error("Got error during '", context, "' : ", err);
    }
  };
};

DATASET_COLORS = {
  "Furniture": "green",
  Technology: "red",
  "Office Supplies": "blue"
};

addColorToDataset = function(d, color) {
  d.backgroundColor = color;
  return d.hoverBackgroundColor = color;
};

updateChartWithData = function(datasets) {
  var d, i, j, k, len, len1;
  for (j = 0, len = datasets.length; j < len; j++) {
    d = datasets[j];
    addColorToDataset(d, DATASET_COLORS[d.data[0].variety]);
  }
  if (myChart) {
    for (i = k = 0, len1 = datasets.length; k < len1; i = ++k) {
      d = datasets[i];
      _.extend(myChart.data.datasets[i], d);
    }
    return myChart.update();
  } else {
    return myChart = new Chart(document.getElementById("chart"), {
      type: "scatter",
      data: {
        datasets: datasets,
        xLabels: ["Sold"],
        yLabels: ["Gain"]
      },
      options: {
        animation: {
          duration: 5000
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Gain"
              }
            }
          ],
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Sold"
              }
            }
          ]
        }
      }
    });
  }
};

initChart = function() {
  var onDataLoadError, onDataLoadOk, tableau, updateChart;
  tableau = getTableau();
  onDataLoadError = function(err) {
    return console.err("Error during Tableau Async request:", err);
  };
  onDataLoadOk = errorWrapped("Getting data from Tableau", function(table) {
    var Variety, Gain, Sold, c, colIdxMaps, graphDataByCategory, j, len, ref, toChartEntry;
    colIdxMaps = {};
    ref = table.getColumns();
    for (j = 0, len = ref.length; j < len; j++) {
      c = ref[j];
      colIdxMaps[c.getFieldName()] = c.getIndex();
    }
    Variety = colIdxMaps.Variety, Sold = colIdxMaps.Sold, Gain = colIdxMaps.Gain;
    toChartEntry = function(d) {
      return {
        x: parseFloat(d[Sold].value).toFixed(2),
        y: parseFloat(d[Gain].value).toFixed(2),
        variety: d[Variety].value,
        r: 10
      };
    };
    graphDataByCategory = _.chain(table.getData()).map(toChartEntry).groupBy("variety").map(function(data, label) {
      return {
        label: label,
        data: data
      };
    }).value();
    return errorWrapped("Updating the chart", updateChartWithData)(graphDataByCategory);
  });
  updateChart = function() {
    return getCurrentWorksheet().getUnderlyingDataAsync({
      maxRows: 0,
      ignoreSelection: false,
      includeAllColumns: true,
      ignoreAliases: true
    }).then(onDataLoadOk, onDataLoadError);
  };
  return getCurrentViz().addEventListener(tableau.TableauEventName.MARKS_SELECTION, updateChart);
};

this.appApi = {
  initChart: initChart,
  myChart: myChart
};
