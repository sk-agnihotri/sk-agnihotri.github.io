var DATASET_COLORS, addColorToDataset, errorWrapped, getCurrentViz, getCurrentWorksheet, getTableau, initChart, myChart, updateChartWithData,
  slice = [].slice;

/* myChart = null;

*/getTableau = function() {
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
  "Karen Quill": "red",
  "Kevin Wanamaker": "green",
  "Offsite": "yellow",
  "Scott Nodsle": "tan",
  "Scott Tomlinson": "blue",
  "Tim Gray": "purple",
  "Todd Hester": "orange",
  "Tom Povich": "navy",
  "NULL": "red"
};

addColorToDataset = function(d, color) {
  d.backgroundColor = color;
  return d.hoverBackgroundColor = color;
};

updateChartWithData = function(datasets) {
  var d, i, j, k, len, len1;
  for (j = 0, len = datasets.length; j < len; j++) {
    d = datasets[j];
    addColorToDataset(d, DATASET_COLORS[d.data[0].DVP]);
  }
  if (myChart) {
    for (i = k = 0, len1 = datasets.length; k < len1; i = ++k) {
      d = datasets[i];
      _.extend(myChart.data.datasets[i], d);
    }
    return myChart.update();
  } else {
    return myChart = new Chart(document.getElementById("chart"), {
      type: "bubble",
      data: {
        datasets: datasets,
        xLabels: ["CYMTD_Detractor"],
        yLabels: ["CYMTD_Promoter"]
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
                labelString: "CYMTD_Promoter"
              }
            }
          ],
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "CYMTD_Detractor"
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
    var DVP, CYMTD_Promoter, CYMTD_Detractor, c, colIdxMaps, graphDataByCategory, j, len, ref, toChartEntry;
    colIdxMaps = {};
    ref = table.getColumns();
    for (j = 0, len = ref.length; j < len; j++) {
      c = ref[j];
      colIdxMaps[c.getFieldName()] = c.getIndex();
    }
    DVP = colIdxMaps.DVP, CYMTD_Detractor = colIdxMaps.CYMTD_Detractor, CYMTD_Promoter = colIdxMaps.CYMTD_Promoter;
    toChartEntry = function(d) {
      return {
		DVP: d[DVP].value,
        x: parseFloat(d[CYMTD_Detractor].value).toFixed(2),
        y: parseFloat(d[CYMTD_Promoter].value).toFixed(2),
        r: 5
      };
    };
    graphDataByCategory = _.chain(table.getData()).map(toChartEntry).groupBy("DVP").map(function(data, label) {
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
