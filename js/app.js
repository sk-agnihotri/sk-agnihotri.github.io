var DATASET_COLORS, addColorToDataset, errorWrapped, getCurrentViz, getCurrentWorksheet, getTableau, initChart, myChart, 
updateChartWithData, slice = [].slice;

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
  "Same Venue": "green",
  Others: "blue",
  "New Venue": "red",
  "Closed Venue": "yellow"
};

addColorToDataset = function(d, color) {
  d.backgroundColor = color;
  return d.hoverBackgroundColor = color;
};

updateChartWithData = function(datasets) {
  var d, i, j, k, len, len1;
  for (j = 0, len = datasets.length; j < len; j++) {
    d = datasets[j];
    addColorToDataset(d, DATASET_COLORS[d.data[0].Ploc_Category]);
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
        xLabels: ["CY Revenue Actual"],
        yLabels: ["CY Revenue Bud"]
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
                labelString: "CY Revenue Bud"
              }
            }
          ],
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "CY Revenue Actual"
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
    var Ploc_Category, CY Revenue Bud, CY Revenue Actual, c, colIdxMaps, graphDataByCategory, j, len, ref, toChartEntry;
    colIdxMaps = {};
    ref = table.getColumns();
    for (j = 0, len = ref.length; j < len; j++) {
      c = ref[j];
      colIdxMaps[c.getFieldName()] = c.getIndex();
    }
    Ploc_Category = colIdxMaps.Ploc_Category, CY Revenue Actual = colIdxMaps.CY Revenue Actual, CY Revenue Bud = colIdxMaps.CY Revenue Bud;
    toChartEntry = function(d) {
      return {
        x: parseFloat(d[CY Revenue Actual].value).toFixed(2),
        y: parseFloat(d[CY Revenue Bud].value).toFixed(2),
        Ploc_Category: d[Ploc_Category].value,
        r: 5
      };
    };
    graphDataByCategory = _.chain(table.getData()).map(toChartEntry).groupBy("Ploc_Category").map(function(data, label) {
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